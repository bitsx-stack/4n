# app/api/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from core.database import get_db
from schemas.vendor import ReadVendor, CreateVendor
from crud.vendor import VendorCRUD

router = APIRouter(prefix="/api/vendors", tags=["vendors"])

@router.post("/", response_model=ReadVendor)
def create_vendor(data: CreateVendor, db: Session = Depends(get_db)):
    crud = VendorCRUD(db)
    try:
        vendor = crud.create(
            phone=data.phone,
            name=data.name,
            email=data.email,
            tin=data.tin,
            code=data.code
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return vendor

@router.get("/")
def get_all_vendors(db: Session = Depends(get_db)):
    crud = VendorCRUD(db)
    try:
        return crud.all()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
