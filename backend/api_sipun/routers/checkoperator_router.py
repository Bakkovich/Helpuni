from fastapi import APIRouter, Depends
from user import auth
from ..crud import crud_checkoperator
from ..models.payload_models import CheckPhoneRequest
import logging
from user.models import User
from user.auth import get_current_user
router = APIRouter()

@router.get("/checkoperator")
async def checkOperator(phone: str, user_data: User = Depends(get_current_user)):
    logging.info(f"Пользователь {user_data.first_name} {user_data.last_name} запросил checkOperator для phone={phone}")
    request = await CheckPhoneRequest(phone=phone)
    return crud_checkoperator.checkOperator(request)
