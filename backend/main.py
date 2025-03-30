
import os
import logging
from pathlib import Path
import sys
import asyncio
sys.path.insert(0, '/backend')
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse, Response
from api_sipun.routers import amo_router, record_router, extenshion_router , cabinet_router
from api_sipun.routers import checkoperator_router, getcallbyid_router
from api_sipun.routers import ssh_router
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from uvicorn import config
import uvicorn
from redconf import redis_client
from user.router import router as router_users
from utils import PrometheusMiddleware, metrics, setting_otlp
from opentelemetry.propagate import inject
from fastapi_utilities import repeat_at
from cron.cron_update_serverlist import updateServerList
from cron.cron_update_extreglist import updateExtregList


if not os.path.exists("./response"):
    os.makedirs("./response")
 
APP_NAME = os.environ.get("APP_NAME", "helpuni")
OTLP_GRPC_ENDPOINT = os.environ.get("OTLP_GRPC_ENDPOINT", "http://172.23.0.1:4317")

app = FastAPI()

app.add_middleware(PrometheusMiddleware, app_name=APP_NAME)
app.add_route("/metrics", metrics)

setting_otlp(app, APP_NAME, OTLP_GRPC_ENDPOINT)


class EndpointFilter(logging.Filter):
    # Uvicorn endpoint access log filter
    def filter(self, record: logging.LogRecord) -> bool:
        return record.getMessage().find("GET /metrics") == -1
    
logging.getLogger("uvicorn.access").addFilter(EndpointFilter())

app.include_router(cabinet_router.router)
app.include_router(extenshion_router.router)
app.include_router(amo_router.router)
app.include_router(record_router.router)
app.include_router(checkoperator_router.router)
app.include_router(getcallbyid_router.router)
app.include_router(ssh_router.router)
app.include_router(router_users)




app.mount("/static", StaticFiles(directory="./frontend"), name="index")
app.mount("/response", StaticFiles(directory="./response"), name="response")


app.add_middleware(
   CORSMiddleware,
   allow_origins=["chrome-extension://olkacepnjjfahcelnllhpmllkofheabf"],  # Даём разрешение только расширению с ключом
   allow_credentials=True,  # Учётные данные включены
   allow_methods=["*"],  # Разрешаем все методы
   allow_headers=["*"],  # Разрешаем все заголовки
)
@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/version.json")
async def get_extension_chrome_updates():
    return FileResponse("./version.json")


@app.get("/helpuni.zip")
async def download_extension():
    file_path = "./frontend/helpuni.zip"
    return FileResponse(file_path, media_type='application/x-chrome-extension', filename="helpuni.zip")

# @app.get("/chain")
# async def chain(response: Response):
#     headers = {}
#     inject(headers)  # inject trace info to header
#     logging.critical(headers)

#     async with httpx.AsyncClient() as client:
#         await client.get(
#             "http://localhost:8000/",
#             headers=headers,
#         )
#     logging.info("Chain Finished")
#     return {"path": "/chain"}
@app.on_event("startup")
async def startup_event():
    await asyncio.gather(
        updateServerList()
        #pdateExtregList()
    )

if __name__ == "__main__":
    # update uvicorn access logger format
    log_config = uvicorn.config.LOGGING_CONFIG
    log_config["formatters"]["access"][
        "fmt"
    ] = "%(asctime)s %(levelname)s [%(name)s] [%(filename)s:%(lineno)d] [trace_id=%(otelTraceID)s span_id=%(otelSpanID)s resource.service.name=%(otelServiceName)s] - %(message)s"
    uvicorn.run(app, host="0.0.0.0", port=8000, log_config=log_config)