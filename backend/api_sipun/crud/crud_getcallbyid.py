import aiohttp
from bs4 import BeautifulSoup
from ..models.payload_models import CallRequest
from .. import auth


async def getcallbyid(request: CallRequest, user_data):
    async with aiohttp.ClientSession() as session:
        test = await auth.auth_cab(request.cab_number, user_data)
        print(f"asdasdasd: {type(test)}, {test}")
        response = await session.get(test)
        if response.status != 200:
            return {
                "error": "Ошибка доступа к админской панели",
                "status_code": response.status,
            }
        url = f"https://exemple.com/ru_RU/statistic?ids={request.call_id}&date=-7+day"
        response = await session.get(url, cookies=response.cookies)
        if response.status != 200:
            return {"error": "Ошибка получения данных", "status_code": response.status}
        calldata = []
        soup = BeautifulSoup(await response.text(), "html.parser")
        calldata = soup.findAll("td")
        if not calldata:
            return {"error": "В статистике нет звонка с таким ID"}
        url = f"https://exemple.com/ext/crm_api/crmAccessLog?callId={request.call_id}"
        response = await session.get(url, cookies=response.cookies)
        if response.status != 200:
            recordlink = ""
        else:
            recorddata = []
            soup = BeautifulSoup(await response.text(), "html.parser")
            recorddata = soup.findAll("pre")
            if not recorddata:
                recordlink = ""
            else:
                recordlink = (
                    "https://exemple.com/api/crm/record?"
                    + recorddata[0]
                    .text.split("https://exemple.com/api/crm/record?")[1]
                    .split("',")[0]
                )
        return {
            "id": calldata[0].text.strip(),
            "type": calldata[1].find("img")["title"],
            "scheme": calldata[3].text.strip(),
            "from": calldata[4].text.strip(),
            "to": calldata[5].text.strip(),
            "answer": calldata[6].text.strip(),
            "duration": calldata[7].text.strip(),
            "talkduration": calldata[8].text.strip(),
            "answerduration": calldata[9].text.strip(),
            "callrecordlink": recordlink,
        }
