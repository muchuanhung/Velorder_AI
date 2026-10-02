import hashlib

import pytest
from sqlalchemy import select

from app.models import Route
from tests.conftest import SAMPLE_GPX, auth_header


@pytest.fixture
def alice(login):
    token, body = login("alice", "alice@example.com")
    return auth_header(token), body["member"]


@pytest.fixture
def bob(login):
    token, body = login("bob", "bob@example.com")
    return auth_header(token), body["member"]


def upload(
    client,
    headers,
    data=SAMPLE_GPX,
    filename="ride.gpx",
    content_type="application/gpx+xml",
    name=None,
):
    form = {"name": name} if name is not None else None
    return client.post(
        "/gpx", headers=headers, files={"file": (filename, data, content_type)}, data=form
    )


def test_upload_requires_session(client):
    res = upload(client, {})
    assert res.status_code == 401


def test_upload_stores_object_and_metadata(client, alice, storage, db):
    headers, member = alice
    res = upload(client, headers)
    assert res.status_code == 201, res.text
    body = res.json()

    assert body["name"] == "河濱公園"
    assert body["original_filename"] == "ride.gpx"
    assert body["size_bytes"] == len(SAMPLE_GPX)
    assert body["checksum_sha256"] == hashlib.sha256(SAMPLE_GPX).hexdigest()
    assert body["analysis_status"] == "parsed"
    assert body["point_count"] == 3
    assert body["start_lat"] == pytest.approx(25.0330)
    assert body["start_lng"] == pytest.approx(121.5654)
    assert body["distance_m"] is None
    assert body["analysis"]["parse"]["parser_version"] == "stub-0"

    route = db.get(Route, body["id"])
    assert route.member_id == member["id"]
    assert route.storage_key == f"gpx/members/{member['id']}/{body['id']}.gpx"
    assert storage.get(route.storage_key) == SAMPLE_GPX


def test_upload_name_override_and_filename_path_stripped(client, alice):
    headers, _ = alice
    res = upload(client, headers, filename="C:\\Users\\me\\ride.GPX", name="  晨騎  ")
    assert res.status_code == 201, res.text
    assert res.json()["name"] == "晨騎"
    assert res.json()["original_filename"] == "ride.GPX"


@pytest.mark.parametrize(
    ("kwargs", "status", "code"),
    [
        ({"filename": "ride.txt"}, 415, "invalid_file_type"),
        ({"content_type": "image/png"}, 415, "invalid_content_type"),
        ({"data": b""}, 422, "empty_file"),
        ({"data": b"<gpx><trkpt"}, 422, "invalid_gpx"),
        ({"data": b"<kml></kml>"}, 422, "invalid_gpx"),
        ({"data": b'<gpx version="1.1"></gpx>'}, 422, "invalid_gpx"),
    ],
)
def test_upload_validation(client, alice, kwargs, status, code):
    headers, _ = alice
    res = upload(client, headers, **kwargs)
    assert res.status_code == status, res.text
    assert res.json()["code"] == code


def test_upload_rejects_entity_expansion(client, alice):
    headers, _ = alice
    bomb = b"""<?xml version="1.0"?>
<!DOCTYPE gpx [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;">]>
<gpx><trk><name>&b;</name><trkseg><trkpt lat="1" lon="1"/></trkseg></trk></gpx>"""
    res = upload(client, headers, data=bomb)
    assert res.status_code == 422
    assert res.json()["code"] == "invalid_gpx"


def test_upload_too_large(client, alice, settings):
    headers, _ = alice
    res = upload(client, headers, data=b"x" * (settings.gpx_max_bytes + 10))
    assert res.status_code == 413
    assert res.json()["code"] == "file_too_large"


def test_upload_quota(client, alice, settings):
    headers, _ = alice
    for _ in range(settings.gpx_max_routes_per_member):
        assert upload(client, headers).status_code == 201
    res = upload(client, headers)
    assert res.status_code == 409
    assert res.json()["code"] == "route_quota_exceeded"


def test_list_only_returns_own_routes_with_pagination(client, alice, bob):
    a_headers, _ = alice
    b_headers, _ = bob
    for i in range(3):
        upload(client, a_headers, name=f"A{i}")
    upload(client, b_headers, name="B0")

    res = client.get("/gpx", headers=a_headers, params={"limit": 2})
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 3
    assert len(body["items"]) == 2
    assert {item["name"] for item in body["items"]} <= {"A0", "A1", "A2"}

    page2 = client.get("/gpx", headers=a_headers, params={"limit": 2, "offset": 2}).json()
    assert len(page2["items"]) == 1

    assert client.get("/gpx", headers=b_headers).json()["total"] == 1


def test_rename(client, alice):
    headers, _ = alice
    route_id = upload(client, headers).json()["id"]

    res = client.patch(f"/gpx/{route_id}", headers=headers, json={"name": "  新名稱 "})
    assert res.status_code == 200
    assert res.json()["name"] == "新名稱"
    assert client.get(f"/gpx/{route_id}", headers=headers).json()["name"] == "新名稱"

    assert (
        client.patch(f"/gpx/{route_id}", headers=headers, json={"name": "   "}).status_code == 422
    )
    assert (
        client.patch(f"/gpx/{route_id}", headers=headers, json={"name": "x" * 121}).status_code
        == 422
    )


def test_delete_removes_row_and_object(client, alice, storage, db):
    headers, _ = alice
    route_id = upload(client, headers).json()["id"]
    key = db.get(Route, route_id).storage_key

    res = client.delete(f"/gpx/{route_id}", headers=headers)
    assert res.status_code == 204
    db.expire_all()
    assert db.get(Route, route_id) is None
    assert not storage.exists(key)
    assert client.get(f"/gpx/{route_id}", headers=headers).status_code == 404


def test_other_member_gets_404_for_everything(client, alice, bob, db):
    a_headers, _ = alice
    b_headers, _ = bob
    route_id = upload(client, a_headers).json()["id"]

    assert client.get(f"/gpx/{route_id}", headers=b_headers).status_code == 404
    assert client.get(f"/gpx/{route_id}/segments", headers=b_headers).status_code == 404
    res = client.patch(f"/gpx/{route_id}", headers=b_headers, json={"name": "hijack"})
    assert res.status_code == 404
    assert res.json()["code"] == "route_not_found"
    assert client.delete(f"/gpx/{route_id}", headers=b_headers).status_code == 404

    assert db.scalar(select(Route.name).where(Route.id == route_id)) == "河濱公園"


def test_segments_stub(client, alice):
    headers, _ = alice
    route_id = upload(client, headers).json()["id"]
    res = client.get(f"/gpx/{route_id}/segments", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["route_id"] == route_id
    assert body["status"] == "stub"
    assert body["segment_length_km"] == 0.5
    assert body["segments"][0]["placeholder"] is True
