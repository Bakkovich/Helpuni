from fastapi import APIRouter, Depends
from user import auth
from ..crud import crud_extension
import logging
from user.models import User
from user.auth import get_current_user

router = APIRouter()


@router.get("/ats_ip/{cab_number}")
async def ats_ip(cab_number: str, user_data: User = Depends(get_current_user)):
    logging.info(
        f"Пользователь {user_data.first_name} {user_data.last_name} запросил ats_ip для Кабиента = {cab_number}"
    )
    result = await crud_extension.ats_ip(cab_number)
    return result


@router.get("/get_ip_extreg/{cab_number}")
async def get_ip_extreg(cab_number: str, user_data: User = Depends(get_current_user)):
    logging.info(
        f"Пользователь {user_data.first_name} {user_data.last_name} запросил get_ip_extreg для Кабиента = {cab_number}"
    )
    result = await crud_extension.get_ip_extreg(cab_number)
    return result


@router.get("/get_ip_ats/{cab_number}")
async def get_ip_ats(cab_number: str, user_data: User = Depends(get_current_user)):
    logging.info(
        f"Пользователь {user_data.first_name} {user_data.last_name} запросил get_ip_extreg для Кабиента = {cab_number}"
    )
    result = await crud_extension.get_ip_ats(cab_number)
    return result
