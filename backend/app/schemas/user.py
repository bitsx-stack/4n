from pydantic import BaseModel
from datetime import datetime

class UserCreate(BaseModel):
    phone: str
    fullname: str
    password: str

class UserRead(BaseModel):
    id: int
    phone: str
    fullname: str
    role: str
    is_active: bool
   
