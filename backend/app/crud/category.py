from sqlmodel import Session, select, func

from models.category import Category




class CategoryCRUD:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, id: str):
        return self.db.exec(select(Category).where(Category.id == id)).first()

    def create(self,  name: str, categorytype_id: int):
        category = Category(name=name, categorytype_id=categorytype_id)
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def all(self):
        return self.db.exec(select(Category)).all()
    
    def update(self, id: int, name: str, categorytype_id: int):
        category = self.get_by_id(id)
        if not category:
            raise Exception("Category not found")

        category.name = name
        category.categorytype_id = categorytype_id
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category
    
    def delete(self, id: int):
        category = self.get_by_id(id)
        if not category:
            raise Exception("Category not found")
        self.db.delete(category)
        self.db.commit()
        return True
    
    
    def paginated(self, page: int = 1, pageSize: int = 10, search: str = None):
        query = select(Category)

        # SEARCH FILTER
        if search:
            query = query.where(Category.name.ilike(f"%{search}%"))

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
        
    def paginated_by_type_id(self, category_type_id: int, page: int = 1, pageSize: int = 10, search: str = None):
        query = select(Category).where(Category.categorytype_id == category_type_id)

        # SEARCH FILTER
        if search:
            query = query.where(Category.name.ilike(f"%{search}%"))

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
        
    def paginated_by_type_name(self, category_type_name: str, page: int = 1, pageSize: int = 10, search: str = None):
        query = select(Category).join(Category.category_type).where(Category.category_type.has(name=category_type_name))

        # SEARCH FILTER
        if search:
            query = query.where(Category.name.ilike(f"%{search}%"))

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