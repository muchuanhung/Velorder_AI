from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_id_token_verifier, get_storage
from app.core.config import Settings, get_settings
from app.core.db import get_db
from app.integrations.firebase_auth import FirebaseIdentity, InvalidIdTokenError
from app.integrations.storage import LocalObjectStorage
from app.main import create_app
from app.models import Base

SAMPLE_GPX = b"""<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>\xe6\xb2\xb3\xe6\xbf\xb1\xe5\x85\xac\xe5\x9c\x92</name></metadata>
  <trk><trkseg>
    <trkpt lat="25.0330" lon="121.5654"><ele>10</ele></trkpt>
    <trkpt lat="25.0340" lon="121.5660"><ele>12</ele></trkpt>
    <trkpt lat="25.0350" lon="121.5670"><ele>15</ele></trkpt>
  </trkseg></trk>
</gpx>
"""


class StubVerifier:
    """token 字串 -> FirebaseIdentity 的對照表，模擬 Firebase Admin。"""

    def __init__(self) -> None:
        self.tokens: dict[str, FirebaseIdentity] = {}

    def register(self, token: str, identity: FirebaseIdentity) -> str:
        self.tokens[token] = identity
        return token

    def verify(self, id_token: str) -> FirebaseIdentity:
        try:
            return self.tokens[id_token]
        except KeyError as exc:
            raise InvalidIdTokenError("unknown token") from exc


@pytest.fixture
def settings(tmp_path) -> Settings:
    return Settings(
        environment="test",
        database_url="sqlite://",
        auth_provider="fake",
        session_jwt_secret="test-secret-test-secret-test-secret-1234",
        storage_backend="local",
        storage_local_root=str(tmp_path / "objects"),
        gpx_max_bytes=64 * 1024,
        gpx_max_routes_per_member=5,
    )


@pytest.fixture
def db_sessionmaker() -> Iterator[sessionmaker[Session]]:
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    yield sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    engine.dispose()


@pytest.fixture
def db(db_sessionmaker) -> Iterator[Session]:
    session = db_sessionmaker()
    yield session
    session.close()


@pytest.fixture
def storage(settings) -> LocalObjectStorage:
    return LocalObjectStorage(settings.storage_local_root)


@pytest.fixture
def verifier() -> StubVerifier:
    return StubVerifier()


@pytest.fixture
def client(settings, db_sessionmaker, storage, verifier) -> Iterator[TestClient]:
    app = create_app()

    def _db() -> Iterator[Session]:
        session = db_sessionmaker()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_settings] = lambda: settings
    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_storage] = lambda: storage
    app.dependency_overrides[get_id_token_verifier] = lambda: verifier
    with TestClient(app) as c:
        yield c


@pytest.fixture
def login(client, verifier):
    """回傳 login(uid, email=None) -> (session_token, response_json)。"""

    def _login(uid: str, email: str | None = None, **extra) -> tuple[str, dict]:
        token = verifier.register(
            f"firebase-token-{uid}-{len(verifier.tokens)}",
            FirebaseIdentity(uid=uid, email=email, email_verified=bool(email), **extra),
        )
        res = client.post("/auth/session", json={"id_token": token})
        assert res.status_code == 200, res.text
        body = res.json()
        return body["access_token"], body

    return _login


def auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
