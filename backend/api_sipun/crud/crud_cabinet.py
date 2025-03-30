import aiohttp
import logging
from .. import auth
import json

async def line_data(cab_number: str):
    async with aiohttp.ClientSession() as session:
        userlink = await auth.auth_cab(cab_number, user_data)
        logging.debug (userlink)
        async with session.get(userlink) as response:
            async with session.post("https://exemple.com/api/sipclient/get", headers={"Content-Type": "application/json"}) as line_data:
                clean_data = json.loads(await line_data.text())
                return clean_data