from sqlmodel import Session, select
from models.payment import Payment

class PaymentCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, payment_id: int) -> Payment | None:
        return self.db.exec(select(Payment).where(Payment.id == payment_id)).first()

    def all(self) -> list[Payment]:
        return self.db.exec(select(Payment).order_by(Payment.id.desc())).all()

    def create(self, *, ref: str, type: str, amount: float, status: str, user_id: int, store_id: int) -> Payment:
        payment = Payment(ref=ref, type=type, amount=amount, status=status, user_id=user_id, store_id=store_id)
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment
