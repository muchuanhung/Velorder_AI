import enum
import uuid

from sqlalchemy import JSON, Double, Enum, Float, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, BigIntPK, TimestampMixin


class AnalysisStatus(str, enum.Enum):
    pending = "pending"
    parsed = "parsed"
    failed = "failed"


class Route(TimestampMixin, Base):
    """使用者上傳的 GPX 路線 metadata；檔案本體在物件儲存，DB 只存 key。

    MySQL 另有 migration 建立的 `start_point` POINT(SRID 4326) generated column，
    由 start_lat / start_lng 推導，ORM 不直接讀寫。
    """

    __tablename__ = "routes"
    __table_args__ = (Index("ix_routes_member_id_created_at", "member_id", "created_at"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    member_id: Mapped[int] = mapped_column(
        BigIntPK,
        ForeignKey("members.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), unique=True, nullable=False)
    content_type: Mapped[str] = mapped_column(String(64), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    checksum_sha256: Mapped[str] = mapped_column(String(64), nullable=False)

    # 以下為分析結果欄位，parse/segment 尚為 stub，先放 placeholder
    analysis_status: Mapped[AnalysisStatus] = mapped_column(
        Enum(
            AnalysisStatus,
            name="route_analysis_status",
            native_enum=False,
            length=16,
            create_constraint=True,
            values_callable=lambda e: [m.value for m in e],
        ),
        default=AnalysisStatus.pending,
        nullable=False,
    )
    point_count: Mapped[int | None] = mapped_column(Integer)
    distance_m: Mapped[float | None] = mapped_column(Float)
    elevation_gain_m: Mapped[float | None] = mapped_column(Float)
    start_lat: Mapped[float | None] = mapped_column(Double)
    start_lng: Mapped[float | None] = mapped_column(Double)
    analysis: Mapped[dict | None] = mapped_column(JSON)
