import boto3
import pytest
from moto import mock_aws

from app.core.config import Settings
from app.integrations import firebase_auth
from app.integrations.firebase_auth import (
    FakeVerifier,
    FirebaseAdminVerifier,
    InvalidIdTokenError,
    identity_from_claims,
)
from app.integrations.gpx_analysis import GpxFormatError, parse_gpx, segment_route
from app.integrations.storage import LocalObjectStorage, ObjectNotFoundError, S3ObjectStorage
from tests.conftest import SAMPLE_GPX


def test_parse_gpx_counts_points_and_start():
    parsed = parse_gpx(SAMPLE_GPX)
    assert parsed.point_count == 3
    assert (parsed.start_lat, parsed.start_lng) == (25.033, 121.5654)
    assert parsed.track_name == "河濱公園"


def test_parse_gpx_route_points_without_namespace():
    parsed = parse_gpx(b'<gpx><rte><rtept lat="1.5" lon="2.5"/></rte></gpx>')
    assert parsed.point_count == 1 and parsed.start_lat == 1.5


def test_parse_gpx_rejects_external_entities():
    xxe = b"""<?xml version="1.0"?>
<!DOCTYPE gpx [<!ENTITY x SYSTEM "file:///etc/passwd">]><gpx><name>&x;</name></gpx>"""
    with pytest.raises(GpxFormatError):
        parse_gpx(xxe)


def test_segment_stub_without_parse():
    assert segment_route(None).segments == []


def test_local_storage_roundtrip_and_traversal(tmp_path):
    storage = LocalObjectStorage(tmp_path)
    storage.put("gpx/members/1/a.gpx", b"data", "application/gpx+xml")
    assert storage.get("gpx/members/1/a.gpx") == b"data"
    storage.delete("gpx/members/1/a.gpx")
    assert not storage.exists("gpx/members/1/a.gpx")
    with pytest.raises(ObjectNotFoundError):
        storage.get("gpx/members/1/a.gpx")
    for bad in ("../escape.gpx", "/abs.gpx", "gpx/../../x"):
        with pytest.raises(ValueError):
            storage.put(bad, b"x", "text/xml")


@mock_aws
def test_s3_storage_roundtrip():
    settings = Settings(storage_backend="s3", s3_bucket="test-bucket", s3_region="us-east-1")
    client = boto3.client("s3", region_name="us-east-1")
    client.create_bucket(Bucket="test-bucket")
    storage = S3ObjectStorage(settings, client=client)

    storage.put("gpx/members/1/a.gpx", b"data", "application/gpx+xml")
    assert storage.exists("gpx/members/1/a.gpx")
    assert storage.get("gpx/members/1/a.gpx") == b"data"
    head = client.head_object(Bucket="test-bucket", Key="gpx/members/1/a.gpx")
    assert head["ContentType"] == "application/gpx+xml"
    storage.delete("gpx/members/1/a.gpx")
    assert not storage.exists("gpx/members/1/a.gpx")
    with pytest.raises(ObjectNotFoundError):
        storage.get("gpx/members/1/a.gpx")


def test_identity_from_firebase_claims():
    identity = identity_from_claims(
        {
            "uid": "u1",
            "email": "a@b.c",
            "email_verified": True,
            "name": "A",
            "picture": "https://x/y.png",
            "firebase": {"sign_in_provider": "google.com"},
        }
    )
    assert identity.uid == "u1"
    assert identity.email_verified is True
    assert identity.sign_in_provider == "google.com"


def test_firebase_admin_verifier_maps_errors(monkeypatch):
    from firebase_admin import auth

    verifier = FirebaseAdminVerifier(Settings(firebase_project_id="demo-project"))
    monkeypatch.setattr(verifier, "_get_app", lambda: object())

    def _raise(*_args, **_kwargs):
        raise auth.InvalidIdTokenError("bad")

    monkeypatch.setattr(auth, "verify_id_token", _raise)
    with pytest.raises(InvalidIdTokenError):
        verifier.verify("token")

    monkeypatch.setattr(auth, "verify_id_token", lambda *_a, **_k: {"uid": "u9", "firebase": {}})
    assert verifier.verify("token").uid == "u9"


def test_fake_verifier():
    assert FakeVerifier().verify("fake:u1:a@b.c").email == "a@b.c"
    with pytest.raises(InvalidIdTokenError):
        FakeVerifier().verify("real-looking-token")


def test_build_verifier_selects_provider():
    assert isinstance(firebase_auth.build_verifier(Settings(auth_provider="fake")), FakeVerifier)
    assert isinstance(
        firebase_auth.build_verifier(Settings(auth_provider="firebase")), FirebaseAdminVerifier
    )


def test_production_rejects_fake_auth_and_weak_secret():
    with pytest.raises(ValueError):
        Settings(environment="production", auth_provider="fake", session_jwt_secret="y" * 40)
    with pytest.raises(ValueError):
        Settings(environment="production", auth_provider="firebase")
    Settings(environment="production", auth_provider="firebase", session_jwt_secret="y" * 40)
