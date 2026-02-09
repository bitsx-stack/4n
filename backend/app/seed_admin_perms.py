"""
Grant all permissions to user with phone 0712186930.
Usage: docker compose exec backend python seed_admin_perms.py
"""
from sqlmodel import Session, select
from core.database import engine

# Import ALL models so SQLAlchemy resolves all relationships
import models  # noqa: F401

from models.user import User
from models.menu import Menu, SubMenu, UserPermission


def seed():
    with Session(engine) as db:
        # Find user
        user = db.exec(select(User).where(User.phone == "0712186930")).first()
        if not user:
            print("❌ User with phone 0712186930 not found!")
            return

        print(f"Found user: {user.fullname} (id={user.id})")

        # Get all menus and submenus
        menus = db.exec(select(Menu)).all()
        count = 0

        for menu in menus:
            submenus = db.exec(
                select(SubMenu).where(SubMenu.menu_id == menu.id)
            ).all()

            for sub in submenus:
                permissions = [p.strip() for p in sub.access.split(",")]

                for perm in permissions:
                    # Check if already exists
                    existing = db.exec(
                        select(UserPermission).where(
                            UserPermission.user_id == user.id,
                            UserPermission.menu_id == menu.id,
                            UserPermission.submenu_id == sub.id,
                            UserPermission.permission == perm,
                        )
                    ).first()

                    if not existing:
                        up = UserPermission(
                            user_id=user.id,
                            menu_id=menu.id,
                            submenu_id=sub.id,
                            permission=perm,
                        )
                        db.add(up)
                        count += 1

            db.commit()
            print(f"  ✅ {menu.label} — {len(submenus)} submenus processed")

        print(f"\n🎉 Done! Assigned {count} new permissions to {user.fullname}")


if __name__ == "__main__":
    seed()