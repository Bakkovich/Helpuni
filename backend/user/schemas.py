import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class SUserRegister(BaseModel):
    email: EmailStr = Field(..., description="Электронная почта")
    password: str = Field(..., min_length=5, max_length=50, description="Пароль, от 5 до 50 знаков")
    first_name: str = Field(..., min_length=3, max_length=50, description="Имя, от 3 до 50 символов")
    last_name: str = Field(..., min_length=3, max_length=50, description="Фамилия, от 3 до 50 символов")
    Login_ssh: Optional[str] = Field(None, description="Логин SSH")
    key_ssh: Optional[str] = Field(None, description="Ключ SSH")
    sipun_password: Optional[str] = Field(None, description="Пароль SIPUN")
    
class SUserAuth(BaseModel):
    email: EmailStr = Field(..., description="Электронная почта")
    password: str = Field(..., min_length=5, max_length=50, description="Пароль, от 5 до 50 знаков")

class SUserUpdate(BaseModel):
    id: int = Field(..., description="ID пользователя")
    is_service: Optional[bool] = Field(None, description="false or true")
    is_admin: Optional[bool] = Field(None, description="false or true")
    first_name: Optional[str] = Field(None, min_length=3, max_length=50, description="Имя, от 3 до 50 символов")
    last_name: Optional[str] = Field(None, min_length=3, max_length=50, description="Фамилия, от 3 до 50 символов")
    email: Optional[EmailStr] = Field(None, description="Электронная почта")
    sipun_login: Optional[str] = Field(None, description="Логин SIPUN")
    sipun_password: Optional[str] = Field(None, description="Пароль SIPUN")
    Login_ssh: Optional[str] = Field(None, description="Логин SSH")
    key_ssh: Optional[str] = Field(None, description="Ключ SSH")
class SUserDelete(BaseModel):
    id: int = Field(..., description="ID пользователя")