import aiohttp
from ..models.payload_models import CheckPhoneRequest


async def checkOperator(phone: CheckPhoneRequest):
    url = f"https://opendata.digital.gov.ru/api/v1/abcdef/phone?num={phone.phone}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status != 200:
                return {"error": "Ошибка", "status_code": response.status}
            return await response.text()
