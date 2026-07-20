from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlmodel import Session

from .config import get_settings


def _ensure_sqlite_dir(database_url: str) -> None:
    if database_url.startswith("sqlite:///"):
        # sqlite:///./data/app.db -> ./data
        path_str = database_url.removeprefix("sqlite:///")
        db_path = Path(path_str)
        if db_path.parent:
            db_path.parent.mkdir(parents=True, exist_ok=True)


def get_engine() -> Engine:
    settings = get_settings()
    connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
    _ensure_sqlite_dir(settings.database_url)
    return create_engine(settings.database_url, connect_args=connect_args)


engine = get_engine()


def get_session() -> Session:
    with Session(engine) as session:
        yield session


def ensure_columns():
    """Ensure new columns exist when using SQLite without migrations."""
    settings = get_settings()
    if settings.database_url.startswith("sqlite"):
        with engine.connect() as conn:
            res = conn.exec_driver_sql("PRAGMA table_info(post);")
            cols = {row[1] for row in res.fetchall()}
            if "status" not in cols:
                conn.exec_driver_sql("ALTER TABLE post ADD COLUMN status VARCHAR DEFAULT 'published';")
            if "weekday" not in cols:
                conn.exec_driver_sql("ALTER TABLE post ADD COLUMN weekday VARCHAR;")
            if "day_theme" not in cols:
                conn.exec_driver_sql("ALTER TABLE post ADD COLUMN day_theme VARCHAR;")
            if "views" not in cols:
                conn.exec_driver_sql("ALTER TABLE post ADD COLUMN views INTEGER DEFAULT 0;")
            if "related_ids" not in cols:
                conn.exec_driver_sql("ALTER TABLE post ADD COLUMN related_ids JSON DEFAULT '[]';")
            if "related_product_ids" not in cols:
                conn.exec_driver_sql("ALTER TABLE post ADD COLUMN related_product_ids JSON DEFAULT '[]';")

