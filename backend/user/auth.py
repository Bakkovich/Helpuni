from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from config import get_auth_data
from pydantic import EmailStr
from .dao import UsersDAO
from fastapi import Request, HTTPException, status, Depends
from user.models import User
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
import aiohttp
import asyncio
import logging
from bs4 import BeautifulSoup

async def get_csrf_token(sess):
    async with sess.get("https://sipuni.com/ru_RU/login") as resp:
        login_CSRF = await resp.text()
        soup_CSRF = BeautifulSoup(login_CSRF, "html.parser")
        return soup_CSRF.find("input", id="login__token").get('value')

async def login_to_sipuni(sess, csrf_token, email, password):
    login_data = {
        'login[username_email]': email,
        'login[password]': password,
        'login[_token]': csrf_token
    }
    logging.info(f"CSRF: {csrf_token}")
    logging.info(f"login: {email}")
    logging.info(f"password: {password}")
    return await sess.post("https://sipuni.com/ru_RU/login", data=login_data)

async def get_authorized_session(email: EmailStr, password: str):
    # Создание новой сессии и авторизация
        async with aiohttp.ClientSession() as sess:
            csrf_token = await get_csrf_token(sess)
            auth = await login_to_sipuni(sess, csrf_token, email, password)
            authadm = await sess.get("https://sipuni.com/manage/")
            if authadm.status != 200:
                await sess.close()
                return False
        await sess.close()  
        return True



def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode.update({"exp": expire})
    auth_data = get_auth_data()
    encode_jwt = jwt.encode(to_encode, auth_data['secret_key'], algorithm=auth_data['algorithm'])
    return encode_jwt

async def authenticate_user(email: EmailStr, password: str):
    user = await UsersDAO.find_one_or_none(email=email) 
    if not user:
        return False
    if verify_password(plain_password=password, hashed_password=user.password) is False:
        return None
    return user

def get_token(request: Request):
    token = request.cookies.get('users_access_token')
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token not found')
    return token

  
async def get_current_user(token: str = Depends(get_token)):
    try:
        auth_data = get_auth_data()
        payload = jwt.decode(token, auth_data['secret_key'], algorithms=[auth_data['algorithm']])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Токен не валидный!')

    expire = payload.get('exp')
    expire_time = datetime.fromtimestamp(int(expire), tz=timezone.utc)
    if (not expire) or (expire_time < datetime.now(timezone.utc)):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Токен истек')

    user_id = payload.get('sub')
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Не найден ID пользователя')
    
    user = await UsersDAO.find_one_or_none_by_id(int(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
    print(user)
    return user

async def get_current_admin_user(current_user: User = Depends(get_current_user)):
    if current_user.is_admin:
        return current_user
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Недостаточно прав!')

async def get_current_service_user(current_user: User = Depends(get_current_user)):
    if current_user.is_service: 
        return current_user
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Недостаточно прав!')