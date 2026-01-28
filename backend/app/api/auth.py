from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from bcrypt import checkpw

from schemas.user import UserRead
from core.database import get_db
from schemas.auth import Token
from core.security import auth_required, create_access_token, get_current_token, oauth2_scheme
from crud.user import UserCRUD
from crud.blacklist import BlackListCRUD

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    crud = UserCRUD(db)
    user = crud.get_by_phone(form.username)
    if not user or not checkpw(form.password.encode("utf-8"), user.hashed_password.encode("utf-8")):
        raise HTTPException(status_code=400, detail="Incorrect credentials")
    
    access_token = create_access_token(subject=str(user.id))
    return Token(access_token=access_token)

@router.get("/me", response_model=UserRead)
@auth_required
async def me(request: Request, db: Session = Depends(get_db)):
    id = request.state.user["sub"]
    crud = UserCRUD(db)
    return crud.get_by_id(id)


@router.get("/me/clients")
@auth_required
async def me(request: Request, db: Session = Depends(get_db)):
    id = request.state.user["sub"]
    crud = UserCRUD(db)
    return crud.get_user_client(id)

@router.post("/logout")
async def logout(request: Request, token=Depends(get_current_token)):
    crud = BlackListCRUD(request.state.db)
    crud.add(token)
    return {"message": "Logged out successfully"}
