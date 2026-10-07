"""Firebase ID token 驗證。只在 POST /auth/session 用到，之後的請求一律看自有 session。"""

from collections.abc import Callable
from dataclasses import dataclass
from functools import lru_cache

import firebase_admin
from firebase_admin import auth as fb_auth

from app.core.config import get_settings


class InvalidIdTokenError(Exception):
    pass


@dataclass(frozen=True)
class FirebaseIdentity:
    uid: str
    email: str | None
    display_name: str | None


TokenVerifier = Callable[[str], FirebaseIdentity]


@lru_cache
def _firebase_app() -> firebase_admin.App:
    # 驗 ID token 只需要 projectId 與 Google 公鑰，不需要服務帳號金鑰
    project_id = get_settings().firebase_project_id
    if not project_id:
        raise RuntimeError("FIREBASE_PROJECT_ID 未設定")
    return firebase_admin.initialize_app(options={"projectId": project_id}, name="velorder")


def verify_firebase_id_token(id_token: str) -> FirebaseIdentity:
    """驗證簽章、aud、iss、exp、auth_time；失敗丟 InvalidIdTokenError。"""
    try:
        decoded = fb_auth.verify_id_token(id_token, app=_firebase_app(), clock_skew_seconds=10)
    except (ValueError, fb_auth.InvalidIdTokenError) as e:
        raise InvalidIdTokenError(str(e)) from e
    return FirebaseIdentity(
        uid=decoded["uid"],
        email=decoded.get("email"),
        display_name=decoded.get("name"),
    )


def get_token_verifier() -> TokenVerifier:
    return verify_firebase_id_token
