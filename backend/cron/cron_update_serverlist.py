import aiohttp
import asyncio
import pprint
from bs4 import BeautifulSoup
from database import async_session_maker
import sqlalchemy
import logging
from api_sipun.auth import get_authorized_session
from fastapi import Request, HTTPException, status, Depends
from user.models import server_list  # Импортируйте server_list из соответствующего модуля
import pprint

async def get_csrf_token(session):
    async with session.get("https://exemple.com/ru_RU/login") as resp:
        login_CSRF = await resp.text()
        soup_CSRF = BeautifulSoup(login_CSRF, "html.parser")
        return soup_CSRF.find("input", id="login__token").get('value')

async def login_to_sipuni(session, csrf_token):
    login_data = {
        'login[username_email]': "mail@mail.ru",
        'login[password]': "password",
        'login[_token]': csrf_token
    }
    return await session.post("https://exemple.com/ru_RU/login", data=login_data)

async def get_authorized_session(session: aiohttp.ClientSession):
    csrf_token = await get_csrf_token(session)
    auth = await login_to_sipuni(session, csrf_token)
    authadm = await session.get("https://exemple.com/manage/")
    if authadm.status != 200:
        logging.error("Authorization failed")
        return None  
    return session

async def updateServerList():
    try:
        async with aiohttp.ClientSession() as session:
            authorized_session = await get_authorized_session(session)
            if authorized_session is None:
                raise HTTPException(status_code=401, detail="Authorization failed")

            data_list = []
            page = 1
            while True:
                async with authorized_session.get(f"https://exemple.com/support/server/list?") as resp:
                    response_text = await resp.text()
                    soup = BeautifulSoup(response_text, "html.parser")
                    table = soup.find('table', class_='table table-bordered table-striped sonata-ba-list')
                    if not table:
                        break;

                    headers = [header.get_text(strip=True) for header in table.find('thead').find_all('th')]
                    rows = table.find('tbody').find_all('tr')
                    data_list.append([
                        {headers[i]: cols[i].get_text(strip=True) for i in range(len(cols))}
                        for row in rows if (cols := row.find_all('td'))
                    ])
                    page += 1

            for data in data_list:
                for srv in data:
                    session = async_session_maker()  # Получите сессию без async with
                    try:
                        # Проверка существования записи
                        existing_record = await session.execute(
                            sqlalchemy.select(server_list).where(server_list.id == int(srv['id']))
                        )
                        if existing_record.scalar() is None:  # Если запись не найдена
                            await session.execute(
                                sqlalchemy.insert(server_list).values(
                                    id=int(srv['id']),
                                    server_adress=srv['IP-адрес']
                                )
                            )
                            await session.commit()
                        else:
                            logging.info(f"Запись с id {srv['id']} уже существует, пропускаем.")
                    finally:
                        await session.close()  # Закройте сессию вручную
            logging.info("Сервера Успешно добавлены")
        
    except Exception as e:
        logging.error(f"Ошибка авторизации в админку: {e}")
        return None

