from pydantic import BaseModel
from datetime import datetime

class CreateVendor(BaseModel):
    name: str
    code: str
    phone: str
    tin: str
    email: str
    
class ReadVendor(BaseModel):
    name: str
    code: str
    phone: str
    tin: str
    email: str
    is_active: bool
    created_at: datetime
    updated_at: datetime