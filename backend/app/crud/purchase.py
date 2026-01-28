from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from crud.category import CategoryCRUD
from crud.category_type import CategoryTypeCRUD
from models.imei import Imei
from models.purchase import Purchase
from models.store import Store


class PurchaseCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, purchase_id: int) -> Purchase | None:
        stmt = (
            select(Purchase)
            .where(Purchase.id == purchase_id)
            .options(selectinload(Purchase.imeis))
        )
        return self.db.exec(stmt).first()

    def all(self) -> list[Purchase]:
        return self.db.exec(select(Purchase).order_by(Purchase.id.desc())).all()

    def create(
        self,
        *,
        vendor_id: int,
        brand_id: int,
        model_id: int,
        store_id: int,
        imei_codes: list[str],
        storage_size: str | None = None,
        status: str | None = None,
        total_price: float | None = None,
        paid_amount: float | None = None,
        payment_status: str | None = None,
    ) -> Purchase:
        store = self.db.exec(select(Store).where(Store.id == store_id)).first()
        if not store:
            raise ValueError("Store not found")

        clean_codes: list[str] = []
        seen = set()
        for c in imei_codes or []:
            code = (c or "").strip()
            if not code:
                continue
            if code in seen:
                continue
            seen.add(code)
            clean_codes.append(code)

        if not clean_codes:
            raise ValueError("No IMEI codes provided")

        brand = CategoryTypeCRUD(self.db).get_by_id(brand_id)
        if not brand:
            raise ValueError("Brand not found")

        model = CategoryCRUD(self.db).get_by_id(model_id)
        if not model:
            raise ValueError("Model not found")

        resolved_status = (status or "pending").strip().lower()
        if resolved_status not in {"pending", "completed"}:
            raise ValueError("Invalid status")

        resolved_payment_status = (payment_status or "unpaid").strip().lower()
        if resolved_payment_status not in {"unpaid", "partial", "paid"}:
            raise ValueError("Invalid payment_status")

        purchase = Purchase(
            vendor_id=vendor_id,
            brand_id=brand_id,
            model_id=model_id,
            store_id=store_id,
            quantity=len(clean_codes),
            status=resolved_status,
            total_price=float(total_price or 0.0),
            paid_amount=float(paid_amount or 0.0),
            payment_status=resolved_payment_status,
        )

        self.db.add(purchase)
        self.db.commit()
        self.db.refresh(purchase)

        # Create or update IMEIs and attach to this purchase.
        for code in clean_codes:
            existing = self.db.exec(select(Imei).where(Imei.code == code)).first()
            if existing:
                existing.vendor_id = vendor_id
                existing.brand = brand.name
                existing.model = model.name
                existing.storage_size = storage_size
                imei = existing
            else:
                imei = Imei(
                    code=code,
                    vendor_id=vendor_id,
                    brand=brand.name,
                    model=model.name,
                    storage_size=storage_size,
                )

            # Only count into inventory when completed.
            if resolved_status == "completed":
                if imei.stores is None:
                    imei.stores = []
                if store not in imei.stores:
                    imei.stores.append(store)

            self.db.add(imei)
            self.db.commit()
            self.db.refresh(imei)

            if imei not in (purchase.imeis or []):
                purchase.imeis.append(imei)

        self.db.add(purchase)
        self.db.commit()
        self.db.refresh(purchase)
        return purchase

    def update_status(self, purchase_id: int, status: str) -> Purchase:
        purchase = self.get_by_id(purchase_id)
        if not purchase:
            raise ValueError("Purchase not found")

        new_status = (status or "").strip().lower()
        if new_status not in {"pending", "completed"}:
            raise ValueError("Invalid status")

        old_status = (purchase.status or "pending").strip().lower()
        if old_status == new_status:
            return purchase

        purchase.status = new_status

        if old_status != "completed" and new_status == "completed":
            store = self.db.exec(select(Store).where(Store.id == purchase.store_id)).first()
            if not store:
                raise ValueError("Store not found")

            for imei in purchase.imeis or []:
                if imei.stores is None:
                    imei.stores = []
                if store not in imei.stores:
                    imei.stores.append(store)
                self.db.add(imei)

        self.db.add(purchase)
        self.db.commit()
        self.db.refresh(purchase)
        return purchase

    def update_payment(
        self,
        purchase_id: int,
        *,
        total_price: float | None = None,
        paid_amount: float | None = None,
        payment_status: str | None = None,
    ) -> Purchase:
        purchase = self.get_by_id(purchase_id)
        if not purchase:
            raise ValueError("Purchase not found")

        if total_price is not None:
            purchase.total_price = float(total_price)
        if paid_amount is not None:
            purchase.paid_amount = float(paid_amount)
        if payment_status is not None:
            resolved = payment_status.strip().lower()
            if resolved not in {"unpaid", "partial", "paid"}:
                raise ValueError("Invalid payment_status")
            purchase.payment_status = resolved

        self.db.add(purchase)
        self.db.commit()
        self.db.refresh(purchase)
        return purchase
