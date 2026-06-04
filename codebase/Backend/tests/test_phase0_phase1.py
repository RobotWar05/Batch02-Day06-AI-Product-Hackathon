import json

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.auth_service import auth_service


def reset_users_file() -> None:
    auth_service.user_store.write([])


def read_users() -> list[dict]:
    with auth_service.user_store.file_path.open("r", encoding="utf-8") as file:
        return json.load(file)


@pytest.mark.anyio
async def test_health_check_returns_ok() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_login_creates_new_user_and_ignores_password() -> None:
    reset_users_file()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post(
            "/auth/login",
            json={"username": "  Hoang Le Bach  ", "password": "anything"},
        )

    payload = response.json()
    assert response.status_code == 200
    assert payload["is_new_user"] is True
    assert payload["user"]["username"] == "Hoang Le Bach"
    assert payload["user"]["username_normalized"] == "hoang le bach"
    assert "password" not in payload["user"]
    assert len(read_users()) == 1


@pytest.mark.anyio
async def test_login_reuses_existing_normalized_username() -> None:
    reset_users_file()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        await client.post("/auth/login", json={"username": "demo user", "password": "x"})

        response = await client.post(
            "/auth/login",
            json={"username": "  Demo   User ", "password": "y"},
        )

    payload = response.json()
    users = read_users()
    assert response.status_code == 200
    assert payload["is_new_user"] is False
    assert payload["user"]["username_normalized"] == "demo user"
    assert len(users) == 1


@pytest.mark.anyio
async def test_login_rejects_blank_username() -> None:
    reset_users_file()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post(
            "/auth/login",
            json={"username": "   ", "password": "anything"},
        )

    assert response.status_code == 422
    assert response.json()["detail"] == "Username must not be blank."
    assert read_users() == []


@pytest.mark.anyio
async def test_login_reuses_existing_user_case_insensitively_without_password() -> None:
    reset_users_file()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        first_response = await client.post("/auth/login", json={"username": "Alice"})
        second_response = await client.post("/auth/login", json={"username": "  alice  "})

    first_payload = first_response.json()
    second_payload = second_response.json()

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert first_payload["user"]["id"] == second_payload["user"]["id"]
    assert second_payload["is_new_user"] is False
    assert len(read_users()) == 1
