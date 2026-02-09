"""
Run once to seed all existing menus and submenus into the database.
Usage: cd backend/app && python seed_menus.py
"""
from core.database import engine
from sqlmodel import Session
from models.menu import Menu, SubMenu

MENUS = [
    {
        "name": "dashboard",
        "label": "Dashboard",
        "icon": "📊",
        "path": "/dashboard",
        "sort_order": 0,
        "submenus": [],
    },
    {
        "name": "billing",
        "label": "Billing",
        "icon": "🧾",
        "path": "/billing",
        "sort_order": 1,
        "submenus": [
            {"name": "sales", "label": "Sales", "icon": "💰", "path": "/billing/sales", "sort_order": 0, "access": "read,open,create,edit,update,delete"},
        ],
    },
    {
        "name": "users",
        "label": "Users",
        "icon": "👥",
        "path": "/users",
        "sort_order": 2,
        "submenus": [
            {"name": "permissions", "label": "Permissions", "icon": "🔐", "path": "/users/permissions", "sort_order": 0, "access": "read,open,create,edit,update,delete"},
            {"name": "customers", "label": "Customers", "icon": "🧑‍🤝‍🧑", "path": "/users/customers", "sort_order": 1, "access": "read,open,create,edit,update,delete"},
        ],
    },
    {
        "name": "inventory",
        "label": "Inventory",
        "icon": "📦",
        "path": "/inventory",
        "sort_order": 3,
        "submenus": [
            {"name": "stock", "label": "Stock", "icon": "📱", "path": "/inventory/stock", "sort_order": 0, "access": "read,open,create,edit,update,delete"},
            {"name": "stock-taking", "label": "Stock Taking", "icon": "📋", "path": "/inventory/stock-taking", "sort_order": 1, "access": "read,open,create,edit,update,delete"},
            {"name": "transfers", "label": "Transfers", "icon": "🔄", "path": "/inventory/transfers", "sort_order": 2, "access": "read,open,create,edit,update,delete"},
        ],
    },
    {
        "name": "purchases",
        "label": "Purchases",
        "icon": "🛒",
        "path": "/purchases",
        "sort_order": 4,
        "submenus": [
            {"name": "list", "label": "Purchase List", "icon": "📃", "path": "/purchases/list", "sort_order": 0, "access": "read,open,create,edit,update,delete"},
        ],
    },
    {
        "name": "settings",
        "label": "Settings",
        "icon": "⚙️",
        "path": "/settings",
        "sort_order": 5,
        "submenus": [
            {"name": "types", "label": "Types", "icon": "🏷️", "path": "/settings/types", "sort_order": 0, "access": "read,open,create,edit,update,delete"},
            {"name": "categories", "label": "Categories", "icon": "📂", "path": "/settings/categories", "sort_order": 1, "access": "read,open,create,edit,update,delete"},
            {"name": "companies", "label": "Companies", "icon": "🏢", "path": "/settings/companies", "sort_order": 2, "access": "read,open,create,edit,update,delete"},
            {"name": "stores", "label": "Stores", "icon": "🏪", "path": "/settings/stores", "sort_order": 3, "access": "read,open,create,edit,update,delete"},
            {"name": "vendors", "label": "Vendors", "icon": "🤝", "path": "/settings/vendors", "sort_order": 4, "access": "read,open,create,edit,update,delete"},
            {"name": "sms", "label": "SMS Settings", "icon": "📱", "path": "/settings/sms", "sort_order": 5, "access": "read,open,create,edit,update,delete"},
            {"name": "menus", "label": "Menus", "icon": "📋", "path": "/settings/menus", "sort_order": 6, "access": "read,open,create,edit,update,delete"},
        ],
    },
]


def seed():
    with Session(engine) as db:
        # Check if already seeded
        existing = db.query(Menu).first()
        if existing:
            print("Menus already seeded. Skipping.")
            return

        for menu_data in MENUS:
            submenus_data = menu_data.pop("submenus")
            menu = Menu(**menu_data)
            db.add(menu)
            db.commit()
            db.refresh(menu)

            for sub_data in submenus_data:
                sub = SubMenu(menu_id=menu.id, **sub_data)
                db.add(sub)

            db.commit()
            print(f"  ✅ {menu.label} ({len(submenus_data)} submenus)")

    print("\n🎉 All menus seeded successfully!")


if __name__ == "__main__":
    seed()