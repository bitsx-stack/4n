from sqlmodel import Session, select
from models.vendor import Vendor


class VendorCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: int):
        return self.db.exec(select(Vendor).where(Vendor.id == id)).first()

    def get_by_code(self, code: str):
        return self.db.exec(select(Vendor).where(Vendor.code == code)).first()

    def create(self, phone: str, name: str, tin: str, email: str, code:str):
        vendor = Vendor(phone=phone,name=name, tin=tin, email=email, code=code)
        self.db.add(vendor)
        self.db.commit()
        self.db.refresh(vendor)
        return vendor

    def all(self):
        return self.db.exec(select(Vendor)).all()