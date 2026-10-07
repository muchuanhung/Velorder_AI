"""路線切段（逐公里）。期初只建表，切段與判定在期中實作。"""

from decimal import Decimal

from sqlalchemy import DECIMAL, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.core.types import Geometry, UBigInt, UInt


class Segment(Base):
    __tablename__ = "segments"
    __table_args__ = (
        UniqueConstraint("route_id", "seq", name="uq_segments_route_seq"),
        Index("sp_segments_geom", "geom", mysql_prefix="SPATIAL"),
    )

    id: Mapped[int] = mapped_column(UBigInt, primary_key=True, autoincrement=True)
    route_id: Mapped[int] = mapped_column(
        UBigInt, ForeignKey("routes.id", name="fk_segments_route", ondelete="CASCADE")
    )
    seq: Mapped[int] = mapped_column(UInt)
    start_km: Mapped[Decimal] = mapped_column(DECIMAL(7, 3))
    end_km: Mapped[Decimal] = mapped_column(DECIMAL(7, 3))
    geom: Mapped[bytes] = mapped_column(Geometry("LINESTRING"))
