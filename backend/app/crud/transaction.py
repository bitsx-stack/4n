from sqlmodel import Session, func, select
from models.transaction import Transaction
from crud.user import UserCRUD
from crud.imei import ImeiCRUD
from crud.store import StoreCRUD



class TransactionCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: int):
        return self.db.exec(select(Transaction).where(Transaction.id == id)).first()

    def create(self, ref: str, type: str, quantity: int, amount: float, status: str, user_id: int, imei_code: str, store_id: int):
        
        user = self.get_object_by_id(UserCRUD, user_id)
        imei = self.get_object_by_code(ImeiCRUD, imei_code)
        store = self.get_object_by_id(StoreCRUD, store_id)
        
        transaction = Transaction(ref=ref, type=type, quantity=quantity, amount=amount, status=status, user=user, imei=imei, store=store)
        self.db.add(transaction)
        self.db.commit()
        self.db.refresh(transaction)
        return transaction

    def all(self):
        transaction = self.db.exec(select(Transaction)).all()
        return transaction
    
    def get_object_by_id(self, object:any, id: int):
        entity = object(self.db)
        return entity.get_by_id(id)
    
    
    def get_object_by_code(self, object:any, id: int):
        entity = object(self.db)
        return entity.get_by_code(id)
    
    
    
        
        