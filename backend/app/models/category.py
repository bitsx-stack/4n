from sqlmodel import SQLModel, Field, Relationship

class CategoryType(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)

    categories: list["Category"] = Relationship(back_populates="category_type")

class Category(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)

    categorytype_id: int | None = Field(default=None, foreign_key="categorytype.id")
    category_type: CategoryType = Relationship(back_populates="categories")
