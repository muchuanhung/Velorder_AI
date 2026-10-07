"""routes（只建表；GPX API 在期中實作，route_segments 也留到期中）

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-07
"""

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # SPATIAL INDEX 要求欄位 NOT NULL 且指定 SRID
    op.execute("""
CREATE TABLE routes (
  id               BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  public_id        CHAR(26) NOT NULL,
  member_id        BIGINT UNSIGNED NOT NULL,
  name             VARCHAR(100) NOT NULL,
  s3_key           VARCHAR(255) NOT NULL,
  file_size        INT UNSIGNED NOT NULL,
  file_sha256      CHAR(64) NOT NULL,
  status           ENUM('processing','ready','failed') NOT NULL DEFAULT 'processing',
  distance_km      DECIMAL(7,2) NULL,
  elevation_gain_m INT NULL,
  bbox             POLYGON NOT NULL SRID 4326,
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at       DATETIME(3) NULL,
  UNIQUE KEY uq_routes_public_id (public_id),
  KEY idx_routes_member_list (member_id, deleted_at, created_at),
  SPATIAL KEY sp_routes_bbox (bbox),
  CONSTRAINT fk_routes_member FOREIGN KEY (member_id) REFERENCES members(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
""")


def downgrade() -> None:
    op.execute("DROP TABLE routes")
