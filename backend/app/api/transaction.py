from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from schemas.transaction import ReadTransaction, CreateTransaction
from crud.transaction import TransactionCRUD
from core.database import get_db


router = APIRouter(prefix="/api/transactions", tags=["transactions"])

@router.post("/", response_model=ReadTransaction)
def create_transaction(data: CreateTransaction, db: Session = Depends(get_db)):
    crud = TransactionCRUD(db)
    try:
        transaction = crud.create(
            ref=data.ref, 
            type=data.type, 
            quantity=data.quantity, 
            amount=data.amount, 
            status=data.status, 
            user_id=data.user_id, 
            imei_code=data.imei_code, 
            store_id=data.store_id 
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return transaction

@router.get("/")
def get_all_transactions(db: Session = Depends(get_db)):
    crud = TransactionCRUD(db)
    try:
        return crud.all()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
