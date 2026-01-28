from datetime import datetime
from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from .links import PurchaseImeiLink

if TYPE_CHECKING:
    from models.imei import Imei
    from models.store import Store
    from models.vendor import Vendor


class Purchase(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    vendor_id: int = Field(foreign_key="vendor.id", index=True)
    brand_id: int = Field(foreign_key="categorytype.id", index=True)
    model_id: int = Field(foreign_key="category.id", index=True)
    store_id: int = Field(foreign_key="store.id", index=True)

    quantity: int = Field(default=0)
    status: str = Field(default="pending", index=True)  # pending | completed

    total_price: float = Field(default=0.0)
    paid_amount: float = Field(default=0.0)
    payment_status: str = Field(default="unpaid", index=True)  # unpaid | partial | paid

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(
        default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now}
    )

    imeis: list["Imei"] = Relationship(back_populates="purchases", link_model=PurchaseImeiLink)
    vendor: "Vendor" = Relationship()
    store: "Store" = Relationship()
