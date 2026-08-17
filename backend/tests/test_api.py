import os

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_vrukshasetu.db"

import pytest
from httpx import ASGITransport, AsyncClient

from app.database import Base, engine
from app.main import app

pytestmark = pytest.mark.asyncio


@pytest.fixture
async def client():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def _register_and_login(client, role="CITIZEN", email="user1@test.com"):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "Test User", "email": email, "password": "Test@1234", "role": role},
    )
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "Test@1234"})
    return resp.json()["data"]["token"]


async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


async def test_ready(client):
    resp = await client.get("/ready")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ready"


async def test_register_and_login(client):
    token = await _register_and_login(client, email="auth_test@test.com")
    assert token
    resp = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["data"]["email"] == "auth_test@test.com"


async def test_login_wrong_password_rejected(client):
    await client.post(
        "/api/v1/auth/register",
        json={"name": "X", "email": "wrongpw@test.com", "password": "Correct@123", "role": "CITIZEN"},
    )
    resp = await client.post("/api/v1/auth/login", json={"email": "wrongpw@test.com", "password": "Wrong@123"})
    assert resp.status_code == 401


async def test_duplicate_registration_rejected(client):
    email = "dupe@test.com"
    await client.post(
        "/api/v1/auth/register",
        json={"name": "X", "email": email, "password": "Test@1234", "role": "CITIZEN"},
    )
    resp = await client.post(
        "/api/v1/auth/register",
        json={"name": "X", "email": email, "password": "Test@1234", "role": "CITIZEN"},
    )
    assert resp.status_code == 409


async def test_tree_crud_and_passport(client):
    token = await _register_and_login(client, email="planter@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    sp = await client.post("/api/v1/trees", headers=headers, json={
        "species_id": "does-not-exist", "category_id": "does-not-exist",
        "ward_id": "does-not-exist", "latitude": 21.14, "longitude": 79.08,
    })
    # Should still create (no FK enforcement assertion needed for prototype, but must not 500)
    assert sp.status_code in (201, 422)

    if sp.status_code == 201:
        tree_id = sp.json()["data"]["id"]
        code = sp.json()["data"]["tree_code"]

        get_resp = await client.get(f"/api/v1/trees/{tree_id}")
        assert get_resp.status_code == 200

        passport = await client.get(f"/api/v1/public/trees/{code}/passport")
        assert passport.status_code == 200
        assert "guardian_id" not in passport.json()["data"]

        qr = await client.get(f"/api/v1/trees/{tree_id}/qr")
        assert qr.status_code == 200
        assert qr.headers["content-type"] == "image/png"


async def test_tree_not_found(client):
    resp = await client.get("/api/v1/trees/does-not-exist-id")
    assert resp.status_code == 404
    assert resp.json()["error_code"] == "TREE_NOT_FOUND"


async def test_verification_ai_demo_mode(client):
    token = await _register_and_login(client, email="verifier@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    sp = await client.post("/api/v1/trees", headers=headers, json={
        "species_id": "s1", "category_id": "c1", "ward_id": "w1",
        "latitude": 21.14, "longitude": 79.08,
    })
    tree_id = sp.json()["data"]["id"]
    v = await client.post(f"/api/v1/trees/{tree_id}/verifications", headers=headers, json={"health_status": "HEALTHY"})
    assert v.status_code == 201
    body = v.json()["data"]
    assert body["ai_verification"]["mode"] == "DEMO_MODE"
    assert "confidence" in body["ai_verification"]


async def test_report_creation_and_admin_only_update(client):
    token = await _register_and_login(client, email="reporter@test.com")
    headers = {"Authorization": f"Bearer {token}"}
    resp = await client.post("/api/v1/reports", headers=headers, json={"type": "DEAD", "description": "test"})
    assert resp.status_code == 201
    report_id = resp.json()["data"]["id"]

    # Citizen should not be able to update report status (RBAC)
    forbidden = await client.patch(f"/api/v1/reports/{report_id}", headers=headers, json={"status": "RESOLVED"})
    assert forbidden.status_code == 403


async def test_public_statistics_shape(client):
    resp = await client.get("/api/v1/public/statistics")
    assert resp.status_code == 200
    data = resp.json()["data"]
    for key in ("trees_registered", "trees_surviving", "survival_rate", "wards_covered"):
        assert key in data


async def test_green_score(client):
    resp = await client.get("/api/v1/green-score")
    assert resp.status_code == 200
    assert 0 <= resp.json()["data"]["green_score"] <= 100


async def test_unauthenticated_tree_create_rejected(client):
    resp = await client.post("/api/v1/trees", json={
        "species_id": "s1", "category_id": "c1", "ward_id": "w1",
        "latitude": 21.14, "longitude": 79.08,
    })
    assert resp.status_code == 401
