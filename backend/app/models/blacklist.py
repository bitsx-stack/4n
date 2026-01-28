from sqlmodel import SQLModel, Field
from datetime import datetime

class BlackListedToken(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    token: str = Field(index=True)
    created_at: datetime = Field(default_factory=datetime.now)
