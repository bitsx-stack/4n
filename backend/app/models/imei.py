from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from .links import StoreImeiLink, TransactionImeiLink, PurchaseImeiLink

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.transaction import Transaction
    from models.store import Store
    from models.purchase import Purchase

class Imei(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    vendor_id: int | None = Field(default=None, foreign_key="vendor.id")
    brand: str
    model: str
    storage_size: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})

    stores: list["Store"] = Relationship(back_populates="imeis", link_model=StoreImeiLink)
    transactions: list["Transaction"] = Relationship(back_populates="imeis", link_model=TransactionImeiLink)
    purchases: list["Purchase"] = Relationship(back_populates="imeis", link_model=PurchaseImeiLink)
