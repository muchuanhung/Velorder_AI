"""沿線 CCTV（TDX 同步來源）。期初只建表，同步 API 在期中實作。"""

from datetime import datetime

from sqlalchemy import Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, utcnow
from app.core.types import DateTime3, Geometry, UBigInt


class Cctv(Base):
    __tablename__ = "cctv"
    __table_args__ = (
        UniqueConstraint("tdx_id", name="uq_cctv_tdx_id"),
        Index("sp_cctv_location", "location", mysql_prefix="SPATIAL"),
    )

    id: Mapped[int] = mapped_column(UBigInt, primary_key=True, autoincrement=True)
    tdx_id: Mapped[str] = mapped_column(String(64))
    label: Mapped[str] = mapped_column(String(255))
    road_name: Mapped[str | None] = mapped_column(String(100))
    county: Mapped[str | None] = mapped_column(String(50))
    township: Mapped[str | None] = mapped_column(String(50))
    authority_name: Mapped[str | None] = mapped_column(String(100))
    video_url: Mapped[str] = mapped_column(String(1024), default="")
    location: Mapped[bytes] = mapped_column(Geometry("POINT"))
    synced_at: Mapped[datetime] = mapped_column(DateTime3)
    created_at: Mapped[datetime] = mapped_column(DateTime3, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime3, default=utcnow, onupdate=utcnow)
