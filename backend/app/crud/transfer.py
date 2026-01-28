from sqlmodel import Session, select
from models.transfer import Transfer

class TransferCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, transfer_id: int) -> Transfer | None:
        return self.db.exec(select(Transfer).where(Transfer.id == transfer_id)).first()

    def all(self) -> list[Transfer]:
        return self.db.exec(select(Transfer).order_by(Transfer.id.desc())).all()

    def create(self, *, ref: str, type: str, amount: float, status: str, user_id: int, store_id: int) -> Transfer:
        transfer = Transfer(ref=ref, type=type, amount=amount, status=status, user_id=user_id, store_id=store_id)
        self.db.add(transfer)
        self.db.commit()
        self.db.refresh(transfer)
        return transfer
