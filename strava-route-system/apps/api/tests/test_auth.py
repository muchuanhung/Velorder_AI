from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.core.security import decode_session_token, issue_session_token
from app.integrations.firebase_auth import FirebaseIdentity
from app.models import Member
from tests.conftest import auth_header


def test_session_requires_id_token(client):
    res = client.post("/auth/session")
    assert res.status_code == 401
    assert res.json()["code"] == "missing_id_token"
    assert res.headers["www-authenticate"] == "Bearer"


def test_session_rejects_invalid_id_token(client):
    res = client.post("/auth/session", json={"id_token": "nope"})
    assert res.status_code == 401
    assert res.json()["code"] == "invalid_id_token"


def test_session_creates_member_and_returns_session_shape(client, login, db, settings):
    token, body = login("uid-1", "rider@example.com", name="Rider", sign_in_provider="google.com")

    assert body["token_type"] == "Bearer"
    assert body["expires_in"] == settings.session_ttl_seconds
    assert body["member"]["firebase_uid"] == "uid-1"
    assert body["member"]["email"] == "rider@example.com"
    assert body["member"]["display_name"] == "Rider"
    assert body["member"]["sign_in_provider"] == "google.com"

    claims = decode_session_token(settings, token)
    assert claims.firebase_uid == "uid-1"
    assert claims.member_id == body["member"]["id"]

    rows = db.scalars(select(Member)).all()
    assert len(rows) == 1 and rows[0].last_login_at is not None


def test_session_accepts_bearer_header(client, verifier):
    token = verifier.register("hdr", FirebaseIdentity(uid="uid-hdr"))
    res = client.post("/auth/session", headers=auth_header(token))
    assert res.status_code == 200
    assert res.json()["member"]["firebase_uid"] == "uid-hdr"


def test_repeat_login_upserts_same_member(client, login, db):
    _, first = login("uid-2", "old@example.com", name="First Name")
    _, second = login("uid-2", "new@example.com", name="Changed In Firebase")

    assert first["member"]["id"] == second["member"]["id"]
    assert second["member"]["email"] == "new@example.com"
    # display_name 已有值時不被 Firebase 覆蓋
    assert second["member"]["display_name"] == "First Name"
    assert len(db.scalars(select(Member)).all()) == 1


def test_members_me(client, login):
    token, body = login("uid-3", "me@example.com")
    res = client.get("/members/me", headers=auth_header(token))
    assert res.status_code == 200
    assert res.json()["id"] == body["member"]["id"]


def test_members_me_rejects_raw_firebase_token(client, verifier):
    token = verifier.register("raw", FirebaseIdentity(uid="uid-raw"))
    res = client.get("/members/me", headers=auth_header(token))
    assert res.status_code == 401
    assert res.json()["code"] == "invalid_session"


def test_members_me_rejects_expired_session(client, login, settings):
    _, body = login("uid-4")
    expired, _ = issue_session_token(
        settings,
        body["member"]["id"],
        "uid-4",
        now=datetime.now(UTC) - timedelta(seconds=settings.session_ttl_seconds + 60),
    )
    res = client.get("/members/me", headers=auth_header(expired))
    assert res.status_code == 401


def test_members_me_rejects_session_signed_with_other_secret(client, login, settings):
    _, body = login("uid-5")
    forged, _ = issue_session_token(
        settings.model_copy(update={"session_jwt_secret": "x" * 40}), body["member"]["id"], "uid-5"
    )
    assert client.get("/members/me", headers=auth_header(forged)).status_code == 401


def test_disabled_member_session_is_forbidden(client, login, db):
    token, body = login("uid-6")
    member = db.get(Member, body["member"]["id"])
    member.status = "disabled"
    db.commit()

    res = client.get("/members/me", headers=auth_header(token))
    assert res.status_code == 403
    assert res.json()["code"] == "member_disabled"


def test_disabled_member_login_is_forbidden(client, verifier, login, db):
    _, body = login("uid-7")
    member = db.get(Member, body["member"]["id"])
    member.status = "disabled"
    db.commit()

    token = verifier.register("again", FirebaseIdentity(uid="uid-7"))
    res = client.post("/auth/session", json={"id_token": token})
    assert res.status_code == 403
    assert res.json()["code"] == "member_disabled"
