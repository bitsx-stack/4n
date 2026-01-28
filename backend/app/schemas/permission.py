from pydantic import BaseModel
from datetime import datetime

class ReadPermission(BaseModel):
    id: int
    name: str
    module: str
    created_at: datetime
    updated_at: datetime
    
    
class CreatePermission(BaseModel):
    name: str
    module: str