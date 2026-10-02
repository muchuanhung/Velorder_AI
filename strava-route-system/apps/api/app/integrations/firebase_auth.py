"""Firebase ID token 驗證。

只用 Firebase 確認「是誰登入」，驗證後的身分交給 member_service upsert 到自有 DB。
測試透過 FastAPI dependency override 換成假的 verifier，不需要連 Firebase。
"""

import json
import threading
from dataclasses import dataclass
from typing import Protocol

from app.core.config import Settings


class InvalidIdTokenError(Exception):
    """ID token 無效、過期或被撤銷。"""


@dataclass(frozen=True)
class FirebaseIdentity:
    uid: str
    email: str | None = None
    email_verified: bool = False
    name: str | None = None
    picture: str | None = None
    sign_in_provider: str | None = None


class IdTokenVerifier(Protocol):
    def verify(self, id_token: str) -> FirebaseIdentity: ...


class FirebaseAdminVerifier:
    """以 firebase-admin 驗證 token（簽章、aud=project id、exp、撤銷檢查）。"""

    _lock = threading.Lock()

    def __init__(self, settings: Settings, check_revoked: bool = True) -> None:
        self._settings = settings
        self._check_revoked = check_revoked
        self._app = None

    def _get_app(self):
        import firebase_admin
        from firebase_admin import credentials

        if self._app is not None:
            return self._app
        with self._lock:
            if self._app is None:
                name = "routecast-api"
                try:
                    self._app = firebase_admin.get_app(name)
                except ValueError:
                    raw = self._settings.firebase_service_account_json
                    cred = credentials.Certificate(json.loads(raw)) if raw else None
                    options = (
                        {"projectId": self._settings.firebase_project_id}
                        if self._settings.firebase_project_id
                        else None
                    )
                    self._app = firebase_admin.initialize_app(cred, options, name=name)
        return self._app

    def verify(self, id_token: str) -> FirebaseIdentity:
        from firebase_admin import auth

        try:
            claims = auth.verify_id_token(
                id_token, app=self._get_app(), check_revoked=self._check_revoked
            )
        except (ValueError, auth.InvalidIdTokenError, auth.UserDisabledError) as exc:
            raise InvalidIdTokenError(str(exc)) from exc
        return identity_from_claims(claims)


class FakeVerifier:
    """本機開發用：接受 `fake:<uid>[:<email>]`，production 由 Settings 擋掉。"""

    def verify(self, id_token: str) -> FirebaseIdentity:
        parts = id_token.split(":")
        if len(parts) < 2 or parts[0] != "fake" or not parts[1]:
            raise InvalidIdTokenError("fake token 格式應為 fake:<uid>[:<email>]")
        email = parts[2] if len(parts) > 2 and parts[2] else None
        return FirebaseIdentity(
            uid=parts[1], email=email, email_verified=bool(email), sign_in_provider="fake"
        )


def identity_from_claims(claims: dict) -> FirebaseIdentity:
    firebase_claims = claims.get("firebase") or {}
    return FirebaseIdentity(
        uid=claims["uid"] if "uid" in claims else claims["sub"],
        email=claims.get("email"),
        email_verified=bool(claims.get("email_verified", False)),
        name=claims.get("name"),
        picture=claims.get("picture"),
        sign_in_provider=firebase_claims.get("sign_in_provider"),
    )


def build_verifier(settings: Settings) -> IdTokenVerifier:
    if settings.auth_provider == "fake":
        return FakeVerifier()
    return FirebaseAdminVerifier(settings)
