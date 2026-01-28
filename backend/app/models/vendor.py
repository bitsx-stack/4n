from sqlmodel import SQLModel, Field
from datetime import datetime

class Vendor(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    code: str = Field(unique=True, index=True)
    phone: str = Field(unique=True, index=True)
    tin: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})
