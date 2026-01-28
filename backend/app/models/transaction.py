from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
import uuid

if TYPE_CHECKING:
    from models.imei import Imei
    from models.store import Store
    from models.user import User
    
from .links import TransactionImeiLink

class Transaction(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    code: uuid.UUID = Field(default_factory=uuid.uuid4, sa_column_kwargs={"unique": True})
    ref: str = Field(unique=True, index=True)
    type: str
    quantity: int
    amount: float = Field(default=0.0)
    status: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})

    user_id: int = Field(foreign_key="user.id")
    store_id: int = Field(foreign_key="store.id")

    imeis: list["Imei"] = Relationship(back_populates="transactions", link_model=TransactionImeiLink)
    user: "User" = Relationship(back_populates="transactions")
    store: "Store" = Relationship(back_populates="transactions")
