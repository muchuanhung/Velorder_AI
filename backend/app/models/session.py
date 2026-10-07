from datetime import datetime

from sqlalchemy import CHAR, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base, utcnow
from app.core.types import DateTime3, UBigInt
from app.models.user import User


class AuthSession(Base):
    """一次登入。PK 為 cookie 原值的 SHA-256，資料庫不存原值。"""

    __tablename__ = "sessions"
    __table_args__ = (
        Index("idx_sessions_user", "user_id"),
        Index("idx_sessions_expires", "expires_at"),
    )

    token_hash: Mapped[str] = mapped_column(CHAR(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(
        UBigInt, ForeignKey("users.id", name="fk_sessions_user", ondelete="CASCADE")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime3, default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime3)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime3)
    user_agent: Mapped[str | None] = mapped_column(String(255))

    user: Mapped[User] = relationship(lazy="joined")
