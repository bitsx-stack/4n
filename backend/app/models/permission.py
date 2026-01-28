from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from .links import PermissionUserLink
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models.user import User

class Permission(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    module: str
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})

    users: list["User"] = Relationship(back_populates="permissions", link_model=PermissionUserLink)
