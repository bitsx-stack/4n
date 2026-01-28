# app/api/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from schemas.category_type import ReadCategoryType, CreateCategoryType
from crud.category_type import CategoryTypeCRUD
from core.database import get_db


router = APIRouter(prefix="/api/category-types", tags=["category-types"])

@router.post("/", response_model=ReadCategoryType)
def create_category_type(data: CreateCategoryType, db: Session = Depends(get_db)):
    crud = CategoryTypeCRUD(db)
    try:
        category_type = crud.create(
            name=data.name,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return category_type

@router.get("/")
def list_category_types(page: int = 1, pageSize: int = 10, search: str = None, db: Session = Depends(get_db)):
    crud = CategoryTypeCRUD(db)
    try:
        category_type = crud.paginated(page=page, pageSize=pageSize, search=search)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return category_type


@router.put("/{category_type_id}", response_model=ReadCategoryType)
def update_category_type(category_type_id: int, data: CreateCategoryType, db: Session = Depends(get_db)):
    crud = CategoryTypeCRUD(db)
    try:
        category_type = crud.update(
            id=category_type_id,
            name=data.name,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return category_type

@router.delete("/{category_type_id}")
def delete_category_type(category_type_id: int, db: Session = Depends(get_db)):
    crud = CategoryTypeCRUD(db)
    
    try:
        crud.delete(category_type_id)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    return {"detail": "Category Type deleted successfully"}