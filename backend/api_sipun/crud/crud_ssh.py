import aiohttp
import asyncssh
from bs4 import BeautifulSoup
from datetime import datetime
import re
from pathlib import Path
import os
from redconf import redis_client
import logging
from decorators import save_to_html
from fastapi import Request, HTTPException, status, Depends
from user.models import User, server_list, extreg_list
from user.auth import get_current_user, get_token
from user.dao import UsersDAO
import tempfile
import sqlalchemy
from database import async_session_maker


async def get_csrf_token(session):
    async with session.get("https://exemple.com/ru_RU/login") as resp:
        login_CSRF = await resp.text()
        soup_CSRF = BeautifulSoup(login_CSRF, "html.parser")
        return soup_CSRF.find("input", id="login__token").get("value")


async def login_to_sipuni(session, csrf_token):
    login_data = {
        "login[username_email]": "mail@mail.ru",
        "login[password]": "password",
        "login[_token]": csrf_token,
    }
    return await session.post("https://exemple.com/ru_RU/login", data=login_data)


async def get_authorized_session(session: aiohttp.ClientSession):
    csrf_token = await get_csrf_token(session)
    auth = await login_to_sipuni(session, csrf_token)
    authadm = await session.get("https://exemple.com/manage/")
    if authadm.status != 200:
        logging.error("Authorization failed")
        return None  # Возвращаем None вместо logging.error
    return session


async def fetch_callstat(authorized_session: aiohttp.ClientSession, url):
    async with authorized_session.get(url) as resp:
        try:
            response_text = await resp.text()
            soup = BeautifulSoup(response_text, "html.parser")
            table = soup.find(
                "table", class_="table table-bordered table-striped sonata-ba-list"
            )
            headers = [
                header.get_text(strip=True)
                for header in table.find("thead").find_all("th")
            ]
            rows = table.find("tbody").find_all("tr")
            data_list = [
                {headers[i]: cols[i].get_text(strip=True) for i in range(len(cols))}
                for row in rows
                if (cols := row.find_all("td"))
            ]
            return data_list
        except Exception as e:
            return {"error": str(e)}


async def get_ip_extreg(extreg_id):
    async with async_session_maker() as session:
        extreg_adress = await session.scalar(
            sqlalchemy.select(extreg_list.extreg_adress).where(
                extreg_list.id == int(extreg_id)
            )
        )
    return extreg_adress


async def get_ip_and_port_server(server_id):
    async with async_session_maker() as session:
        ip_address_port = await session.scalar(
            sqlalchemy.select(server_list.server_adress).where(
                server_list.id == int(server_id)
            )
        )

    # Инициализируем переменные
    if ip_address_port is None:
        return HTTPException(
            status_code=200, detail="Не найден ip сервера. id сервера {server_id}"
        )
    logging.debug(f"ip_address_port: {ip_address_port}")
    if 0 <= int(server_id) <= 2999:
        port = 22
        ip_address = ip_address_port
    else:  # Если id равен 1
        if ip_address_port:  # Проверяем, что ip_address_port не None
            # Разделяем ip_address и port
            ip_address, port = (
                ip_address_port.split(":") if ip_address_port else (None, None)
            )

        # Устанавливаем порт в зависимости от id сервера
        if 3000 <= int(server_id) < 9000:  # Если id от 3000 до 8999
            port = int(f"2{port}") if port else 22  # Добавляем 2 к порту
        else:
            port = int(port) if port else 22  # Иначе оставляем порт 22

    logging.debug(f"ip_address: {ip_address} port: {port}")
    return ip_address, port


async def run_ssh_jumphost(ip_address, port, command, Login_ssh, key_ssh, ip):
    logging.debug(
        f"ip_address: {ip_address} port: {port} command: {command} Login_ssh: {Login_ssh}"
    )

    # Создаем временный файл для SSH-ключа
    with tempfile.NamedTemporaryFile(delete=False) as key_file:
        key_file.write(key_ssh.encode("utf-8"))  # Записываем ключ в файл
        key_file_path = key_file.name  # Получаем путь к файлу

    try:
        # Подключаемся к jumphost и используем его как туннель
        async with asyncssh.connect(
            ip_address,
            port=port,
            username=Login_ssh,
            client_keys=[key_file_path],
            agent_forwarding=True,
            known_hosts=None,
        ) as jumphost_conn:
            # Создаем подключение к целевому хосту через jumphost
            async with asyncssh.connect(
                ip,  # Замените на IP или имя целевого хоста
                username=Login_ssh,
                client_keys=[key_file_path],
                known_hosts=None,
                tunnel=jumphost_conn,  # Используем jumphost как туннель
            ) as target_conn:
                # Выполняем команду на целевом хосте
                result = await target_conn.run(command)
                return result.stdout
    except Exception as e:
        logging.error(f"SSH command execution failed: {e}")
    finally:
        # Удаляем временный файл ключа
        if os.path.exists(key_file_path):
            os.remove(key_file_path)


async def run_ssh_command(ip_address, port, command, Login_ssh, key_ssh):
    logging.debug(
        f"ip_address: {ip_address} port: {port} command: {command} Login_ssh: {Login_ssh} key_ssh: {key_ssh}"
    )
    with tempfile.NamedTemporaryFile(delete=False) as key_file:
        key_file.write(key_ssh.encode("utf-8"))  # Записываем ключ в файл
        key_file_path = key_file.name  # Получаем путь к файлу
    try:
        async with asyncssh.connect(
            ip_address,
            port=port,
            username=Login_ssh,
            client_keys=[key_file_path],
            known_hosts=None,
            agent_forwarding=True,
        ) as conn:
            result = await conn.run(command)
            return result.stdout
    except Exception as e:
        logging.error(f"SSH command execution failed: {e}")
        raise
    finally:
        os.remove(key_file_path)  # Удаляем временный файл с ключом


async def events_ats(call_id: str, user_data):
    logging.debug(f"call_id: {user_data.email} asd {user_data.sipun_password}sdasd")
    async with aiohttp.ClientSession() as session:
        authorized_session = await get_authorized_session(session)
        if authorized_session is None:
            raise HTTPException(status_code=200, detail="Authorization failed")
        data_list = await fetch_callstat(
            authorized_session,
            f"https://exemple.com/support/callstatv4/list?filter%5BuniqueId%5D%5Bvalue%5D={call_id}",
        )
        server_id = data_list[0]["serverId"]
        timestamp = data_list[0]["timestamp"]

        ip_address, port = await get_ip_and_port_server(server_id)
        if not ip_address:
            return HTTPException(status_code=200, detail="Адрес АТС не найден")
            # {'error': f'Не найден ip сервера. id сервера {server_id}'}

        logging.debug(f"ip сервера {ip_address}")
        try:
            # Копируем файл crmproxy в корневую папку пользователя
            result2 = await run_ssh_command(
                ip_address,
                port,
                "ls /var/log",
                Login_ssh=user_data.Login_ssh,
                key_ssh=user_data.key_ssh,
            )
            logging.debug(f"Список файлов: {result2}")

            # Фильтруем файлы, начинающиеся с "crmproxy"
            files = [
                line
                for line in result2.strip().split("\n")
                if line.startswith("crmproxy")
            ]
            logging.debug(f"Файлы crmproxy: {files}")

            # Преобразуем метку времени в объект datetime
            timestamp = datetime.strptime(timestamp, "%B %d, %Y %H:%M")
            logging.debug(f"Метка времени: {timestamp}")

            # Ищем файл с датой и временем, которые прошли, но ближайшие к метке времени
            nearest_file = None
            nearest_diff = float("inf")

            for file in files:
                try:
                    if file.startswith("crmproxy"):
                        parts = file.split("_")
                        if len(parts) > 3:
                            # Извлекаем дату и время из имени файла
                            file_time_str = parts[3].split(".")[0]
                            file_datetime_str = f"{parts[1]}{parts[2]}_{file_time_str}"
                            file_datetime_str = file_datetime_str.split("_")[0]
                            file_datetime = datetime.strptime(
                                file_datetime_str, "%m%d%Y%H%M%S"
                            )

                            # Проверяем, что файл начал логирование до целевой даты
                            if file_datetime <= timestamp:
                                # Вычисляем разницу во времени
                                diff = abs((file_datetime - timestamp).total_seconds())

                                # Если разница меньше текущей минимальной, обновляем ближайший файл
                                if diff < nearest_diff:
                                    nearest_diff = diff
                                    nearest_file = file
                                    logging.debug(
                                        f"Новый ближайший файл: {nearest_file} (разница: {diff} секунд)"
                                    )
                except ValueError as e:
                    logging.error(f"Ошибка при обработке файла {file}: {e}")
                    continue

            if nearest_file:
                logging.debug(f"Найден ближайший файл: {nearest_file}")
            else:
                logging.error("Подходящий файл не найден.")
            if nearest_file is not None:
                # Копируем файл в корневую папку пользователя
                await run_ssh_command(
                    ip_address,
                    port,
                    f"cp /var/log/{nearest_file} ~/",
                    Login_ssh=user_data.Login_ssh,
                    key_ssh=user_data.key_ssh,
                )

                # Если файл заархивирован, то разархивируем его
                await run_ssh_command(
                    ip_address,
                    port,
                    f'if [[ "{nearest_file}" == *.gz ]]; then gunzip ~/{nearest_file}; fi',
                    Login_ssh=user_data.Login_ssh,
                    key_ssh=user_data.key_ssh,
                )

                # Проверяем файл
                event_ats = await run_ssh_command(
                    ip_address,
                    port,
                    f'cat ~/{nearest_file} | grep "call_id={call_id}" | grep "Ready to send" | grep -Eo "event=[0-9]+"',
                    Login_ssh=user_data.Login_ssh,
                    key_ssh=user_data.key_ssh,
                )

                # Удаляем файл
                await run_ssh_command(
                    ip_address,
                    port,
                    f'rm ~/{nearest_file.replace(".gz", "")}',
                    Login_ssh=user_data.Login_ssh,
                    key_ssh=user_data.key_ssh,
                )

                clear_event_ats = (
                    str(event_ats).replace("\n", "").replace("event=", " event=")
                )
            else:
                return HTTPException(
                    status_code=200,
                    detail="Не найден ни один файл, который удовлетворяет условиям для вывода ивентов на атс",
                )
        except asyncssh.Error as e:
            return HTTPException(
                status_code=200, detail=f"Ошибка подключения к серверу: {e}"
            )
        async with session.get(
            f"https://exemple.com/ext/crm_api/crmAccessLog?callId={call_id}"
        ) as callstat_resp:
            callstat_text = await callstat_resp.text()
            real_events = re.findall(r"\[realEvent\] =&gt; (\d+)", callstat_text)
            real_events.reverse()  # Изменение порядка элементов

    return {"info": f"events ats {event_ats} events scrm {real_events}"}


@save_to_html
async def Calllog(call_id: str, user_data):
    try:
        async with aiohttp.ClientSession() as session:
            authorized_session = await get_authorized_session(session)
            if authorized_session is None:
                raise HTTPException(status_code=200, detail="Authorization failed")
            data_list = await fetch_callstat(
                authorized_session,
                f"https://exemple.com/support/callstatv4/list?filter%5BuniqueId%5D%5Bvalue%5D={call_id}",
            )
            server_id = data_list[0]["serverId"]

            ip_address, port = await get_ip_and_port_server(server_id)
            logging.info(f"ip_address: {ip_address}, port: {port}")
            if not ip_address:
                return HTTPException(
                    status_code=200, detail="Адрес АТС не найден id сервера {server_id}"
                )
            command = f"sudo calllog -d {call_id}"
            result2 = await run_ssh_command(
                ip_address,
                port,
                command,
                Login_ssh=user_data.Login_ssh,
                key_ssh=user_data.key_ssh,
            )
            return result2
    except HTTPException as e:
        raise e
    except Exception as e:
        logging.error(f"Error: {e}")
        return HTTPException(status_code=200, detail=f"Error: {e}")


async def register(cab_number: str, user_data):
    async with aiohttp.ClientSession() as session:
        authorized_session = await get_authorized_session(session)
        if authorized_session is None:
            raise HTTPException(status_code=200, detail="Authorization failed")
        callstat_url = f"https://exemple.com/support/sipclient/list?filter%5Bclient_type%5D%5Bvalue%5D=0&filter%5B_per_page%5D=192&filter%5Buser%5D%5Bvalue%5D={cab_number}"
        data_list = await fetch_callstat(authorized_session, callstat_url)
        if "error" in data_list:
            raise HTTPException(
                status_code=200,
                detail=f"Не получили данные сторонних линий {callstat_url}",
            )

    data_reg = []
    for login in data_list:
        server_id = login["Сервер регистрации"]
        server_data = redis_client.hgetall(f"extreg_data:{server_id}")
        if not server_data:
            raise Exception(f"Server data not found for server id: {server_id}")

        ip = server_data[b"IP"].decode("utf-8")
        type = server_data[b"TYPE"].decode("utf-8")
        login_line = login["Логин"]

        logging.debug(f"Server id: {server_id}")
        logging.debug(f"IP: {ip}")
        logging.debug(f"Type: {type}")
        logging.debug(f"Login line: {login_line}")

        command = None
        if type == "Freeswitch":
            command = f"/var/www/IaEQvJmntW/showGW.php | grep {login_line}"
        elif type == "Asterisk":
            command = f"sudo asterisk -rx 'sip show registry' | grep {login_line}"

        logging.debug(f"Command: {command}")
        if 401 <= int(server_id) <= 499:
            ip_address, port = await get_ip_and_port_server(4056)
            logging.debug(f"IP address: {ip_address}")
            logging.debug(f"Port: {port}")
        if 328 <= int(server_id) <= 399:
            ip_address, port = await get_ip_and_port_server(3012)
            logging.debug(f"IP address: {ip_address}")
            logging.debug(f"Port: {port}")
        else:
            ip_address, port = await get_ip_and_port_server(2129)
            logging.debug(f"IP address: {ip_address}")
            logging.debug(f"Port: {port}")
        try:
            if 400 <= int(server_id) <= 499:
                extreg_adress = await get_ip_extreg(server_id)
                logging.debug(f"IP address: {ip_address}")
                logging.debug(f"Port: {port}")
                result = await run_ssh_jumphost(
                    ip_address,
                    port,
                    command,
                    user_data.Login_ssh,
                    user_data.key_ssh,
                    extreg_adress,
                )
            if 300 <= int(server_id) <= 399:
                extreg_adress = await get_ip_extreg(server_id)
                logging.debug(f"IP address: {ip_address}")
                logging.debug(f"Port: {port}")
                result = await run_ssh_jumphost(
                    ip_address,
                    port,
                    command,
                    user_data.Login_ssh,
                    user_data.key_ssh,
                    extreg_adress,
                )
            else:
                ip_address = await get_ip_extreg(server_id)
                logging.debug(f"IP address: {ip_address}")
                logging.debug(f"Port: {port}")
                result = await run_ssh_command(
                    ip_address,
                    port,
                    command,
                    Login_ssh=user_data.Login_ssh,
                    key_ssh=user_data.key_ssh,
                )

            data = {"Линия": login_line, "Ответ сервера": result, "extreg": server_id}
            data_reg.append(data)
        except Exception as e:
            return HTTPException(
                status_code=200, detail=f"Ошибка при подключении к {ip}: {e}"
            )

    return data_reg
