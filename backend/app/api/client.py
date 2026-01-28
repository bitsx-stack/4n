# app/api/user.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from schemas.client import ClientRead, ClientCreate
from crud.client import ClientCRUD
from core.database import get_db


router = APIRouter(prefix="/api/clients", tags=["clients"])

@router.post("/", response_model=ClientRead)
def create_client( data: ClientCreate, db: Session = Depends(get_db)):
    crud = ClientCRUD(db)
    try:
        client = crud.create(
            name=data.name,
            location=data.location,
            email=data.email,
            phone=data.phone,   
            tin=data.tin,
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    return client

@router.get("/")
def get_all_clients(db: Session = Depends(get_db)):
    crud = ClientCRUD(db)
    try:
        return crud.all()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        


@router.put("/{id}", response_model=ClientRead)
def get_client_by_code(id: int, db: Session = Depends(get_db)):
    crud = ClientCRUD(db)
    client = crud.update(id, client)
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return client