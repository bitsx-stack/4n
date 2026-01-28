from sqlalchemy import text
from sqlmodel import SQLModel, Session, create_engine

DATABASE_URL = "postgresql+psycopg2://postgres:secure_password@db:5432/miliki_db"

engine = create_engine(DATABASE_URL, echo=True, pool_pre_ping=True)


def apply_legacy_migrations():
    """Best-effort schema updates for dev environments.

    SQLModel's create_all will not ALTER existing tables. This keeps older DBs
    running when we add new columns.
    """

    statements = [
        "ALTER TABLE IF EXISTS imei ADD COLUMN IF NOT EXISTS vendor_id INTEGER",
        "ALTER TABLE IF EXISTS imei ADD COLUMN IF NOT EXISTS storage_size VARCHAR",
    ]

    with engine.begin() as conn:
        for stmt in statements:
            conn.execute(text(stmt))

def SessionLocal():
    return Session(bind=engine)

def init_db():
    SQLModel.metadata.create_all(engine)
    apply_legacy_migrations()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
