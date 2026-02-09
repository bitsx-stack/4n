from sqlmodel import Session, select, func
from models.sale import Sale
from models.imei import Imei
from models.links import StoreImeiLink


class SaleCRUD:
    def __init__(self, db: Session):
        self.db = db

    # ── helpers ───────────────────────────────────────────────────
    def get_by_id(self, sale_id: int) -> Sale | None:
        return self.db.exec(select(Sale).where(Sale.id == sale_id)).first()

    # ── list (paginated, filterable) ─────────────────────────────
    def all(
        self,
        *,
        status: str | None = None,
        store_id: int | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[Sale], int]:
        base = select(Sale)
        count_base = select(func.count()).select_from(Sale)

        if status:
            base = base.where(Sale.status == status)
            count_base = count_base.where(Sale.status == status)
        if store_id:
            base = base.where(Sale.store_id == store_id)
            count_base = count_base.where(Sale.store_id == store_id)

        total = self.db.exec(count_base).one()
        items = self.db.exec(
            base.order_by(Sale.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()
        return items, total

    # ── create sale + deduct stock ───────────────────────────────
    def create(
        self,
        *,
        store_id: int,
        store_name: str,
        imei_code: str,
        brand: str,
        model: str,
        storage: str,
        amount: float,
        notes: str = "",
        customer_name: str,
        customer_phone: str,
        customer_secondary_phone: str = "",
        next_of_kin_name: str = "",
        next_of_kin_relationship: str = "",
        next_of_kin_phone: str = "",
        next_of_kin_secondary_phone: str = "",
        seller_id: int | None = None,
        seller_name: str = "",
        receipt_path: str = "",
    ) -> Sale:
        code = imei_code.strip()
        if not code:
            raise ValueError("IMEI code is required")

        # 1. Verify IMEI exists
        imei = self.db.exec(select(Imei).where(Imei.code == code)).first()
        if not imei:
            raise ValueError(f"IMEI {code} not found in the database")

        # 2. Verify IMEI is in the store
        link = self.db.exec(
            select(StoreImeiLink).where(
                StoreImeiLink.store_id == store_id,
                StoreImeiLink.imei_id == code,
            )
        ).first()
        if not link:
            raise ValueError(f"IMEI {code} is not available in this store")

        # 3. Auto-fill brand/model/storage from IMEI if not provided
        sale_brand = brand or imei.brand or ""
        sale_model = model or imei.model or ""
        sale_storage = storage or imei.storage_size or ""

        # 4. Remove IMEI from store (deduct stock)
        self.db.delete(link)

        # 5. Create sale record
        sale = Sale(
            store_id=store_id,
            store_name=store_name,
            imei_code=code,
            brand=sale_brand,
            model=sale_model,
            storage=sale_storage,
            amount=amount,
            notes=notes,
            status="completed",
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_secondary_phone=customer_secondary_phone,
            next_of_kin_name=next_of_kin_name,
            next_of_kin_relationship=next_of_kin_relationship,
            next_of_kin_phone=next_of_kin_phone,
            next_of_kin_secondary_phone=next_of_kin_secondary_phone,
            seller_id=seller_id,
            seller_name=seller_name,
            receipt_path=receipt_path,
        )
        self.db.add(sale)
        self.db.commit()
        self.db.refresh(sale)
        return sale

    # ── upload receipt (update path) ─────────────────────────────
    def set_receipt(self, sale_id: int, receipt_path: str) -> Sale:
        sale = self.get_by_id(sale_id)
        if not sale:
            raise ValueError("Sale not found")
        sale.receipt_path = receipt_path
        self.db.add(sale)
        self.db.commit()
        self.db.refresh(sale)
        return sale

    # ── cancel (does NOT re-add stock for safety) ────────────────
    def cancel(self, sale_id: int) -> Sale:
        sale = self.get_by_id(sale_id)
        if not sale:
            raise ValueError("Sale not found")
        if sale.status == "cancelled":
            raise ValueError("Sale is already cancelled")
        sale.status = "cancelled"
        self.db.add(sale)
        self.db.commit()
        self.db.refresh(sale)
        return sale
