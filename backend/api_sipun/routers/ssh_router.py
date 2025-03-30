from fastapi import APIRouter, Depends
from user import auth
from ..crud import crud_ssh
import logging
from user.models import User
from user.auth import get_current_user

router = APIRouter()

@router.get("/events_ats/{call_id}")
async def events_ats(call_id: str, user_data: User = Depends(get_current_user)):
    logging.info(f"Пользователь {user_data.first_name} {user_data.last_name} запросил события АТС для call_id={call_id}")
    result = await crud_ssh.events_ats(call_id, user_data)
    return result

@router.get("/calllog/{call_id}")
async def calllog(call_id: str, user_data: User = Depends(get_current_user)):
    logging.info(f"Пользователь {user_data.first_name} {user_data.last_name} запросил calllog для call_id={call_id}")
    result = crud_ssh.Calllog(call_id, user_data)
    return await result

@router.get("/reg/{cab_number}")
async def register(cab_number: str, user_data: User = Depends(get_current_user)):
    logging.info(f"Пользователь {user_data.first_name} {user_data.last_name} запросил регистрации линий для Кабиента = {cab_number}")
    result = await crud_ssh.register(cab_number, user_data)
    return result
