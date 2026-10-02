"""本 API 自行簽發的 session JWT（HS256）。

Firebase ID token 只在 POST /auth/session 換一次 session，之後都帶這張 JWT，
API 不必每個請求都打 Firebase，也不依賴 Firebase 的 1 小時效期。

Claims：
  iss  固定 settings.session_jwt_issuer
  aud  固定 settings.session_jwt_audience
  sub  members.id（字串）
  fuid Firebase uid
  typ  "session"
  iat / exp / jti
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import Settings

ALGORITHM = "HS256"
TOKEN_TYPE = "session"


class InvalidSessionError(Exception):
    pass


@dataclass(frozen=True)
class SessionClaims:
    member_id: int
    firebase_uid: str
    jti: str
    expires_at: datetime


def issue_session_token(
    settings: Settings, member_id: int, firebase_uid: str, now: datetime | None = None
) -> tuple[str, SessionClaims]:
    now = now or datetime.now(UTC)
    expires_at = now + timedelta(seconds=settings.session_ttl_seconds)
    jti = uuid.uuid4().hex
    payload = {
        "iss": settings.session_jwt_issuer,
        "aud": settings.session_jwt_audience,
        "sub": str(member_id),
        "fuid": firebase_uid,
        "typ": TOKEN_TYPE,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": jti,
    }
    token = jwt.encode(payload, settings.session_jwt_secret, algorithm=ALGORITHM)
    return token, SessionClaims(member_id, firebase_uid, jti, expires_at)


def decode_session_token(settings: Settings, token: str) -> SessionClaims:
    try:
        payload = jwt.decode(
            token,
            settings.session_jwt_secret,
            algorithms=[ALGORITHM],
            audience=settings.session_jwt_audience,
            issuer=settings.session_jwt_issuer,
            options={"require": ["exp", "iat", "sub", "jti"]},
        )
    except jwt.PyJWTError as exc:
        raise InvalidSessionError(str(exc)) from exc
    if payload.get("typ") != TOKEN_TYPE or not payload.get("fuid"):
        raise InvalidSessionError("token 類型不符")
    try:
        member_id = int(payload["sub"])
    except ValueError as exc:
        raise InvalidSessionError("sub 格式錯誤") from exc
    return SessionClaims(
        member_id=member_id,
        firebase_uid=payload["fuid"],
        jti=payload["jti"],
        expires_at=datetime.fromtimestamp(payload["exp"], UTC),
    )
