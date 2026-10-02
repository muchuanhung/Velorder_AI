from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.errors import ForbiddenError, NotFoundError
from app.core.security import issue_session_token
from app.integrations.firebase_auth import FirebaseIdentity
from app.models.base import utcnow
from app.models.member import Member
from app.schemas.member import MemberOut, SessionOut


def get_by_firebase_uid(db: Session, firebase_uid: str) -> Member | None:
    return db.scalar(select(Member).where(Member.firebase_uid == firebase_uid))


def get_active_member(db: Session, member_id: int) -> Member:
    member = db.get(Member, member_id)
    if member is None:
        raise NotFoundError("會員不存在")
    if member.status != "active":
        raise ForbiddenError("會員已停用", code="member_disabled")
    return member


def _apply_identity(member: Member, identity: FirebaseIdentity) -> None:
    # Firebase 沒給的欄位不覆蓋，避免把使用者自己改過的資料洗掉
    if identity.email is not None:
        member.email = identity.email
        member.email_verified = identity.email_verified
    if identity.name is not None and not member.display_name:
        member.display_name = identity.name
    if identity.picture is not None and not member.photo_url:
        member.photo_url = identity.picture
    if identity.sign_in_provider is not None:
        member.sign_in_provider = identity.sign_in_provider
    member.last_login_at = utcnow()


def upsert_from_identity(db: Session, identity: FirebaseIdentity) -> Member:
    member = get_by_firebase_uid(db, identity.uid)
    if member is None:
        member = Member(firebase_uid=identity.uid)
        _apply_identity(member, identity)
        db.add(member)
        try:
            db.commit()
        except IntegrityError:
            # 同一使用者併發首次登入：另一個請求已建立，改走更新
            db.rollback()
            member = get_by_firebase_uid(db, identity.uid)
            if member is None:
                raise
        else:
            db.refresh(member)
            return member

    if member.status != "active":
        raise ForbiddenError("會員已停用", code="member_disabled")
    _apply_identity(member, identity)
    db.commit()
    db.refresh(member)
    return member


def create_session(db: Session, settings: Settings, identity: FirebaseIdentity) -> SessionOut:
    member = upsert_from_identity(db, identity)
    token, claims = issue_session_token(settings, member.id, member.firebase_uid)
    return SessionOut(
        access_token=token,
        expires_at=claims.expires_at,
        expires_in=settings.session_ttl_seconds,
        member=MemberOut.model_validate(member),
    )
