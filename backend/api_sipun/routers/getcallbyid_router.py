from fastapi import APIRouter, Depends
from user import auth
from ..crud import crud_getcallbyid
from ..models.payload_models import CallRequest
from user.models import User
from user.auth import get_current_user
import logging

router = APIRouter()

@router.get("/getcallbyid")
async def getcallbyid(cab_number: str, call_id:str, user_data: User = Depends(get_current_user)):
    logging.info(f"Пользователь {user_data.first_name} {user_data.last_name} запросил информацию о звонке для Кабиента = {cab_number} и call_id={call_id}")
    request = CallRequest(cab_number=cab_number, call_id=call_id)
    return await crud_getcallbyid.getcallbyid(request)