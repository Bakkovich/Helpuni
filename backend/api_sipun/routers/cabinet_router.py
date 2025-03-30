from fastapi import APIRouter, Depends
from user import auth
from ..crud import crud_cabinet
from user.models import User
from user.auth import get_current_user
import logging

router = APIRouter()

@router.get("/line_data")
async def line_data(cab_number: str, user_data: User = Depends(get_current_user)):
    logging.info(f"Пользователь {user_data.first_name} {user_data.last_name} запросил данные линий для Кабиента = {cab_number}")
    request = await crud_cabinet.line_data(cab_number)
    return request