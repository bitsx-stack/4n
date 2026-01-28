# app/api/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from core.database import get_db
from schemas.user import UserCreate, UserRead
from crud.user import UserCRUD

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("/", response_model=UserRead)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    crud = UserCRUD(db)
    try:
        user = crud.create(
            phone=data.phone,
            fullname=data.fullname,
            password=data.password
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return user

@router.get("/all")
def get_all_users(db: Session = Depends(get_db)):
    crud = UserCRUD(db)
    try:
        return crud.all()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
    
 