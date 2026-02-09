from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    pass


class Menu(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    label: str
    icon: str | None = Field(default=None)
    path: str
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})

    submenus: list["SubMenu"] = Relationship(back_populates="menu", cascade_delete=True)


class SubMenu(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    menu_id: int = Field(foreign_key="menu.id")
    name: str = Field(index=True)
    label: str
    icon: str | None = Field(default=None)
    path: str
    access: str = Field(default="read,open,create,edit,update,delete")
    sort_order: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, sa_column_kwargs={"onupdate": datetime.now})

    menu: "Menu" = Relationship(back_populates="submenus")


class UserPermission(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    menu_id: int = Field(foreign_key="menu.id")
    submenu_id: int | None = Field(default=None, foreign_key="submenu.id")
    permission: str  # e.g. "read", "create", "edit", etc.
    created_at: datetime = Field(default_factory=datetime.now)