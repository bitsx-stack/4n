from sqlmodel import Session, select
from models.store import Store



class StoreCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: int):
        return self.db.exec(select(Store).where(Store.id == id)).first()
    
    def get_by_client_id(self, client_id: int):
        return self.db.exec(select(Store).where(Store.client_id == client_id)).all()

    def create(self, name: str, type: str, client_id: int):
        store = Store(name=name, type=type, client_id=client_id)
        self.db.add(store)
        self.db.commit()
        self.db.refresh(store)
        return store

    def all(self):
        return self.db.exec(select(Store)).all()