from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from core.database import get_db
from schemas.store import ReadStore, CreateStore
from crud.store import StoreCRUD

router = APIRouter(prefix="/api/stores", tags=["stores"])

@router.post("/", response_model=ReadStore)
def create_store(data: CreateStore, db: Session = Depends(get_db)):
    crud = StoreCRUD(db)
    try:
        store = crud.create(
            name=data.name,
            type=data.type,
            client_id=data.client_id
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return store


@router.get("/", response_model=list[ReadStore])
def list_stores(client_id: int | None = None, db: Session = Depends(get_db)):
    """List stores.

    Supports filtering by client via `?client_id=...`.
    This matches the mobile app request: `/stores?client_id=1`.
    """
    crud = StoreCRUD(db)
    try:
        if client_id is not None:
            return crud.get_by_client_id(client_id)
        return crud.all()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{client_id}", response_model=list[ReadStore])
def get_all_stores(client_id: int, db: Session = Depends(get_db)):
    crud = StoreCRUD(db)
    try:
        return crud.get_by_client_id(client_id)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))