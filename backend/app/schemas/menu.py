from pydantic import BaseModel
from datetime import datetime


# ─── Menu ──────────────────────────────────────────────────────
class CreateMenu(BaseModel):
    name: str
    label: str
    icon: str | None = None
    path: str
    sort_order: int = 0


class UpdateMenu(BaseModel):
    name: str | None = None
    label: str | None = None
    icon: str | None = None
    path: str | None = None
    sort_order: int | None = None


class ReadSubMenu(BaseModel):
    id: int
    menu_id: int
    name: str
    label: str
    icon: str | None
    path: str
    access: str
    sort_order: int
    created_at: datetime
    updated_at: datetime


class ReadMenu(BaseModel):
    id: int
    name: str
    label: str
    icon: str | None
    path: str
    sort_order: int
    created_at: datetime
    updated_at: datetime
    submenus: list[ReadSubMenu] = []


# ─── SubMenu ──────────────────────────────────────────────────
class CreateSubMenu(BaseModel):
    menu_id: int
    name: str
    label: str
    icon: str | None = None
    path: str
    access: str = "read,open,create,edit,update,delete"
    sort_order: int = 0


class UpdateSubMenu(BaseModel):
    name: str | None = None
    label: str | None = None
    icon: str | None = None
    path: str | None = None
    access: str | None = None
    sort_order: int | None = None


# ─── UserPermission ───────────────────────────────────────────
class AssignPermission(BaseModel):
    user_id: int
    menu_id: int
    submenu_id: int | None = None
    permission: str


class RemovePermission(BaseModel):
    user_id: int
    menu_id: int
    submenu_id: int | None = None
    permission: str


class ReadUserPermission(BaseModel):
    id: int
    user_id: int
    menu_id: int
    menu_name: str | None = None
    submenu_id: int | None = None
    submenu_name: str | None = None
    permission: str


class CheckPermission(BaseModel):
    has_permission: bool