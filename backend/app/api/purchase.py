from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from core.database import get_db
from crud.category import CategoryCRUD
from crud.category_type import CategoryTypeCRUD
from crud.client import ClientCRUD
from crud.purchase import PurchaseCRUD
from crud.vendor import VendorCRUD
from crud.store import StoreCRUD
from schemas.purchase import (
    CreatePurchase,
    ReadPurchase,
    UpdatePurchasePayment,
    UpdatePurchaseStatus,
)

router = APIRouter(prefix="/api/purchases", tags=["purchases"])


def _to_read_purchase(db: Session, purchase) -> ReadPurchase:
    vendor = VendorCRUD(db).get_by_id(purchase.vendor_id)
    brand = CategoryTypeCRUD(db).get_by_id(purchase.brand_id)
    model = CategoryCRUD(db).get_by_id(purchase.model_id)
    store = StoreCRUD(db).get_by_id(purchase.store_id)

    company_id = getattr(store, "client_id", None) if store else None
    company = ClientCRUD(db).get_by_id(company_id) if company_id else None
    company_name = getattr(company, "name", None)

    storage_size = None
    if purchase.imeis:
        storage_size = purchase.imeis[0].storage_size

    return ReadPurchase(
        id=purchase.id,
        vendor_id=purchase.vendor_id,
        vendor_name=getattr(vendor, "name", None),
        brand_id=purchase.brand_id,
        brand_name=getattr(brand, "name", None),
        model_id=purchase.model_id,
        model_name=getattr(model, "name", None),
        store_id=purchase.store_id,
        store_name=getattr(store, "name", None),
        company_id=company_id,
        company_name=company_name,
        storage_size=storage_size,
        quantity=purchase.quantity,
        status=purchase.status,
        total_price=purchase.total_price,
        paid_amount=purchase.paid_amount,
        payment_status=purchase.payment_status,
        created_at=purchase.created_at,
        updated_at=purchase.updated_at,
    )


@router.get("/")
def get_all_purchases(db: Session = Depends(get_db)):
    crud = PurchaseCRUD(db)
    try:
        purchases = crud.all()
        data = [_to_read_purchase(db, p) for p in purchases]
        return {"data": data, "total": len(data)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/", response_model=ReadPurchase)
def create_purchase(payload: CreatePurchase, db: Session = Depends(get_db)):
    crud = PurchaseCRUD(db)
    try:
        purchase = crud.create(
            vendor_id=payload.vendor_id,
            brand_id=payload.brand_id,
            model_id=payload.model_id,
            store_id=payload.store_id,
            imei_codes=payload.imei_codes,
            storage_size=payload.storage_size,
            status=payload.status,
            total_price=payload.total_price,
            paid_amount=payload.paid_amount,
            payment_status=payload.payment_status,
        )
        return _to_read_purchase(db, purchase)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{purchase_id}/status", response_model=ReadPurchase)
def update_purchase_status(
    purchase_id: int, payload: UpdatePurchaseStatus, db: Session = Depends(get_db)
):
    crud = PurchaseCRUD(db)
    try:
        purchase = crud.update_status(purchase_id, payload.status)
        return _to_read_purchase(db, purchase)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{purchase_id}/payment", response_model=ReadPurchase)
def update_purchase_payment(
    purchase_id: int, payload: UpdatePurchasePayment, db: Session = Depends(get_db)
):
    crud = PurchaseCRUD(db)
    try:
        purchase = crud.update_payment(
            purchase_id,
            total_price=payload.total_price,
            paid_amount=payload.paid_amount,
            payment_status=payload.payment_status,
        )
        return _to_read_purchase(db, purchase)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
