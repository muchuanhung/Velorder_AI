from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.db import get_db
from app.core.errors import UnauthorizedError
from app.core.security import InvalidSessionError, decode_session_token
from app.integrations.firebase_auth import IdTokenVerifier, build_verifier
from app.integrations.storage import ObjectStorage, build_storage
from app.models.member import Member
from app.services import member_service

_bearer = HTTPBearer(auto_error=False)


@lru_cache
def _cached_verifier() -> IdTokenVerifier:
    return build_verifier(get_settings())


@lru_cache
def _cached_storage() -> ObjectStorage:
    return build_storage(get_settings())


def get_id_token_verifier() -> IdTokenVerifier:
    return _cached_verifier()


def get_storage() -> ObjectStorage:
    return _cached_storage()


SettingsDep = Annotated[Settings, Depends(get_settings)]
DbDep = Annotated[Session, Depends(get_db)]
VerifierDep = Annotated[IdTokenVerifier, Depends(get_id_token_verifier)]
StorageDep = Annotated[ObjectStorage, Depends(get_storage)]
BearerDep = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]


def get_current_member(db: DbDep, settings: SettingsDep, credentials: BearerDep) -> Member:
    if credentials is None:
        raise UnauthorizedError("缺少 Authorization: Bearer <session token>")
    try:
        claims = decode_session_token(settings, credentials.credentials)
    except InvalidSessionError as exc:
        raise UnauthorizedError("session 無效或已過期", code="invalid_session") from exc
    member = member_service.get_active_member(db, claims.member_id)
    if member.firebase_uid != claims.firebase_uid:
        raise UnauthorizedError("session 與會員不符", code="invalid_session")
    return member


CurrentMember = Annotated[Member, Depends(get_current_member)]
