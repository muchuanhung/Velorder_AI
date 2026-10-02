def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_readiness_checks_database(client):
    res = client.get("/health/ready")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "database": "ok"}
