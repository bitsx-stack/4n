from datetime import datetime
from pydantic import BaseModel


class CreateStockRequest(BaseModel):
    source_store_id: int
    source_store_name: str
    destination_store_id: int
    destination_store_name: str
    brand: str
    model: str
    storage: str
    requested_quantity: int
    available_stock: int = 0
    notes: str = ""
    requested_imeis: list[str] = []


class UpdateStockRequestStatus(BaseModel):
    status: str  # pending, transferred, completed, cancelled, rejected
    moved_quantity: int | None = None
    received_imeis: list[str] | None = None


class ExecuteTransfer(BaseModel):
    """Warehouse scans IMEIs and transfers them."""
    transferred_imeis: list[str]
    quantity: int | None = None  # optional override, must be <= requested_quantity


class ExecuteReceive(BaseModel):
    """Destination store scans IMEIs to confirm receipt."""
    received_imeis: list[str]


class ReadStockRequest(BaseModel):
    id: int
    source_store_id: int
    source_store_name: str
    destination_store_id: int
    destination_store_name: str
    brand: str
    model: str
    storage: str
    requested_quantity: int
    available_stock: int
    moved_quantity: int
    status: str
    notes: str
    requested_imeis: list[str]
    transferred_imeis: list[str]
    received_imeis: list[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
