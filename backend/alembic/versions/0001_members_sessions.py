"""members、sessions（DDL 照期初設計文件）

Revision ID: 0001
Revises:
Create Date: 2026-10-07
"""

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

TABLE_OPTS = "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci"


def upgrade() -> None:
    op.execute(f"""
CREATE TABLE members (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  firebase_uid  VARCHAR(128) NOT NULL,
  email         VARCHAR(255) NULL,
  display_name  VARCHAR(100) NULL,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_login_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_members_firebase_uid (firebase_uid)
) {TABLE_OPTS}
""")
    op.execute(f"""
CREATE TABLE sessions (
  token_hash  CHAR(64) PRIMARY KEY,
  member_id   BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at  DATETIME(3) NOT NULL,
  revoked_at  DATETIME(3) NULL,
  user_agent  VARCHAR(255) NULL,
  KEY idx_sessions_member (member_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) {TABLE_OPTS}
""")


def downgrade() -> None:
    op.execute("DROP TABLE sessions")
    op.execute("DROP TABLE members")
