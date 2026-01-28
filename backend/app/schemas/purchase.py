from datetime import datetime
from pydantic import BaseModel


class CreatePurchase(BaseModel):
    vendor_id: int
    brand_id: int
    model_id: int
    store_id: int

    imei_codes: list[str]
    storage_size: str | None = None

    status: str | None = None  # pending | completed

    total_price: float | None = None
    paid_amount: float | None = None
    payment_status: str | None = None  # unpaid | partial | paid


class UpdatePurchaseStatus(BaseModel):
    status: str  # pending | completed


class UpdatePurchasePayment(BaseModel):
    total_price: float | None = None
    paid_amount: float | None = None
    payment_status: str | None = None  # unpaid | partial | paid


class ReadPurchase(BaseModel):
    id: int

    vendor_id: int
    vendor_name: str | None = None

    brand_id: int
    brand_name: str | None = None

    model_id: int
    model_name: str | None = None

    store_id: int
    store_name: str | None = None

    company_id: int | None = None
    company_name: str | None = None

    storage_size: str | None = None

    quantity: int
    status: str

    total_price: float
    paid_amount: float
    payment_status: str

    created_at: datetime
    updated_at: datetime
