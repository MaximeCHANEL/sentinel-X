import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://admin:wSevGynJi29@db:3306/dashboard_demo")
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def migrate_schema():
    """Apply non-destructive changes needed by databases created by older releases."""
    columns = {column["name"] for column in inspect(engine).get_columns("users")}

    with engine.begin() as connection:
        if "hashed_password" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN hashed_password VARCHAR(255) NOT NULL DEFAULT '' "
                    "AFTER username"
                )
            )
        if "role" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN role VARCHAR(30) NOT NULL DEFAULT 'user' "
                    "AFTER hashed_password"
                )
            )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
