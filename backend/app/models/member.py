from datetime import datetime

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, utcnow
from app.core.types import DateTime3, UBigInt


class Member(Base):
    __tablename__ = "members"
    __table_args__ = (UniqueConstraint("firebase_uid", name="uq_members_firebase_uid"),)

    id: Mapped[int] = mapped_column(UBigInt, primary_key=True, autoincrement=True)
    firebase_uid: Mapped[str] = mapped_column(String(128))
    email: Mapped[str | None] = mapped_column(String(255))
    display_name: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime3, default=utcnow)
    last_login_at: Mapped[datetime] = mapped_column(DateTime3, default=utcnow)
