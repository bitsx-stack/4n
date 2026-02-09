from datetime import datetime
from sqlmodel import Field, SQLModel


class Sale(SQLModel, table=True):
    """
    Represents a completed sale of an IMEI to a customer.
    The IMEI is deducted from the store's stock on creation.
    receipt_path stores the server-relative path to the uploaded receipt image.
    """
    __tablename__ = "sale"

    id: int | None = Field(default=None, primary_key=True)

    # Store info
    store_id: int = Field(index=True)
    store_name: str = ""

    # IMEI sold
    imei_code: str = Field(index=True)
    brand: str = ""
    model: str = ""
    storage: str = ""

    # Sale details
    amount: float = 0.0
    notes: str = ""
    status: str = Field(default="completed")  # completed | cancelled

    # Customer info
    customer_name: str = ""
    customer_phone: str = Field(default="", index=True)
    customer_secondary_phone: str = ""

    # Next of kin info
    next_of_kin_name: str = ""
    next_of_kin_relationship: str = ""
    next_of_kin_phone: str = ""
    next_of_kin_secondary_phone: str = ""

    # Receipt attachment (file path on server)
    receipt_path: str = ""

    # Seller (user who made the sale)
    seller_id: int | None = Field(default=None, index=True)
    seller_name: str = ""

    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(
        default_factory=datetime.now,
        sa_column_kwargs={"onupdate": datetime.now},
    )
