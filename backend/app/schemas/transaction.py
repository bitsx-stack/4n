from pydantic import BaseModel
from datetime import datetime
import uuid



class ReadTransaction(BaseModel):
    id: int
    code: uuid.UUID
    ref: str
    type: str
    quantity: int
    amount: float
    status: str
    created_at: datetime
    updated_at: datetime
    # user: str
    # store: list
    # imei: list
    
    
    class Config:
        orm_mode=True
    
    
class CreateTransaction(BaseModel):
    ref: str
    type: str
    quantity: int
    amount: float
    status: str
    user_id: int
    store_id: int
    imei_code: str
    