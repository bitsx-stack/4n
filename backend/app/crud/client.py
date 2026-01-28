from sqlmodel import Session, select
from schemas.client import ClientUpdate
from models.client import Client



class ClientCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: int):
        return self.db.exec(select(Client).where(Client.id == id)).first()

    def create(self, name: str, location: str, email: str, phone: str, tin: str):
        client = Client(name=name, location=location, email=email, phone=phone, tin=tin)
        self.db.add(client)
        self.db.commit()
        self.db.refresh(client)
        return client
    
    def all(self):
        return self.db.exec(select(Client)).all()
    
    def update(self,id: int, client: ClientUpdate):
        client = self.db.get(Client, id)
        self.db.add(client)
        self.db.commit()
        self.db.refresh(client)
        return client
