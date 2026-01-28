from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from models.client import Client
    from models.imei import Imei
    from models.transaction import Transaction
    
from .links import StoreImeiLink

class Store(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    type: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})

    client_id: int | None = Field(default=None, foreign_key="client.id")

    client: "Client" = Relationship(back_populates="stores", cascade_delete=False)
    imeis: list["Imei"] = Relationship(back_populates="stores", link_model=StoreImeiLink, cascade_delete=False)
    transactions: list["Transaction"] = Relationship(back_populates="store")
