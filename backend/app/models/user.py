from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime

if TYPE_CHECKING:
    from models.client import Client
    from models.transaction import Transaction
    from models.permission import Permission

from .links import ClientUserLink, PermissionUserLink

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    phone: str = Field(index=True, unique=True)
    fullname: str
    hashed_password: str
    is_active: bool = True
    role: str = Field(default="user")
    tags: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})

    clients: list["Client"] = Relationship(back_populates="users", link_model=ClientUserLink)
    transactions: list["Transaction"] = Relationship(back_populates="user")
    permissions: list["Permission"] = Relationship(back_populates="users", link_model=PermissionUserLink)
