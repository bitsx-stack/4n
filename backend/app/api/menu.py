from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from core.database import get_db
from schemas.menu import (
    CreateMenu, ReadMenu, UpdateMenu,
    CreateSubMenu, ReadSubMenu, UpdateSubMenu,
    AssignPermission, RemovePermission, ReadUserPermission, CheckPermission,
)
from crud.menu import MenuCRUD, SubMenuCRUD, UserPermissionCRUD

router = APIRouter(prefix="/api/menus", tags=["menus"])


# ─── Menus ─────────────────────────────────────────────────────

@router.get("/", response_model=list[ReadMenu])
def list_menus(db: Session = Depends(get_db)):
    crud = MenuCRUD(db)
    return crud.get_all()


@router.get("/{menu_id}", response_model=ReadMenu)
def get_menu(menu_id: int, db: Session = Depends(get_db)):
    crud = MenuCRUD(db)
    menu = crud.get_by_id(menu_id)
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu


@router.post("/", response_model=ReadMenu)
def create_menu(data: CreateMenu, db: Session = Depends(get_db)):
    crud = MenuCRUD(db)
    try:
        menu = crud.create(**data.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return menu


@router.put("/{menu_id}", response_model=ReadMenu)
def update_menu(menu_id: int, data: UpdateMenu, db: Session = Depends(get_db)):
    crud = MenuCRUD(db)
    menu = crud.update(menu_id, **data.model_dump(exclude_unset=True))
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu


@router.delete("/{menu_id}")
def delete_menu(menu_id: int, db: Session = Depends(get_db)):
    crud = MenuCRUD(db)
    if not crud.delete(menu_id):
        raise HTTPException(status_code=404, detail="Menu not found")
    return {"detail": "Menu deleted"}


# ─── SubMenus ─────────────────────────────────────────────────

@router.get("/submenus/all", response_model=list[ReadSubMenu])
def list_submenus(menu_id: int | None = None, db: Session = Depends(get_db)):
    crud = SubMenuCRUD(db)
    return crud.get_all(menu_id)


@router.post("/submenus", response_model=ReadSubMenu)
def create_submenu(data: CreateSubMenu, db: Session = Depends(get_db)):
    crud = SubMenuCRUD(db)
    try:
        submenu = crud.create(**data.model_dump())
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    return submenu


@router.put("/submenus/{submenu_id}", response_model=ReadSubMenu)
def update_submenu(submenu_id: int, data: UpdateSubMenu, db: Session = Depends(get_db)):
    crud = SubMenuCRUD(db)
    submenu = crud.update(submenu_id, **data.model_dump(exclude_unset=True))
    if not submenu:
        raise HTTPException(status_code=404, detail="SubMenu not found")
    return submenu


@router.delete("/submenus/{submenu_id}")
def delete_submenu(submenu_id: int, db: Session = Depends(get_db)):
    crud = SubMenuCRUD(db)
    if not crud.delete(submenu_id):
        raise HTTPException(status_code=404, detail="SubMenu not found")
    return {"detail": "SubMenu deleted"}


# ─── User Permissions ─────────────────────────────────────────

@router.get("/permissions/user/{user_id}", response_model=list[ReadUserPermission])
def get_user_permissions(user_id: int, db: Session = Depends(get_db)):
    crud = UserPermissionCRUD(db)
    return crud.get_user_permissions(user_id)


@router.post("/permissions/assign")
def assign_permission(data: AssignPermission, db: Session = Depends(get_db)):
    crud = UserPermissionCRUD(db)
    crud.assign(data.user_id, data.menu_id, data.submenu_id, data.permission)
    return {"detail": "Permission assigned"}


@router.post("/permissions/remove")
def remove_permission(data: RemovePermission, db: Session = Depends(get_db)):
    crud = UserPermissionCRUD(db)
    if not crud.remove(data.user_id, data.menu_id, data.submenu_id, data.permission):
        raise HTTPException(status_code=404, detail="Permission not found")
    return {"detail": "Permission removed"}


@router.get("/permissions/check")
def check_permission(user_id: int, permission_string: str, db: Session = Depends(get_db)):
    """Check: GET /api/menus/permissions/check?user_id=1&permission_string=inventory-stock-read"""
    crud = UserPermissionCRUD(db)
    result = crud.check(user_id, permission_string)
    return {"has_permission": result}


@router.get("/permissions/user/{user_id}/menu")
def get_user_menu(user_id: int, db: Session = Depends(get_db)):
    """Get filtered menu tree for a user based on their permissions."""
    crud = UserPermissionCRUD(db)
    return crud.get_user_menu(user_id)