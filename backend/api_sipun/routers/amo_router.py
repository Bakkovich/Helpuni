import re
from fastapi import APIRouter, Depends
from user.models import User
from user.auth import get_current_user
from user import auth
from ..crud import crud_amoentities
from ..crud import crud_amo
from ..models.payload_models import ContactRequest
from ..models.payload_models import AddCallRequest
from ..models.payload_models import CallRequest
from ..models.payload_models import AdminURL
import logging

router = APIRouter()

@router.get("/contacts_by_cab_number_and_phone")
async def get_contacts(cab_number: str, phone_number: str,user_data: User = Depends(get_current_user)):
    logging.info(f"Пользователь {user_data.first_name} {user_data.last_name} запросил контакты для Кабиента = {cab_number} и телефона={phone_number}")
    request =  ContactRequest(cab_number=cab_number, phone_number=phone_number)
    print (request)
    return await crud_amoentities.get_contacts(request)

@router.get("/amo/addcallinfo")
async def amo_addcallinfo (cab_number: str, call_id: str, user_data: User = Depends(get_current_user)):
    logging.info(f"Пользователь {user_data.first_name} {user_data.last_name} добавил информацию о звонке для Кабиента = {cab_number} и call_id={call_id}")
    request = CallRequest(cab_number=cab_number, call_id=call_id)
    print (request)
    return await crud_amo.amo_addcallinfo(request,user_data)

@router.post("/amo/addcall")
async def amo_addcall (request: AddCallRequest, user_data: User = Depends(get_current_user)):
    logging.info(f"Пользователь {user_data.first_name} {user_data.last_name} добавил информацию о звонке")
    return await crud_amo.amo_addcall(request)

@router.get("/amo/get_crm_configuration/{cab_number}")
async def amo_get_crm_configuration(cab_number: str, user_data: User = Depends(get_current_user)):
    logging.info(f"Пользователь {user_data.first_name} {user_data.last_name} запросил конфигурацию CRM для Кабинета = {cab_number}")
    
    # Создаем объект ContactRequest
    request = ContactRequest(cab_number=cab_number)
    
    # Вызываем функцию get_crm_configuration с объектом request
    return await crud_amoentities.get_crm_configuration(request, user_data)