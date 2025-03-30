from fastapi import APIRouter
from ..crud import crud_amoentities
from ..crud import crud_test



router = APIRouter()

@router.get("/test/{cab_number}")
async def get_contacts(cab_number: str):
    cablink = crud_test.testovaya(cab_number)
    return cablink
