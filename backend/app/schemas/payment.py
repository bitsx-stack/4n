from datetime import datetime
from pydantic import BaseModel

class CreatePayment(BaseModel):
    ref: str
    type: str
    amount: float
    status: str
    user_id: int
    store_id: int

class ReadPayment(BaseModel):
    id: int
    ref: str
    type: str
    amount: float
    status: str
    user_id: int
    store_id: int
    created_at: datetime
    updated_at: datetime
