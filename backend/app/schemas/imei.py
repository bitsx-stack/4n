from pydantic import BaseModel
from datetime import datetime


class ReadImeiStore(BaseModel):
    id: int
    name: str
    client_id: int | None = None

    class Config:
        orm_mode = True
        from_attributes = True

class CreateImei(BaseModel):
    code: str
    vendor_id: int | None = None
    brand: str
    model: str
    storage_size: str | None = None
    store_id: int
    
class ReadImei(BaseModel):
    id: int
    code: str
    vendor_id: int | None = None
    brand: str
    model: str
    storage_size: str | None = None
    stores: list[ReadImeiStore] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
    
    