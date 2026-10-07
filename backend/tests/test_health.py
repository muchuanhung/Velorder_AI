def test_health_ok(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "database": "ok"}


def test_unknown_path_uses_error_format(client):
    res = client.get("/nope")
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "not_found"
