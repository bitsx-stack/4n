from pydantic import EmailStr
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from .links import ClientUserLink
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.user import User
    from models.store import Store
    
    
class Client(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    email: EmailStr = Field(..., index=True, unique=True)
    phone: str  = Field(..., index=True, unique=True)
    tin: str = Field(..., index=True, unique=True)
    vrn: str | None = Field(default=None, index=True, unique=True)
    location: str
    status: str | None = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})

    users: list["User"] = Relationship(back_populates="clients", link_model=ClientUserLink, cascade_delete=False)
    stores: list["Store"] = Relationship(back_populates="client", cascade_delete=False)
