from sqlmodel import Session, func, select
from models.permission import Permission



class PermissionCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: int):
        return self.db.exec(select(Permission).where(Permission.id == id)).first()

    def create(self, name: str, module: str):
        permission = Permission(name=name, module=module)
        self.db.add(permission)
        self.db.commit()
        self.db.refresh(permission)
        return permission

    def list_permissions(
        self,
        page: int = 1,
        page_size: int = 10,
        search: str = None,
        sort_by: str = "id",
        sort_order: str = "asc",
        name: str = None,
        module: str = None,
    ):
        stmt = select(Permission)
        # Filtering
        if name:
            stmt = stmt.where(Permission.name.ilike(f"%{name}%"))
        if module:
            stmt = stmt.where(Permission.module.ilike(f"%{module}%"))
        if search:
            stmt = stmt.where(
                (Permission.name.ilike(f"%{search}%")) |
                (Permission.module.ilike(f"%{search}%"))
            )
        # Sorting (only for data query)
        data_stmt = stmt
        if hasattr(Permission, sort_by):
            col = getattr(Permission, sort_by)
            if sort_order == "desc":
                data_stmt = data_stmt.order_by(col.desc())
            else:
                data_stmt = data_stmt.order_by(col.asc())

        # Count query (no order_by)
        count_stmt = stmt.with_only_columns(func.count()).order_by(None)
        total = self.db.exec(count_stmt).one()

        # Pagination
        data_stmt = data_stmt.offset((page - 1) * page_size).limit(page_size)
        data = self.db.exec(data_stmt).all()
        return {
            "data": data,
            "total": total,
            "page": page,
            "pageSize": page_size,
        }