import redis
import os
from api_sipun.extreg import extreg_data
from api_sipun.server import ip_addresses



redis_url = os.environ.get('REDIS_URL')
redis_client = redis.Redis.from_url(redis_url)
extreg_data_dict = {item['id']: item for item in extreg_data}

for key, value in extreg_data_dict.items():
    redis_client.hmset(f'extreg_data:{key}', value)

for key, value in ip_addresses.items():
    redis_client.hset('ip_addresses', key, value)