from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session

from core.database import get_db
from crud.stock_request import StockRequestCRUD
from schemas.stock_request import (
    CreateStockRequest,
    ExecuteReceive,
    ExecuteTransfer,
    ReadStockRequest,
    UpdateStockRequestStatus,
)

router = APIRouter(prefix="/api/stock-requests", tags=["stock-requests"])


def _to_read(sr) -> ReadStockRequest:
    return ReadStockRequest(
        id=sr.id,
        source_store_id=sr.source_store_id,
        source_store_name=sr.source_store_name,
        destination_store_id=sr.destination_store_id,
        destination_store_name=sr.destination_store_name,
        brand=sr.brand,
        model=sr.model,
        storage=sr.storage,
        requested_quantity=sr.requested_quantity,
        available_stock=sr.available_stock,
        moved_quantity=sr.moved_quantity,
        status=sr.status,
        notes=sr.notes or "",
        requested_imeis=[c for c in (sr.requested_imeis or "").split(",") if c],
        transferred_imeis=[c for c in (sr.transferred_imeis or "").split(",") if c],
        received_imeis=[c for c in (sr.received_imeis or "").split(",") if c],
        created_at=sr.created_at,
        updated_at=sr.updated_at,
    )


@router.get("/")
def get_all_stock_requests(
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=200),
    status_filter: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    crud = StockRequestCRUD(db)
    try:
        items, total = crud.all(status=status_filter, page=page, page_size=pageSize)
        data = [_to_read(i) for i in items]
        return {"data": data, "total": total, "page": page, "pageSize": pageSize}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/store/{store_id}")
def get_stock_requests_by_store(store_id: int, db: Session = Depends(get_db)):
    """Get all stock requests where the given store is either source or destination."""
    crud = StockRequestCRUD(db)
    try:
        items = crud.get_by_store(store_id)
        data = [_to_read(i) for i in items]
        return {"data": data, "total": len(data)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{request_id}")
def get_stock_request(request_id: int, db: Session = Depends(get_db)):
    crud = StockRequestCRUD(db)
    try:
        sr = crud.get_by_id(request_id)
        if not sr:
            raise HTTPException(status_code=404, detail="Stock request not found")
        return _to_read(sr)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/", response_model=ReadStockRequest)
def create_stock_request(payload: CreateStockRequest, db: Session = Depends(get_db)):
    crud = StockRequestCRUD(db)
    try:
        sr = crud.create(
            source_store_id=payload.source_store_id,
            source_store_name=payload.source_store_name,
            destination_store_id=payload.destination_store_id,
            destination_store_name=payload.destination_store_name,
            brand=payload.brand,
            model=payload.model,
            storage=payload.storage,
            requested_quantity=payload.requested_quantity,
            available_stock=payload.available_stock,
            notes=payload.notes,
            requested_imeis=payload.requested_imeis,
        )
        return _to_read(sr)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{request_id}/transfer", response_model=ReadStockRequest)
def execute_transfer(
    request_id: int,
    payload: ExecuteTransfer,
    db: Session = Depends(get_db),
):
    """Warehouse scans IMEIs and transfers them. Validates IMEIs exist in source store."""
    crud = StockRequestCRUD(db)
    try:
        sr = crud.execute_transfer(
            request_id,
            transferred_imeis=payload.transferred_imeis,
            quantity=payload.quantity,
        )
        return _to_read(sr)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{request_id}/receive", response_model=ReadStockRequest)
def execute_receive(
    request_id: int,
    payload: ExecuteReceive,
    db: Session = Depends(get_db),
):
    """
    Destination store scans IMEIs to confirm receipt.
    Moves IMEIs from source to destination store. Marks as completed.
    """
    crud = StockRequestCRUD(db)
    try:
        sr = crud.execute_receive(
            request_id,
            received_imeis=payload.received_imeis,
        )
        return _to_read(sr)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{request_id}/cancel", response_model=ReadStockRequest)
def cancel_stock_request(
    request_id: int,
    db: Session = Depends(get_db),
):
    """Cancel a pending stock request."""
    crud = StockRequestCRUD(db)
    try:
        sr = crud.cancel(request_id)
        return _to_read(sr)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{request_id}/status", response_model=ReadStockRequest)
def update_stock_request_status(
    request_id: int,
    payload: UpdateStockRequestStatus,
    db: Session = Depends(get_db),
):
    crud = StockRequestCRUD(db)
    try:
        sr = crud.update_status(
            request_id,
            status=payload.status,
            moved_quantity=payload.moved_quantity,
            received_imeis=payload.received_imeis,
        )
        return _to_read(sr)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
