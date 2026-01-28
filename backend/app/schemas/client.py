    
from pydantic import BaseModel, EmailStr
from datetime import datetime


class ClientCreate(BaseModel):
    name: str
    location: str
    email: EmailStr
    phone: str 
    tin: str 
    
class ClientUpdate(BaseModel):
    name: str
    location: str
    is_active: bool
    status: str
    email: EmailStr 
    phone: str 
    tin: str 
    vrn: str 
    location: str
   
class ClientRead(BaseModel):
    id: int
    name: str
    location: str
    created_at: datetime
    updated_at: datetime
    is_active: bool
    email: EmailStr 
    phone: str 
    tin: str
    vrn: str
    location: str