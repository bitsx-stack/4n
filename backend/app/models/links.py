from sqlmodel import SQLModel, Field
import uuid

class ClientUserLink(SQLModel, table=True):
    client_id: int | None = Field(default=None, foreign_key="client.id", primary_key=True)
    user_id: int | None = Field(default=None, foreign_key="user.id", primary_key=True)

class PermissionUserLink(SQLModel, table=True):
    user_id: int | None = Field(default=None, foreign_key="user.id", primary_key=True)
    permission_id: int | None = Field(default=None, foreign_key="permission.id", primary_key=True)

class StoreImeiLink(SQLModel, table=True):
    store_id: int | None = Field(default=None, foreign_key="store.id", primary_key=True)
    imei_id: str | None = Field(default=None, foreign_key="imei.code", primary_key=True)

class TransactionImeiLink(SQLModel, table=True):
    transaction_id: uuid.UUID | None = Field(default=None, foreign_key="transaction.code", primary_key=True)
    imei_id: str | None = Field(default=None, foreign_key="imei.code", primary_key=True)


class PurchaseImeiLink(SQLModel, table=True):
    purchase_id: int | None = Field(
        default=None, foreign_key="purchase.id", primary_key=True
    )
    imei_id: str | None = Field(default=None, foreign_key="imei.code", primary_key=True)
