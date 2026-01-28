from datetime import datetime
from sqlmodel import Field, SQLModel

class Payment(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    ref: str
    type: str
    amount: float
    status: str
    user_id: int = Field(index=True)
    store_id: int = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})
