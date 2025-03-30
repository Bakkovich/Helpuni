from fastapi import APIRouter, Depends
from user import auth
from ..crud import crud_recordlink
from ..models.payload_models import RecordRequest
from user.models import User
from user.auth import get_current_user
import logging

router = APIRouter()

@router.post("/record_link")
async def generate_record_link(request: RecordRequest, user_data: User = Depends(get_current_user)):
    logging.info(f"Пользователь {user_data.first_name} {user_data.last_name} запросил record_link")
    return await crud_recordlink.generate_record_link(request)