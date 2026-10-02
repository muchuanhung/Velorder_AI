"""建立 members 與 routes（GPX metadata）

Revision ID: 0001
Revises:
Create Date: 2026-10-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

BigIntPK = sa.BigInteger().with_variant(sa.Integer, "sqlite")


def upgrade() -> None:
    op.create_table(
        "members",
        sa.Column("id", BigIntPK, primary_key=True, autoincrement=True),
        sa.Column("firebase_uid", sa.String(128), nullable=False),
        sa.Column("email", sa.String(320)),
        sa.Column("email_verified", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("display_name", sa.String(255)),
        sa.Column("photo_url", sa.String(1024)),
        sa.Column("sign_in_provider", sa.String(64)),
        sa.Column("status", sa.String(16), nullable=False, server_default="active"),
        sa.Column("last_login_at", sa.DateTime),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_members"),
        sa.UniqueConstraint("firebase_uid", name="uq_members_firebase_uid"),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
    )
    op.create_index("ix_members_email", "members", ["email"])

    op.create_table(
        "routes",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("member_id", BigIntPK, nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("storage_key", sa.String(512), nullable=False),
        sa.Column("content_type", sa.String(64), nullable=False),
        sa.Column("size_bytes", sa.Integer, nullable=False),
        sa.Column("checksum_sha256", sa.String(64), nullable=False),
        sa.Column(
            "analysis_status",
            sa.Enum(
                "pending",
                "parsed",
                "failed",
                name="route_analysis_status",
                native_enum=False,
                length=16,
                create_constraint=True,
            ),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("point_count", sa.Integer),
        sa.Column("distance_m", sa.Float),
        sa.Column("elevation_gain_m", sa.Float),
        sa.Column("start_lat", sa.Double),
        sa.Column("start_lng", sa.Double),
        sa.Column("analysis", sa.JSON),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_routes"),
        sa.UniqueConstraint("storage_key", name="uq_routes_storage_key"),
        sa.ForeignKeyConstraint(
            ["member_id"],
            ["members.id"],
            name="fk_routes_member_id_members",
            ondelete="CASCADE",
        ),
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_0900_ai_ci",
    )
    op.create_index("ix_routes_member_id_created_at", "routes", ["member_id", "created_at"])

    if op.get_context().dialect.name == "mysql":
        # 空間欄位草稿：由 start_lat/start_lng 推導的 POINT（SRID 4326）。
        # POINT(x, y) 的 x 必須是經度：MySQL 內部以 (lng, lat) 儲存，ST_Latitude() 才會正確。
        # SPATIAL INDEX 要求 NOT NULL，起點可能缺值，等分析流程確定後再加索引。
        op.execute(
            "ALTER TABLE routes ADD COLUMN start_point POINT "
            "GENERATED ALWAYS AS ("
            "IF(start_lat IS NULL OR start_lng IS NULL, NULL, "
            "ST_SRID(POINT(start_lng, start_lat), 4326))"
            ") STORED SRID 4326"
        )


def downgrade() -> None:
    # 直接 drop table：MySQL 不允許先刪掉 FK 正在使用的索引
    op.drop_table("routes")
    op.drop_table("members")
