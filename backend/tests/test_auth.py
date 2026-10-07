import hashlib

from sqlalchemy import func, select

from app.models import AuthSession, Member
from tests.conftest import COOKIE, login


def test_login_sets_httponly_cookie_and_returns_member(client):
    res = client.post(
        "/api/v1/auth/session", json={"idToken": "valid:uid-1"}, headers={"User-Agent": "pytest"}
    )
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == "uid-1@example.com"
    assert body["displayName"] == "Rider uid-1"
    assert body["createdAt"].endswith("Z")
    assert "id" not in body and "firebaseUid" not in body

    set_cookie = res.headers["set-cookie"]
    assert set_cookie.startswith(f"{COOKIE}=")
    assert "HttpOnly" in set_cookie
    assert "SameSite=lax" in set_cookie
    assert "Path=/" in set_cookie
    assert "Max-Age=604800" in set_cookie


def test_db_stores_only_sha256_of_token(client, db):
    raw = login(client)
    stored = db.scalars(select(AuthSession)).all()
    assert len(stored) == 1
    assert stored[0].token_hash == hashlib.sha256(raw.encode()).hexdigest()
    assert stored[0].token_hash != raw


def test_user_agent_is_recorded(client, db):
    client.post(
        "/api/v1/auth/session", json={"idToken": "valid:uid-1"}, headers={"User-Agent": "pytest"}
    )
    assert db.scalar(select(AuthSession.user_agent)) == "pytest"


def test_invalid_token_returns_401_without_cookie(client, db):
    res = client.post("/api/v1/auth/session", json={"idToken": "forged"})
    assert res.status_code == 401
    assert res.json() == {"error": {"code": "unauthenticated", "message": "ID token 驗證失敗"}}
    assert "set-cookie" not in res.headers
    assert db.scalar(select(func.count()).select_from(Member)) == 0


def test_missing_id_token_returns_422_validation_error(client):
    res = client.post("/api/v1/auth/session", json={})
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "validation_error"


def test_second_login_updates_member_instead_of_inserting(client, db):
    login(client, "valid:uid-1:old@example.com")
    client.cookies.clear()
    res = client.post("/api/v1/auth/session", json={"idToken": "valid:uid-1:new@example.com"})
    assert res.status_code == 200
    assert res.json()["email"] == "new@example.com"
    assert db.scalar(select(func.count()).select_from(Member)) == 1
    assert db.scalar(select(func.count()).select_from(AuthSession)) == 2


def test_logout_revokes_session_and_clears_cookie(client, db):
    login(client)
    res = client.delete("/api/v1/auth/session")
    assert res.status_code == 204
    assert f'{COOKIE}=""' in res.headers["set-cookie"]
    assert "Max-Age=0" in res.headers["set-cookie"]
    assert db.scalar(select(AuthSession.revoked_at)) is not None


def test_logout_without_cookie_is_204(client):
    assert client.delete("/api/v1/auth/session").status_code == 204


def test_secure_flag_when_enabled(client, settings):
    settings.session_cookie_secure = True
    res = client.post("/api/v1/auth/session", json={"idToken": "valid:uid-1"})
    assert "Secure" in res.headers["set-cookie"]
