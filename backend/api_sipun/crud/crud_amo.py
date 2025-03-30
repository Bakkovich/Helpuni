import aiohttp
from ..crud import crud_amoentities
from ..crud import crud_getcallbyid
from ..models.payload_models import AddCallRequest
from ..models.payload_models import AdminURL
from ..models.payload_models import CallRequest
from .. import auth
import logging


async def amo_addcallinfo(request: CallRequest, user_data):
    crm_conf = await crud_amoentities.get_crm_configuration(request, user_data)
    call = await crud_getcallbyid.getcallbyid(
        CallRequest(cab_number=request.cab_number, call_id=request.call_id),user_data
    )
    if "error" in call:
        return {"error": call["error"]}
    timestamp = request.call_id.split(".")
    if call["type"] == "Исходящие, отвеченные":
        dir = "outbound"
        result = "Разговор состоялся"
        status = 4
        phone = call["to"]
        created = call["from"]
        link = call["callrecordlink"]
    elif call["type"] == "Исходящий, неотвеченный":
        dir = "outbound"
        result = "Не дозвонились"
        status = 6
        phone = call["to"]
        created = call["from"]
        link = ""
    elif call["type"] == "Входящий, принятый":
        dir = "inbound"
        result = "Разговор состоялся"
        status = 4
        phone = call["from"]
        created = call["answer"]
        link = call["callrecordlink"]
    elif call["type"] == "Входящие, пропущенные":
        dir = "inbound"
        result = "Пропущенный звонок"
        status = 2
        phone = call["from"]
        created = "duty_user"
        link = ""
    else:
        return {"error": "Неизвестный тип звонка"}

    if "error" in crm_conf:
        crmdata = {"error": crm_config["error"]}
        createdby = "Ошибка"
    else:
        users = crm_conf["users"]
        if not created or created == "duty_user":
            createdby = int(crm_conf["duty_user"])
            responsible = "Дежурный по-умолчанию"
            if crm_conf["duty_user"] != 0:
                for user in users:
                    if user["id"] == crm_conf["duty_user"]:
                        responsible = f'"{user["name"]}" (Дежурный, вн.номер: {user["short_number"]})'
                        break
        else:
            createdby = crm_conf["duty_user"]
            responsible = (
                "Дежурный, поскольку сотрудник не сопоставлен в настройках интеграции"
            )
            short_num = created.split(" (")
            for user in users:
                if user["short_number"] == short_num[0]:
                    createdby = int(user["id"])
                    responsible = f'"{user["name"]}" (Вн.номер: {user["short_number"]})'
                    break
        crmdata = {
            "domain": crm_conf["domain"],
            "token": crm_conf["oauth_access_token"],
            "responsible": responsible,
        }

    dur = call["duration"].split(" ")
    if len(dur) == 2:
        duration = int(dur[0])
    elif len(dur) == 4:
        duration = int(dur[0]) * 60
        duration += int(dur[2])
    elif len(dur) == 6:
        duration = int(dur[0]) * 3600
        duration += int(dur[0]) * 60
        duration += int(dur[4])
    else:
        duration = "Временная ошибка"

    data = {
        "duration": duration,
        "phone": phone,
        "direction": dir,
        "call_result": result,
        "call_status": status,
        "created_by": createdby,
        "created_at": int(timestamp[0]),
    }
    if link != "":
        data["link"] = link

    return [data, crmdata]


async def amo_addcall(request: AddCallRequest):
    api_url = f"https://{request.domain}/api/v4/calls"
    headers = {
        "Authorization": f"Bearer {request.token}",
        "Content-Type": "application/json",
    }

    data = {
        "duration": int(request.duration),
        "source": "sipuni",
        "phone": request.phone,
        "direction": request.direction,
        "call_status": int(request.call_status),
        "created_by": int(request.created_by),
        "created_at": int(request.created_at),
    }

    if request.call_status == 4:  # Разговор состоялся
        data["link"] = request.link
    elif (
        request.call_status == 2
    ):  # Входящий пропущенный, результат "Пропущенный звонок"
        data["call_result"] = "Пропущенный звонок"
    elif request.call_status == 6:  # Исходящий неотвеченный, результат "Не дозвонились"
        data["call_result"] = "Не дозвонились"

    ddata = [data]
    async with aiohttp.ClientSession() as session:
        async with session.post(api_url, json=ddata, headers=headers) as response:
            return await response.text()
