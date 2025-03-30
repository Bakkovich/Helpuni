import aiohttp
import asyncio
from bs4 import BeautifulSoup
import logging
from fastapi import Request, HTTPException, status, Depends
from user.dao import UsersDAO
from pydantic import EmailStr

async def get_csrf_token(session):
    async with session.get("https://exemple.com/ru_RU/login") as resp:
        login_CSRF = await resp.text()
        soup_CSRF = BeautifulSoup(login_CSRF, "html.parser")
        return soup_CSRF.find("input", id="login__token").get('value')

async def login_to_sipuni(session, csrf_token, email, password):
    login_data = {
        'login[username_email]': email,
        'login[password]': password,
        'login[_token]': csrf_token
    }
    logging.debug(f"CSRF: {csrf_token}")
    logging.debug(f"login: {email}")
    logging.debug(f"password: {password}")
    return await session.post("https://exemple.com/ru_RU/login", data=login_data)

async def get_authorized_session(session: aiohttp.ClientSession, email: EmailStr, password: str):
    csrf_token = await get_csrf_token(session)
    auth = await login_to_sipuni(session, csrf_token, email, password)
    authadm = await session.get("https://exemple.com/manage/")
    if authadm.status != 200:
        logging.error("Authorization failed")
        return None  # Возвращаем None вместо logging.error
    return session

async def auth_cab(cab_number, user_data):
    try:
        # Авторизация в основном кабинете
        async with aiohttp.ClientSession() as session:  # Сессия открывается здесь
            authorized_session = await get_authorized_session(session, user_data.email, user_data.sipun_password)
            if authorized_session is None:
                raise HTTPException(status_code=401, detail="Authorization failed")

            # Используем ту же сессию для следующего запроса
            async with authorized_session.get(f"https://exemple.com/manage/user/list?filter%{cab_number}") as adm_stat:
                soup = BeautifulSoup(await adm_stat.text(), "html.parser")
                user_link_tag = soup.find("a", class_="btn btn-sm btn-default")
                
                if user_link_tag is None:
                    logging.error("Не удалось найти ссылку на пользователя.")
                    return None
                
                user_link = user_link_tag.get('href')
                logging.debug(f"user_link: {user_link}")
                return user_link
    except Exception as e:
        logging.exception(f"Ошибка авторизации в админку: {e}")
        return None