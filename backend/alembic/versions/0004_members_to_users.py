"""members 改名 users（表、欄位、索引、外鍵一起改，資料不動）

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-07
"""

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 先拆外鍵，再改欄位與索引，最後用新名字重建；MySQL 不支援直接改外鍵名稱
    op.execute("ALTER TABLE sessions DROP FOREIGN KEY fk_sessions_member")
    op.execute("ALTER TABLE routes DROP FOREIGN KEY fk_routes_member")
    op.execute("RENAME TABLE members TO users")
    op.execute("ALTER TABLE users RENAME INDEX uq_members_firebase_uid TO uq_users_firebase_uid")
    op.execute("""
ALTER TABLE sessions
  RENAME COLUMN member_id TO user_id,
  RENAME INDEX idx_sessions_member TO idx_sessions_user
""")
    op.execute("""
ALTER TABLE routes
  RENAME COLUMN member_id TO user_id,
  RENAME INDEX idx_routes_member_list TO idx_routes_user_list
""")
    op.execute("""
ALTER TABLE sessions
  ADD CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
""")
    op.execute("""
ALTER TABLE routes
  ADD CONSTRAINT fk_routes_user FOREIGN KEY (user_id) REFERENCES users(id)
""")


def downgrade() -> None:
    op.execute("ALTER TABLE sessions DROP FOREIGN KEY fk_sessions_user")
    op.execute("ALTER TABLE routes DROP FOREIGN KEY fk_routes_user")
    op.execute("""
ALTER TABLE routes
  RENAME COLUMN user_id TO member_id,
  RENAME INDEX idx_routes_user_list TO idx_routes_member_list
""")
    op.execute("""
ALTER TABLE sessions
  RENAME COLUMN user_id TO member_id,
  RENAME INDEX idx_sessions_user TO idx_sessions_member
""")
    op.execute("ALTER TABLE users RENAME INDEX uq_users_firebase_uid TO uq_members_firebase_uid")
    op.execute("RENAME TABLE users TO members")
    op.execute("""
ALTER TABLE sessions
  ADD CONSTRAINT fk_sessions_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
""")
    op.execute("""
ALTER TABLE routes
  ADD CONSTRAINT fk_routes_member FOREIGN KEY (member_id) REFERENCES members(id)
""")
