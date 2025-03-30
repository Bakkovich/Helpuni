import aiohttp
from bs4 import BeautifulSoup
from fastapi import HTTPException
from database import async_session_maker
import sqlalchemy
from user.models import User, server_list, extreg_list


async def ats_ip(cab_number: str):
    async with aiohttp.ClientSession() as sess:
        try:
            login_CSRF = await sess.get("https://exemple.com/ru_RU/login")
            soup_CSRF = BeautifulSoup(await login_CSRF.text(), "html.parser")
            CSRF = soup_CSRF.find("input", id="login__token").get("value")

            login_data = {
                "login[username_email]": "mail@mail.com",
                "login[password]": "password",
                "login[_token]": CSRF,
            }

            await sess.post("https://exemple.com/ru_RU/login", data=login_data)

            callstat = await sess.get(
                f"https://exemple.com/manage/user/list?filter{cab_number}"
            )
            callstat_soup = BeautifulSoup(await callstat.text(), "html.parser")
            table = callstat_soup.find(
                "table", class_="table table-bordered table-striped sonata-ba-list"
            )
            headers = [
                header.get_text(strip=True)
                for header in table.find("thead").find_all("th")
            ]

            # Извлекаем строки из таблицы и создаем словарь
            data_list = []
            rows = table.find("tbody").find_all("tr")
            for row in rows:
                cols = row.find_all("td")
                if cols:  # Проверяем, что есть ячейки
                    row_data = {
                        headers[i]: cols[i].get_text(strip=True)
                        for i in range(len(cols))
                    }
                    data_list.append(row_data)
                    atsid = data_list[0]["Номер сервера"]
                    return await get_ip_ats(atsid)
        except Exception as e:
            print(f"Error: {e}")
            return HTTPException(status_code=500, detail=f"Error: {e}")


async def get_ip_extreg(cab_number: str):
    async with async_session_maker() as session:
        extreg_adress = await session.scalar(
            sqlalchemy.select(extreg_list.extreg_adress).where(
                extreg_list.id == int(cab_number)
            )
        )
        
    return extreg_adress


async def get_ip_ats(cab_number: str):
    if not 3000 <= int(cab_number) <= 9000:
        async with async_session_maker() as session:
            cab_number = await session.scalar(
                sqlalchemy.select(server_list.server_adress).where(
                    server_list.id == int(cab_number)
                )
            )
        return cab_number
    if cab_number is None:
        return None

# Преобразование по маске
    if 3000 <= (int(cab_number)) <= 3999:
        # Для диапазона 3000-3999
        last_octet = (int(cab_number)) % 1000     # Последние три цифры
        ats_ip = f"10.3.1.{last_octet}"       # Второй октет всегда 3
    elif 4000 <= (int(cab_number)) <= 4999:
        # Для диапазона 4000-4999
        prefix = ((int(cab_number)) // 1000)     # Получаем первое число после 10.
        last_octet = (int(cab_number)) % 1000    # Последние три цифры
        ats_ip = f"10.{prefix}.1.{last_octet}"
    elif 8000 <= (int(cab_number)):
        # Для диапазона 8000+
        second_octet = (int(cab_number)) // 100   # Второй октет
        last_octet = (int(cab_number)) % 100  # Последний октет + 1
        ats_ip = f"10.{second_octet}.0.{last_octet}"
    else:
        # Если число не попадает ни в один из диапазонов
        ats_ip = None

    return ats_ip
