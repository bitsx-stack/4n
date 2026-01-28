from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from core.database import get_db
from schemas.imei import ReadImei, CreateImei
from crud.imei import ImeiCRUD

router = APIRouter(prefix="/api/imeis", tags=["imeis"])


@router.get("/storage-options")
def get_storage_options():
    return [
        {"id": 1, "name": "32 GB"},
        {"id": 2, "name": "64 GB"},
        {"id": 3, "name": "128 GB"},
        {"id": 4, "name": "256 GB"},
    ]

@router.get("/")
def get_all_imeis(db: Session = Depends(get_db)):
    crud = ImeiCRUD(db)
    try:
        imeis = crud.all()

        # Return a stable, filter-friendly shape to the frontend.
        # We keep the existing wrapper {data,total} for compatibility.
        data = []
        for i in imeis:
            try:
                # Pydantic v1
                data.append(ReadImei.from_orm(i).dict())
            except Exception:
                # Pydantic v2
                data.append(ReadImei.model_validate(i).model_dump())

        return {
            "data": data,
            "total": len(data)
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/", response_model=ReadImei)
def create_imei(data: CreateImei, db: Session = Depends(get_db)):
    crud = ImeiCRUD(db)
    try:
        imei = crud.create(
            code=data.code,
            vendor_id=data.vendor_id,
            brand=data.brand,
            model=data.model,
            storage_size=data.storage_size,
            store_id=data.store_id,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return imei

@router.get("/id/{id}")
def get_imei_by_id(id:int, db: Session = Depends(get_db)):
    crud = ImeiCRUD(db)
    try:
        imei = crud.get_by_id(id)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return imei

@router.get("/code/{code}")
def get_imei_by_code(code:str, db: Session = Depends(get_db)):
    crud = ImeiCRUD(db)
    try:
        imei = crud.get_by_code(code)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return imei


@router.get("/stores/{store_id}")
def get_by_store_id(store_id: int, db: Session = Depends(get_db)):
    crud = ImeiCRUD(db)
    try:
        imei = crud.all_by_store_id(
            store_id=store_id
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        
    return imei