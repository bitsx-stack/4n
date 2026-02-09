import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlmodel import Session

from core.database import get_db
from crud.sale import SaleCRUD
from schemas.sale import CreateSale, ReadSale

router = APIRouter(prefix="/api/sales", tags=["sales"])

# Directory where receipts are stored inside the container
RECEIPT_DIR = Path("/app/uploads/receipts")
RECEIPT_DIR.mkdir(parents=True, exist_ok=True)


def _to_read(sale, request_base: str = "") -> ReadSale:
    receipt_url = ""
    if sale.receipt_path:
        receipt_url = f"{request_base}/api/sales/{sale.id}/receipt"
    return ReadSale(
        id=sale.id,
        store_id=sale.store_id,
        store_name=sale.store_name,
        imei_code=sale.imei_code,
        brand=sale.brand,
        model=sale.model,
        storage=sale.storage,
        amount=sale.amount,
        notes=sale.notes or "",
        status=sale.status,
        customer_name=sale.customer_name,
        customer_phone=sale.customer_phone,
        customer_secondary_phone=sale.customer_secondary_phone or "",
        next_of_kin_name=sale.next_of_kin_name or "",
        next_of_kin_relationship=sale.next_of_kin_relationship or "",
        next_of_kin_phone=sale.next_of_kin_phone or "",
        next_of_kin_secondary_phone=sale.next_of_kin_secondary_phone or "",
        receipt_url=receipt_url,
        seller_id=sale.seller_id,
        seller_name=sale.seller_name or "",
        created_at=sale.created_at,
        updated_at=sale.updated_at,
    )


# ── LIST (paginated + filterable) ────────────────────────────────
@router.get("/")
def get_all_sales(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    status_filter: str | None = Query(None, alias="status"),
    store_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    crud = SaleCRUD(db)
    try:
        items, total = crud.all(
            status=status_filter, store_id=store_id, page=page, page_size=pageSize
        )
        data = [_to_read(s) for s in items]
        return {"data": data, "total": total, "page": page, "pageSize": pageSize}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ── GET single sale ─────────────────────────────────────────────
@router.get("/{sale_id}")
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    crud = SaleCRUD(db)
    sale = crud.get_by_id(sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return _to_read(sale)


# ── CREATE sale (JSON body, no receipt yet) ──────────────────────
@router.post("/", response_model=ReadSale)
def create_sale(data: CreateSale, db: Session = Depends(get_db)):
    crud = SaleCRUD(db)
    try:
        sale = crud.create(
            store_id=data.store_id,
            store_name=data.store_name,
            imei_code=data.imei_code,
            brand=data.brand,
            model=data.model,
            storage=data.storage,
            amount=data.amount,
            notes=data.notes,
            customer_name=data.customer_name,
            customer_phone=data.customer_phone,
            customer_secondary_phone=data.customer_secondary_phone,
            next_of_kin_name=data.next_of_kin_name,
            next_of_kin_relationship=data.next_of_kin_relationship,
            next_of_kin_phone=data.next_of_kin_phone,
            next_of_kin_secondary_phone=data.next_of_kin_secondary_phone,
            seller_id=data.seller_id,
            seller_name=data.seller_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return _to_read(sale)


# ── UPLOAD RECEIPT (multipart) ───────────────────────────────────
@router.post("/{sale_id}/receipt", response_model=ReadSale)
def upload_receipt(
    sale_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    crud = SaleCRUD(db)
    sale = crud.get_by_id(sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    ext = os.path.splitext(file.filename or "receipt.jpg")[1] or ".jpg"
    filename = f"{sale_id}_{uuid.uuid4().hex}{ext}"
    filepath = RECEIPT_DIR / filename

    with open(filepath, "wb") as f:
        content = file.file.read()
        f.write(content)

    sale = crud.set_receipt(sale_id, str(filepath))
    return _to_read(sale)


# ── DOWNLOAD / VIEW RECEIPT ──────────────────────────────────────
@router.get("/{sale_id}/receipt")
def get_receipt(sale_id: int, db: Session = Depends(get_db)):
    crud = SaleCRUD(db)
    sale = crud.get_by_id(sale_id)
    if not sale or not sale.receipt_path:
        raise HTTPException(status_code=404, detail="Receipt not found")
    path = Path(sale.receipt_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Receipt file missing")
    return FileResponse(path)


# ── CANCEL ───────────────────────────────────────────────────────
@router.put("/{sale_id}/cancel")
def cancel_sale(sale_id: int, db: Session = Depends(get_db)):
    crud = SaleCRUD(db)
    try:
        sale = crud.cancel(sale_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return _to_read(sale)
