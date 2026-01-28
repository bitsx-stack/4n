from  pydantic import BaseModel

class CreateCategoryType(BaseModel):
    name: str
    
class ReadCategoryType(BaseModel):
    id: int
    name: str