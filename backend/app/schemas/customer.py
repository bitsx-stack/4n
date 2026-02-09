from pydantic import BaseModel
from datetime import datetime


class ReadCustomer(BaseModel):
    """Aggregated customer derived from completed sales."""
    customer_name: str
    customer_phone: str
    customer_secondary_phone: str = ""
    next_of_kin_name: str = ""
    next_of_kin_relationship: str = ""
    next_of_kin_phone: str = ""
    total_purchases: int = 0
    total_amount: float = 0.0
    last_purchase: datetime | None = None


class SendSmsRequest(BaseModel):
    """Send an SMS to one or more phone numbers."""
    phones: list[str]
    message: str


class SmsResult(BaseModel):
    phone: str
    success: bool
    detail: str = ""


class SendSmsResponse(BaseModel):
    total: int
    sent: int
    failed: int
    results: list[SmsResult]
