import aiohttp
import json
import asyncio
from datetime import datetime, timezone
import pytz
from ..models.payload_models import ContactRequest
from api_sipun import auth
import logging
from fastapi import HTTPException



async def get_contacts(request: ContactRequest):
    crm_config = await get_crm_configuration(request)
    
    if "error" in crm_config:
        return {"error": crm_config["error"]}
    
    domain = crm_config["domain"]
    access_token = crm_config["oauth_access_token"]
    users = crm_config["users"]
    statuses = crm_config.get("statuses", {})
    pipelines = crm_config.get("pipelines", {})
    
    return await get_contacts_by_phone(domain, access_token, request.phone_number, users, statuses, pipelines)

async def get_crm_configuration(request: ContactRequest, user_data):
    
    userlink = await auth.auth_cab(request.cab_number, user_data)
    logging.debug (userlink)
    async with aiohttp.ClientSession() as session:
        async with session.get(str(userlink)) as response:
            if response.status != 200:
                return HTTPException(status_code=401, detail="Не получилось авторизоваться в админке")

            crm_config_url = "https://exemple.com/ru_RU/settings/crm/config_json/amocrm"
            async with session.get(crm_config_url) as response:
                if response.status != 200:
                    return HTTPException(status_code=401, detail="Не получилось авторизоваться в админке")

                if "<!DOCTYPE html>" in await response.text():
                    return HTTPException(status_code=401, detail="Требуется повторная авторизация")

                try:
                    crm_data = json.loads(await response.text())
                except json.JSONDecodeError:
                    return HTTPException(status_code=400, detail="Неверный формат ответа")

                settings = crm_data.get("crm", {}).get("settings", {})
            
                if not settings:
                    return HTTPException(status_code=400, detail="Отсутствуют настройки CRM")

                return {
                    "domain": settings.get("domain"),
                    "oauth_access_token": settings.get("oauth_access_key"),
                    "users": settings.get("users"),
                    "duty_user": settings.get("duty_user")
                }

async def get_contacts_by_phone(domain: str, access_token: str, phone_number: str, users: list, statuses: dict, pipelines: dict):
    contacts_url = f"https://{domain}/api/v4/contacts"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    params = {
        "query": phone_number,
        "with": "leads"
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(contacts_url, headers=headers, params=params) as response:
            if response.status == 200:
                contacts = await response.json()
                results = []
                contact_ids = set()
                for contact in contacts["_embedded"]["contacts"]:
                    contact_id = contact["id"]
                    if contact_id in contact_ids:
                        results.append({"Предупреждение": f"Найден дубль! ID контакта: {contact_id}"})

                    contact_ids.add(contact_id)
                    
                    responsible_user_id = contact["responsible_user_id"]
                    responsible_user = next((user for user in users if user['id'] == responsible_user_id), None)
                    responsible_user_name = f"{responsible_user['name']} ({responsible_user_id})" if responsible_user else f"Неизвестный пользователь ({responsible_user_id})"
                    
                    contact_info = {
                        "Имя": contact["name"],
                        "Ссылка на контакт": f"https://{domain}/contacts/detail/{contact_id}",
                        "ID Контакта": contact_id,
                        "ID Ответственного": responsible_user_id,
                        "Ответственный": responsible_user_name,
                        "Сделки": []
                    }
                    if "leads" in contact["_embedded"]:
                        for lead in contact["_embedded"]["leads"]:
                            lead_info = await process_lead(lead, domain, access_token)
                            contact_info["Сделки"].append(lead_info)
                    results.append(contact_info)
                return results
            else:
                return {"error": f"Failed to fetch contacts: {response.status}"}

async def process_lead(lead, domain, access_token):
    lead_id = lead["id"]
    lead_url = f"https://{domain}/api/v4/leads/{lead_id}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(lead_url, headers=headers) as lead_response:
            if lead_response.status == 200:
                lead_data = await lead_response.json()
                status_id = str(lead_data.get("status_id"))
                pipeline_id = str(lead_data.get("pipeline_id"))
                closed_at = lead_data.get("closed_at")
                
                is_closed = status_id in ["142", "143"] or (closed_at is not None and closed_at != 0)
                
                pipeline_name, status_name = await get_pipeline_and_status_names(domain, access_token, pipeline_id, status_id)
                
                lead_info = {
                    "Ссылка": f"https://{domain}/leads/detail/{lead_id}",
                    "Статус": "Закрыта" if is_closed else "Открыта",
                    "Воронка": f"{pipeline_name} ({pipeline_id})",
                    "Этап": f"{status_name} ({status_id})",
                    "Время закрытия": None
                }
                
                if is_closed and closed_at:
                    try:
                        closed_at_dt = datetime.fromtimestamp(closed_at, timezone.utc)
                        msk_tz = pytz.timezone('Europe/Moscow')
                        closed_at_msk = closed_at_dt.astimezone(msk_tz)
                        lead_info["Время закрытия"] = closed_at_msk.strftime("%d %B %Y, %H:%M:%S MSK")
                    except Exception as e:
                        lead_info["Ошибка времени"] = str(e)
                return lead_info
            else:
                return {"error": f"Failed to fetch lead details: {lead_response.status}"}

async def get_pipeline_and_status_names(domain: str, access_token: str, pipeline_id: str, status_id: str):
    pipeline_url = f"https://{domain}/api/v4/leads/pipelines/{pipeline_id}"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(pipeline_url, headers=headers) as response:
            if response.status == 200:
                pipeline_data = await response.json()
                pipeline_name = pipeline_data.get("name", "Неизвестная воронка")
                status_name = next((status["name"] for status in pipeline_data.get("_embedded", {}).get("statuses", []) if str(status["id"]) == status_id), "Неизвестный этап")
                return pipeline_name, status_name
            return "Неизвестная воронка!", "Неизвестный этап!"
