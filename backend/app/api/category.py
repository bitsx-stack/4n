# app/api/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from schemas.category import ReadCategory, CreateCategory
from crud.category import CategoryCRUD
from core.database import get_db


router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.post("/", response_model=ReadCategory)
def create_category(data: CreateCategory, db: Session = Depends(get_db)):
    crud = CategoryCRUD(db)
    try:
        category = crud.create(
            name=data.name,
            categorytype_id=data.categorytype_id
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return category


    
@router.get("/type/{category_type_id}")
def list_categories_by_type_id(category_type_id: int, page: int = 1, pageSize: int = 10, search: str = None, db: Session = Depends(get_db)):
    crud = CategoryCRUD(db)
    try:
        result = crud.paginated_by_type_id(category_type_id=category_type_id, page=page, pageSize=pageSize, search=search)
        # Convert the data to ReadCategory with relationships loaded
        categories_data = []
        for category in result["data"]:
            categories_data.append(ReadCategory.from_orm(category))
        
        return {
            "data": categories_data,
            "total": result["total"],
            "page": result["page"],
            "pageSize": result["pageSize"]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/typename/{category_type_name}")
def list_categories_by_type_name(category_type_name: str, page: int = 1, pageSize: int = 10, search: str = None, db: Session = Depends(get_db)):
    crud = CategoryCRUD(db)
    try:
        result = crud.paginated_by_type_name(category_type_name=category_type_name, page=page, pageSize=pageSize, search=search)
        # Convert the data to ReadCategory with relationships loaded
        categories_data = []
        for category in result["data"]:
            categories_data.append(ReadCategory.from_orm(category))
        
        return {
            "data": categories_data,
            "total": result["total"],
            "page": result["page"],
            "pageSize": result["pageSize"]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/")
def list_categories(page: int = 1, pageSize: int = 10, search: str = None, db: Session = Depends(get_db)):
    crud = CategoryCRUD(db)
    try:
        result = crud.paginated(page=page, pageSize=pageSize, search=search)
        # Convert the data to ReadCategory with relationships loaded
        categories_data = []
        for category in result["data"]:
            categories_data.append(ReadCategory.from_orm(category))
        
        return {
            "data": categories_data,
            "total": result["total"],
            "page": result["page"],
            "pageSize": result["pageSize"]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.get("/{category_id}", response_model=ReadCategory)
def get_category(category_id: int, db: Session = Depends(get_db)):
    crud = CategoryCRUD(db)
    try:
        category = crud.get_by_id(category_id)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    return category

@router.put("/{category_id}", response_model=ReadCategory)
def update_category(category_id: int, data: CreateCategory, db: Session = Depends(get_db)):
    crud = CategoryCRUD(db)
    try:
        category = crud.update(
            id=category_id,
            name=data.name,
            categorytype_id=data.categorytype_id
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return category

@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    crud = CategoryCRUD(db)
    try:
        crud.delete(category_id)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    return {"message": "Category deleted successfully"}