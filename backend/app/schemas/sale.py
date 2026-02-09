from datetime import datetime
from pydantic import BaseModel


class CreateSale(BaseModel):
    store_id: int
    store_name: str = ""
    imei_code: str
    brand: str = ""
    model: str = ""
    storage: str = ""
    amount: float
    notes: str = ""
    customer_name: str
    customer_phone: str
    customer_secondary_phone: str = ""
    next_of_kin_name: str = ""
    next_of_kin_relationship: str = ""
    next_of_kin_phone: str = ""
    next_of_kin_secondary_phone: str = ""
    seller_id: int | None = None
    seller_name: str = ""


class ReadSale(BaseModel):
    id: int
    store_id: int
    store_name: str
    imei_code: str
    brand: str
    model: str
    storage: str
    amount: float
    notes: str
    status: str
    customer_name: str
    customer_phone: str
    customer_secondary_phone: str
    next_of_kin_name: str
    next_of_kin_relationship: str
    next_of_kin_phone: str
    next_of_kin_secondary_phone: str
    receipt_url: str = ""
    seller_id: int | None = None
    seller_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
