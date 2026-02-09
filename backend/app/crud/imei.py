from sqlalchemy.orm import selectinload
from sqlmodel import Session, func, select
from models.imei import Imei
from models.store import Store
from models.links import StoreImeiLink



class ImeiCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: int):
        stmt = select(Imei).where(Imei.id == id).options(selectinload(Imei.stores))
        return self.db.exec(stmt).first()

    def get_by_code(self, code: str):
        clean = code.strip()
        stmt = select(Imei).where(
            func.lower(func.trim(Imei.code)) == clean.lower()
        ).options(selectinload(Imei.stores))
        return self.db.exec(stmt).first()

    def create(self, code: str, brand: str, model: str, store_id: int, vendor_id: int | None = None, storage_size: str | None = None):
        store = self.db.exec(select(Store).where(Store.id == store_id)).first()
        if not store:
            raise ValueError("Store not found")

        existing = self.get_by_code(code)
        if existing:
            existing.brand = brand
            existing.model = model
            existing.vendor_id = vendor_id
            existing.storage_size = storage_size

            if store not in (existing.stores or []):
                existing.stores.append(store)

            self.db.add(existing)
            self.db.commit()
            self.db.refresh(existing)
            return existing

        imei = Imei(
            code=code.strip(),
            brand=brand,
            model=model,
            vendor_id=vendor_id,
            storage_size=storage_size,
            stores=[store],
        )
        self.db.add(imei)
        self.db.commit()
        self.db.refresh(imei)
        return imei

    def all_by_store_id(self, store_id: int):
        stmt = (
            select(Imei)
            .join(StoreImeiLink, StoreImeiLink.imei_id == Imei.code)
            .where(StoreImeiLink.store_id == store_id)
            .options(selectinload(Imei.stores))
        )
        return self.db.exec(stmt).all()
    
    def all(self):
        stmt = select(Imei).options(selectinload(Imei.stores))
        return self.db.exec(stmt).all()