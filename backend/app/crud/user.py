# app/crud/user.py
from sqlmodel import Session, select
from models.user import User
from bcrypt import hashpw, gensalt



class UserCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_phone(self, phone: str):
        return self.db.exec(select(User).where(User.phone == phone)).first()
    
    def get_by_id(self, id: int):
        return self.db.exec(select(User).where(User.id == id)).first()
    
    def get_user_client(self, id: int):
        
        return self.db.exec(select(User).where(User.id == id)).first().clients

    def create(self, phone: str, fullname: str, password: str):
        hashed = hashpw(password.encode('utf-8'), gensalt()).decode("utf-8")
        user = User(phone=phone, fullname=fullname, hashed_password=hashed)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def all(self):
        return self.db.exec(select(User)).all()
    
