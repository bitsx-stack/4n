from sqlmodel import Session, func, select
from models.category import CategoryType



class CategoryTypeCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: str):
        return self.db.exec(select(CategoryType).where(CategoryType.id == id)).first()

    def create(self,  name: str):
        category_type = CategoryType(name=name)
        self.db.add(category_type)
        self.db.commit()
        self.db.refresh(category_type)
        return category_type
    
    def update(self, id: int, name: str):
        category_type = self.get_by_id(id)
        if not category_type:
            raise Exception("Category Type not found")

        category_type.name = name
        self.db.add(category_type)
        self.db.commit()
        self.db.refresh(category_type)
        return category_type
    
    def delete(self, id: int):
        category_type = self.get_by_id(id)
        if not category_type:
            raise Exception("Category Type not found")
        self.db.delete(category_type)
        self.db.commit()
        return True
    
    def paginated(self, page: int = 1, pageSize: int = 10, search: str = None):
        query = select(CategoryType)

        # SEARCH FILTER
        if search:
            query = query.where(CategoryType.name.ilike(f"%{search}%"))

        # GET TOTAL COUNT
        count_query = select(func.count()).select_from(query.subquery())
        total = self.db.exec(count_query).one()

        # PAGINATION
        offset = (page - 1) * pageSize
        query = query.offset(offset).limit(pageSize)

        data = self.db.exec(query).all()

        return {
            "data": data,
            "total": total,
            "page": page,
            "pageSize": pageSize
        }