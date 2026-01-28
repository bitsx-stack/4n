from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from schemas.payment import ReadPayment, CreatePayment
from crud.payment import PaymentCRUD
from core.database import get_db

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.post("/", response_model=ReadPayment)
def create_payment(data: CreatePayment, db: Session = Depends(get_db)):
    crud = PaymentCRUD(db)
    try:
        payment = crud.create(
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
    return payment

@router.get("/")
def get_all_payments(db: Session = Depends(get_db)):
    crud = PaymentCRUD(db)
    try:
        return crud.all()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
