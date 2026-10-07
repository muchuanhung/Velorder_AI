"""登入、session 查詢與登出。router 只負責 HTTP，邏輯都在這裡。"""

import hashlib
import secrets
from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.db import utcnow
from app.core.firebase import FirebaseIdentity
from app.models import AuthSession, Member


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("ascii")).hexdigest()


def _clip(value: str | None, limit: int) -> str | None:
    return value[:limit] if value else None


def upsert_member(db: Session, identity: FirebaseIdentity) -> Member:
    """以 firebase_uid upsert，並更新 email、名稱與 last_login_at。"""
    now = utcnow()
    member = db.scalar(select(Member).where(Member.firebase_uid == identity.uid))
    if member is None:
        member = Member(firebase_uid=identity.uid, created_at=now)
        try:
            with db.begin_nested():
                db.add(member)
        except IntegrityError:
            # 同一使用者併發首次登入：另一個請求先插入了
            member = db.scalar(select(Member).where(Member.firebase_uid == identity.uid))
            if member is None:
                raise
    member.email = _clip(identity.email, 255)
    member.display_name = _clip(identity.display_name, 100)
    member.last_login_at = now
    db.flush()
    return member


def create_session(db: Session, member: Member, ttl: timedelta, user_agent: str | None) -> str:
    """建立 session，回傳 cookie 原值（只出現在回應裡，不入庫）。"""
    raw_token = secrets.token_urlsafe(32)
    now = utcnow()
    db.add(
        AuthSession(
            token_hash=hash_token(raw_token),
            member_id=member.id,
            created_at=now,
            expires_at=now + ttl,
            user_agent=_clip(user_agent, 255),
        )
    )
    db.flush()
    return raw_token


def resolve_session(db: Session, raw_token: str | None, ttl: timedelta) -> AuthSession | None:
    """查有效 session 並滑動延長；無 cookie、過期、已登出都回 None。"""
    if not raw_token:
        return None
    session = db.get(AuthSession, hash_token(raw_token))
    now = utcnow()
    if session is None or session.revoked_at is not None or session.expires_at <= now:
        return None
    session.expires_at = now + ttl
    db.flush()
    return session


def revoke_session(db: Session, raw_token: str | None) -> None:
    if not raw_token:
        return
    session = db.get(AuthSession, hash_token(raw_token))
    if session is not None and session.revoked_at is None:
        session.revoked_at = utcnow()
        db.flush()
