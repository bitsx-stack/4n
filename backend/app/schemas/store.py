from pydantic import BaseModel
from datetime import datetime


class CreateStore(BaseModel):
    name: str
    type: str
    client_id: int
    
class ReadStore(BaseModel):
    id: int
    name: str
    type: str
    client_id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    