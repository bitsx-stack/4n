from sqlmodel import Session, select
from models.stock_request import StockRequest
from models.links import StoreImeiLink
from models.imei import Imei


class StockRequestCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, request_id: int) -> StockRequest | None:
        return self.db.exec(
            select(StockRequest).where(StockRequest.id == request_id)
        ).first()

    def all(self, *, status: str | None = None, page: int = 1, page_size: int = 50) -> tuple[list[StockRequest], int]:
        """Return paginated list of stock requests, optionally filtered by status."""
        base = select(StockRequest)
        if status:
            base = base.where(StockRequest.status == status)

        # Count
        from sqlmodel import func
        count_stmt = select(func.count()).select_from(StockRequest)
        if status:
            count_stmt = count_stmt.where(StockRequest.status == status)
        total = self.db.exec(count_stmt).one()

        # Data
        stmt = base.order_by(StockRequest.id.desc()).offset((page - 1) * page_size).limit(page_size)
        items = self.db.exec(stmt).all()
        return items, total

    def get_by_store(self, store_id: int) -> list[StockRequest]:
        """Get all stock requests where the store is either source or destination."""
        return self.db.exec(
            select(StockRequest)
            .where(
                (StockRequest.source_store_id == store_id)
                | (StockRequest.destination_store_id == store_id)
            )
            .order_by(StockRequest.id.desc())
        ).all()

    def create(
        self,
        *,
        source_store_id: int,
        source_store_name: str,
        destination_store_id: int,
        destination_store_name: str,
        brand: str,
        model: str,
        storage: str,
        requested_quantity: int,
        available_stock: int = 0,
        notes: str = "",
        requested_imeis: list[str] | None = None,
    ) -> StockRequest:
        sr = StockRequest(
            source_store_id=source_store_id,
            source_store_name=source_store_name,
            destination_store_id=destination_store_id,
            destination_store_name=destination_store_name,
            brand=brand,
            model=model,
            storage=storage,
            requested_quantity=requested_quantity,
            available_stock=available_stock,
            moved_quantity=0,
            status="pending",
            notes=notes,
            requested_imeis=",".join(requested_imeis or []),
            transferred_imeis="",
            received_imeis="",
        )
        self.db.add(sr)
        self.db.commit()
        self.db.refresh(sr)
        return sr

    def cancel(self, request_id: int) -> StockRequest:
        """Cancel a pending stock request."""
        sr = self.get_by_id(request_id)
        if not sr:
            raise ValueError("Stock request not found")
        if sr.status != "pending":
            raise ValueError(f"Can only cancel pending requests, current status: {sr.status}")
        sr.status = "cancelled"
        self.db.add(sr)
        self.db.commit()
        self.db.refresh(sr)
        return sr

    def execute_transfer(
        self,
        request_id: int,
        *,
        transferred_imeis: list[str],
        quantity: int | None = None,
    ) -> StockRequest:
        """
        Warehouse scans IMEIs to fulfil a stock request.
        Validates each IMEI exists in the source store and matches brand/model/storage.
        Sets status to 'transferred'.
        """
        sr = self.get_by_id(request_id)
        if not sr:
            raise ValueError("Stock request not found")
        if sr.status != "pending":
            raise ValueError(f"Can only transfer pending requests, current status: {sr.status}")

        if not transferred_imeis:
            raise ValueError("Must scan at least one IMEI")

        # Quantity must not exceed requested
        actual_qty = quantity if quantity is not None else len(transferred_imeis)
        if actual_qty > sr.requested_quantity:
            raise ValueError(
                f"Cannot transfer {actual_qty} items, only {sr.requested_quantity} requested"
            )
        if len(transferred_imeis) > sr.requested_quantity:
            raise ValueError(
                f"Scanned {len(transferred_imeis)} IMEIs but only {sr.requested_quantity} requested"
            )

        # Validate each IMEI: must exist in source store and match brand/model/storage
        errors = []
        for code in transferred_imeis:
            imei = self.db.exec(
                select(Imei).where(Imei.code == code.strip())
            ).first()
            if not imei:
                errors.append(f"IMEI {code} not found in database")
                continue

            # Check it's linked to the source store
            link = self.db.exec(
                select(StoreImeiLink).where(
                    StoreImeiLink.store_id == sr.source_store_id,
                    StoreImeiLink.imei_id == code.strip(),
                )
            ).first()
            if not link:
                errors.append(f"IMEI {code} is not in the source store")
                continue

            # Check brand/model match
            if imei.brand.lower() != sr.brand.lower():
                errors.append(f"IMEI {code} brand '{imei.brand}' does not match '{sr.brand}'")
            if imei.model.lower() != sr.model.lower():
                errors.append(f"IMEI {code} model '{imei.model}' does not match '{sr.model}'")

        if errors:
            raise ValueError("; ".join(errors))

        sr.status = "transferred"
        sr.transferred_imeis = ",".join(transferred_imeis)
        sr.moved_quantity = len(transferred_imeis)
        self.db.add(sr)
        self.db.commit()
        self.db.refresh(sr)
        return sr

    def execute_receive(
        self,
        request_id: int,
        *,
        received_imeis: list[str],
    ) -> StockRequest:
        """
        Destination store scans IMEIs to confirm receipt.
        Validates each received IMEI was in the transferred list.
        Moves IMEIs: deletes StoreImeiLink from source, inserts for destination.
        Sets status to 'completed'.
        """
        sr = self.get_by_id(request_id)
        if not sr:
            raise ValueError("Stock request not found")
        if sr.status != "transferred":
            raise ValueError(f"Can only receive transferred requests, current status: {sr.status}")

        if not received_imeis:
            raise ValueError("Must scan at least one IMEI to receive")

        # Validate each received IMEI was actually transferred
        transferred_set = set(c.strip() for c in sr.transferred_imeis.split(",") if c.strip())
        invalid = [c for c in received_imeis if c.strip() not in transferred_set]
        if invalid:
            raise ValueError(f"These IMEIs were not in the transfer: {', '.join(invalid)}")

        # Move each IMEI from source store to destination store
        for code in received_imeis:
            code = code.strip()
            # Remove from source store
            old_link = self.db.exec(
                select(StoreImeiLink).where(
                    StoreImeiLink.store_id == sr.source_store_id,
                    StoreImeiLink.imei_id == code,
                )
            ).first()
            if old_link:
                self.db.delete(old_link)

            # Add to destination store (check if not already there)
            existing = self.db.exec(
                select(StoreImeiLink).where(
                    StoreImeiLink.store_id == sr.destination_store_id,
                    StoreImeiLink.imei_id == code,
                )
            ).first()
            if not existing:
                new_link = StoreImeiLink(
                    store_id=sr.destination_store_id,
                    imei_id=code,
                )
                self.db.add(new_link)

        sr.status = "completed"
        sr.received_imeis = ",".join(received_imeis)
        self.db.add(sr)
        self.db.commit()
        self.db.refresh(sr)
        return sr

    def update_status(
        self,
        request_id: int,
        *,
        status: str,
        moved_quantity: int | None = None,
        received_imeis: list[str] | None = None,
    ) -> StockRequest:
        sr = self.get_by_id(request_id)
        if not sr:
            raise ValueError("Stock request not found")

        valid = {"pending", "transferred", "completed", "cancelled", "rejected"}
        clean = (status or "").strip().lower()
        if clean not in valid:
            raise ValueError(f"Invalid status: {status}")

        sr.status = clean

        if moved_quantity is not None:
            sr.moved_quantity = moved_quantity

        if received_imeis is not None:
            sr.received_imeis = ",".join(received_imeis)

        self.db.add(sr)
        self.db.commit()
        self.db.refresh(sr)
        return sr
