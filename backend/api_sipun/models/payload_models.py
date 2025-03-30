from pydantic import BaseModel
from typing import Optional

class RecordRequest(BaseModel):
    id: str
    user: str
    secret: str

class ContactRequest(BaseModel):
    cab_number: str
    phone_number: Optional[str] = None

class CheckPhoneRequest(BaseModel):
    phone: str

class AdminURL(BaseModel):
    cab_number: str

class CallRequest(BaseModel):
    cab_number: str
    call_id: str

class AddCallRequest(BaseModel):
    domain: str
    token: str
    duration: int
    phone: str
    link: str
    direction: str
    call_status: int
    created_by: int
    created_at: int