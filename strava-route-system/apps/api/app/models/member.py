from datetime import datetime

from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, BigIntPK, TimestampMixin


class Member(TimestampMixin, Base):
    """會員：Firebase 只負責登入身分，會員資料本身存在自有 MySQL。"""

    __tablename__ = "members"

    id: Mapped[int] = mapped_column(BigIntPK, primary_key=True, autoincrement=True)
    firebase_uid: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(320), index=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String(255))
    photo_url: Mapped[str | None] = mapped_column(String(1024))
    sign_in_provider: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[str] = mapped_column(String(16), default="active", nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime)
