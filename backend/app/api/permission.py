# app/api/user.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

from schemas.permission import ReadPermission, CreatePermission
from crud.permission import PermissionCRUD
from core.database import get_db


router = APIRouter(prefix="/api/permissions", tags=["permissions"])

@router.post("/", response_model=ReadPermission)
def create_permission(data: CreatePermission, db: Session = Depends(get_db)):
    crud = PermissionCRUD(db)
    try:
        permission = crud.create(
            name=data.name,
            module=data.module,
            
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return permission

@router.get("/")
def get_all_permissions(
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query(None),
    sort_by: str = Query("id"),
    sort_order: str = Query("asc"),
    name: str = Query(None),
    module: str = Query(None),
):
    crud = PermissionCRUD(db)
    try:
        result = crud.list_permissions(
            page=page,
            page_size=page_size,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
            name=name,
            module=module,
        )
        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
