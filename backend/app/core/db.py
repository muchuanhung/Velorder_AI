from collections.abc import Iterator
from datetime import UTC, datetime
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


def utcnow() -> datetime:
    """資料庫一律存 naive UTC（DATETIME 不帶時區）。"""
    return datetime.now(UTC).replace(tzinfo=None)


def build_engine(url: str) -> Engine:
    connect_args = {}
    if url.startswith("mysql"):
        # 讓 CURRENT_TIMESTAMP 與應用端 utcnow() 一致
        connect_args["init_command"] = "SET time_zone = '+00:00'"
    return create_engine(url, pool_pre_ping=True, pool_recycle=3600, connect_args=connect_args)


@lru_cache
def get_engine() -> Engine:
    return build_engine(get_settings().database_url)


@lru_cache
def get_sessionmaker() -> sessionmaker[Session]:
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    db = get_sessionmaker()()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
