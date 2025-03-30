import requests
from ..crud import crud_amoentities
from ..crud import crud_getcallbyid
from ..models.payload_models import Test
from .. import auth
def testovaya(cab_number: str):
    return auth.auth_cab(cab_number)
    
