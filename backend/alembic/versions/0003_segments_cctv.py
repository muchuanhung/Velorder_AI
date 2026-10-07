"""segments、cctv（只建表；判定與同步 API 在期中實作）

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-07
"""

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 空間欄位一律 NOT NULL + SRID 4326（SPATIAL INDEX 的要求）。
    # SRID 4326 在 MySQL 的座標順序是 (緯度, 經度)，寫入 POINT 時別寫反。
    op.execute("""
CREATE TABLE segments (
  id        BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  route_id  BIGINT UNSIGNED NOT NULL,
  seq       INT UNSIGNED NOT NULL,
  start_km  DECIMAL(7,3) NOT NULL,
  end_km    DECIMAL(7,3) NOT NULL,
  geom      LINESTRING NOT NULL SRID 4326,
  UNIQUE KEY uq_segments_route_seq (route_id, seq),
  SPATIAL KEY sp_segments_geom (geom),
  CONSTRAINT fk_segments_route FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
""")
    op.execute("""
CREATE TABLE cctv (
  id             BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  tdx_id         VARCHAR(64) NOT NULL,
  label          VARCHAR(255) NOT NULL,
  road_name      VARCHAR(100) NULL,
  county         VARCHAR(50) NULL,
  township       VARCHAR(50) NULL,
  authority_name VARCHAR(100) NULL,
  video_url      VARCHAR(1024) NOT NULL DEFAULT '',
  location       POINT NOT NULL SRID 4326,
  synced_at      DATETIME(3) NOT NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_cctv_tdx_id (tdx_id),
  SPATIAL KEY sp_cctv_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
""")


def downgrade() -> None:
    op.execute("DROP TABLE cctv")
    op.execute("DROP TABLE segments")
