import hashlib
import asyncio
from ..models.payload_models import RecordRequest


async def generate_record_link(request: RecordRequest):
    hash_string = f"{request.id}+{request.user}+{request.secret}".encode('utf-8')
    hash_value = await asyncio.to_thread(hashlib.md5, hash_string).hexdigest()
    link = f"https://exemple.com/api/statistic/record?id={request.id}&hash={hash_value}&user={request.user}"
    return {"link": link}
