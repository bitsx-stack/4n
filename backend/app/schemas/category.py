from  pydantic import BaseModel

class CreateCategory(BaseModel):
    name: str
    categorytype_id: int

class CategoryTypeInfo(BaseModel):
    id: int
    name: str
    
    class Config:
        orm_mode = True
        from_attributes = True
    
class ReadCategory(BaseModel):
    id: int
    name: str
    categorytype_id: int
    category_type: CategoryTypeInfo | None = None
    
    class Config:
        orm_mode = True
        from_attributes = True