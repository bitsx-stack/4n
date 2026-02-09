from sqlmodel import Session, select
from models.menu import Menu, SubMenu, UserPermission


class MenuCRUD:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> Menu:
        menu = Menu(**kwargs)
        self.db.add(menu)
        self.db.commit()
        self.db.refresh(menu)
        return menu

    def get_all(self) -> list[Menu]:
        return self.db.exec(select(Menu).order_by(Menu.sort_order)).all()

    def get_by_id(self, menu_id: int) -> Menu | None:
        return self.db.get(Menu, menu_id)

    def update(self, menu_id: int, **kwargs) -> Menu | None:
        menu = self.get_by_id(menu_id)
        if not menu:
            return None
        for key, value in kwargs.items():
            if value is not None:
                setattr(menu, key, value)
        self.db.commit()
        self.db.refresh(menu)
        return menu

    def delete(self, menu_id: int) -> bool:
        menu = self.get_by_id(menu_id)
        if not menu:
            return False
        self.db.delete(menu)
        self.db.commit()
        return True


class SubMenuCRUD:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **kwargs) -> SubMenu:
        submenu = SubMenu(**kwargs)
        self.db.add(submenu)
        self.db.commit()
        self.db.refresh(submenu)
        return submenu

    def get_all(self, menu_id: int | None = None) -> list[SubMenu]:
        stmt = select(SubMenu)
        if menu_id:
            stmt = stmt.where(SubMenu.menu_id == menu_id)
        return self.db.exec(stmt.order_by(SubMenu.sort_order)).all()

    def get_by_id(self, submenu_id: int) -> SubMenu | None:
        return self.db.get(SubMenu, submenu_id)

    def update(self, submenu_id: int, **kwargs) -> SubMenu | None:
        submenu = self.get_by_id(submenu_id)
        if not submenu:
            return None
        for key, value in kwargs.items():
            if value is not None:
                setattr(submenu, key, value)
        self.db.commit()
        self.db.refresh(submenu)
        return submenu

    def delete(self, submenu_id: int) -> bool:
        submenu = self.get_by_id(submenu_id)
        if not submenu:
            return False
        self.db.delete(submenu)
        self.db.commit()
        return True


class UserPermissionCRUD:
    def __init__(self, db: Session):
        self.db = db

    def assign(self, user_id: int, menu_id: int, submenu_id: int | None, permission: str) -> UserPermission:
        # Check if already exists
        stmt = select(UserPermission).where(
            UserPermission.user_id == user_id,
            UserPermission.menu_id == menu_id,
            UserPermission.permission == permission,
        )
        if submenu_id:
            stmt = stmt.where(UserPermission.submenu_id == submenu_id)
        else:
            stmt = stmt.where(UserPermission.submenu_id == None)

        existing = self.db.exec(stmt).first()
        if existing:
            return existing

        up = UserPermission(
            user_id=user_id,
            menu_id=menu_id,
            submenu_id=submenu_id,
            permission=permission,
        )
        self.db.add(up)
        self.db.commit()
        self.db.refresh(up)
        return up

    def remove(self, user_id: int, menu_id: int, submenu_id: int | None, permission: str) -> bool:
        stmt = select(UserPermission).where(
            UserPermission.user_id == user_id,
            UserPermission.menu_id == menu_id,
            UserPermission.permission == permission,
        )
        if submenu_id:
            stmt = stmt.where(UserPermission.submenu_id == submenu_id)
        else:
            stmt = stmt.where(UserPermission.submenu_id == None)

        existing = self.db.exec(stmt).first()
        if not existing:
            return False
        self.db.delete(existing)
        self.db.commit()
        return True

    def get_user_permissions(self, user_id: int) -> list[dict]:
        stmt = select(UserPermission, Menu, SubMenu).join(
            Menu, UserPermission.menu_id == Menu.id
        ).outerjoin(
            SubMenu, UserPermission.submenu_id == SubMenu.id
        ).where(
            UserPermission.user_id == user_id
        ).order_by(Menu.sort_order, SubMenu.sort_order)

        results = self.db.exec(stmt).all()
        return [
            {
                "id": up.id,
                "user_id": up.user_id,
                "menu_id": up.menu_id,
                "menu_name": menu.name,
                "submenu_id": up.submenu_id,
                "submenu_name": sub.name if sub else None,
                "permission": up.permission,
            }
            for up, menu, sub in results
        ]

    def check(self, user_id: int, permission_string: str) -> bool:
        """
        Check permission using format: "menu_name-submenu_name-permission"
        e.g. "inventory-stock-read" or "dashboard--open"
        """
        parts = permission_string.split("-")
        if len(parts) < 3:
            return False

        menu_name = parts[0].strip().lower()
        submenu_name = parts[1].strip().lower()
        permission = parts[2].strip().lower()

        # Find menu
        menu = self.db.exec(
            select(Menu).where(Menu.name == menu_name)
        ).first()
        if not menu:
            return False

        if submenu_name:
            # Find submenu
            submenu = self.db.exec(
                select(SubMenu).where(
                    SubMenu.menu_id == menu.id,
                    SubMenu.name == submenu_name,
                )
            ).first()
            if not submenu:
                return False

            stmt = select(UserPermission).where(
                UserPermission.user_id == user_id,
                UserPermission.menu_id == menu.id,
                UserPermission.submenu_id == submenu.id,
                UserPermission.permission == permission,
            )
        else:
            stmt = select(UserPermission).where(
                UserPermission.user_id == user_id,
                UserPermission.menu_id == menu.id,
                UserPermission.submenu_id == None,
                UserPermission.permission == permission,
            )

        return self.db.exec(stmt).first() is not None

    def get_user_menu(self, user_id: int) -> list[dict]:
        """Get menu tree filtered by user permissions."""
        menus = self.db.exec(select(Menu).order_by(Menu.sort_order)).all()

        # Get all user permission menu_ids and submenu_ids
        user_perms = self.db.exec(
            select(UserPermission).where(UserPermission.user_id == user_id)
        ).all()

        perm_menu_ids = set()
        perm_submenu_ids = set()
        for p in user_perms:
            perm_menu_ids.add(p.menu_id)
            if p.submenu_id:
                perm_submenu_ids.add(p.submenu_id)

        result = []
        for menu in menus:
            if menu.id not in perm_menu_ids:
                continue

            children = []
            for sub in menu.submenus:
                if sub.id in perm_submenu_ids:
                    children.append({
                        "id": sub.id,
                        "name": sub.name,
                        "label": sub.label,
                        "icon": sub.icon,
                        "path": sub.path,
                        "access": sub.access,
                        "sort_order": sub.sort_order,
                    })

            result.append({
                "id": menu.id,
                "name": menu.name,
                "label": menu.label,
                "icon": menu.icon,
                "path": menu.path,
                "sort_order": menu.sort_order,
                "children": children,
            })

        return result