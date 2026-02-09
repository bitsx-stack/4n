from datetime import datetime
from sqlmodel import Field, SQLModel


class StockRequest(SQLModel, table=True):
    __tablename__ = "stock_request"

    id: int | None = Field(default=None, primary_key=True)
    source_store_id: int = Field(index=True)
    source_store_name: str
    destination_store_id: int = Field(index=True)
    destination_store_name: str
    brand: str
    model: str
    storage: str
    requested_quantity: int
    available_stock: int = 0
    moved_quantity: int = 0
    # pending → transferred → completed | cancelled | rejected
    status: str = Field(default="pending")
    notes: str = Field(default="")
    requested_imeis: str = Field(default="")      # comma-separated IMEI codes (from request)
    transferred_imeis: str = Field(default="")     # comma-separated IMEI codes (scanned during transfer)
    received_imeis: str = Field(default="")        # comma-separated IMEI codes (scanned during receive)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})
