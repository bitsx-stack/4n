from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from schemas.transfer import ReadTransfer, CreateTransfer
from crud.transfer import TransferCRUD
from core.database import get_db

router = APIRouter(prefix="/api/transfers", tags=["transfers"])

@router.post("/", response_model=ReadTransfer)
def create_transfer(data: CreateTransfer, db: Session = Depends(get_db)):
    crud = TransferCRUD(db)
    try:
        transfer = crud.create(
            ref=data.ref,
            type=data.type,
            amount=data.amount,
            status=data.status,
            user_id=data.user_id,
            store_id=data.store_id
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return transfer

@router.get("/")
def get_all_transfers(db: Session = Depends(get_db)):
    crud = TransferCRUD(db)
    try:
        return crud.all()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
