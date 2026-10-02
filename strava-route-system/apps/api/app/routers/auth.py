from fastapi import APIRouter

from app.api.deps import BearerDep, CurrentMember, DbDep, SettingsDep, VerifierDep
from app.core.errors import UnauthorizedError
from app.integrations.firebase_auth import InvalidIdTokenError
from app.schemas.common import ErrorOut
from app.schemas.member import MemberOut, SessionCreateIn, SessionOut
from app.services import member_service

router = APIRouter(tags=["auth"])


@router.post(
    "/auth/session",
    response_model=SessionOut,
    responses={401: {"model": ErrorOut}, 403: {"model": ErrorOut}},
)
def create_session(
    db: DbDep,
    settings: SettingsDep,
    verifier: VerifierDep,
    credentials: BearerDep,
    body: SessionCreateIn | None = None,
) -> SessionOut:
    """用 Firebase ID token 換本 API 的 session token，並 upsert members。"""
    id_token = (body.id_token if body else None) or (
        credentials.credentials if credentials else None
    )
    if not id_token:
        raise UnauthorizedError("缺少 Firebase ID token", code="missing_id_token")
    try:
        identity = verifier.verify(id_token)
    except InvalidIdTokenError as exc:
        raise UnauthorizedError("Firebase ID token 無效", code="invalid_id_token") from exc
    return member_service.create_session(db, settings, identity)


@router.get("/members/me", response_model=MemberOut, responses={401: {"model": ErrorOut}})
def read_me(member: CurrentMember) -> MemberOut:
    return MemberOut.model_validate(member)
