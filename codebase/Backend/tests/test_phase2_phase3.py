import json

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.auth_service import auth_service
from app.services.session_service import session_service


def reset_data_files() -> None:
    auth_service.user_store.write([])
    session_service.session_store.write([])


def read_sessions() -> list[dict]:
    with session_service.session_store.file_path.open("r", encoding="utf-8") as file:
        return json.load(file)


@pytest.mark.anyio
async def test_phase2_session_persistence_is_scoped_per_user() -> None:
    reset_data_files()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        user_one = (
            await client.post("/auth/login", json={"username": "Alice", "password": "x"})
        ).json()["user"]
        user_two = (
            await client.post("/auth/login", json={"username": "Bob", "password": "y"})
        ).json()["user"]

        first_session = (
            await client.post(
                f"/users/{user_one['id']}/sessions",
                json={"title": "Weekend in Da Nang"},
            )
        ).json()["session"]
        second_session = (
            await client.post(
                f"/users/{user_one['id']}/sessions",
                json={"title": "Train ideas"},
            )
        ).json()["session"]
        await client.post(
            f"/users/{user_two['id']}/sessions",
            json={"title": "Different user session"},
        )

        list_response = await client.get(f"/users/{user_one['id']}/sessions")
        session_response = await client.get(f"/sessions/{first_session['id']}")

    listed_sessions = list_response.json()["sessions"]
    listed_ids = {session["id"] for session in listed_sessions}

    assert list_response.status_code == 200
    assert len(listed_sessions) == 2
    assert listed_ids == {first_session["id"], second_session["id"]}
    assert session_response.status_code == 200
    assert set(session_response.json()["session"]) == {
        "id",
        "user_id",
        "title",
        "messages",
        "created_at",
        "updated_at",
    }
    assert session_response.json()["session"]["messages"] == []
    assert session_response.json()["session"]["title"] == "Weekend in Da Nang"
    assert len(read_sessions()) == 3


@pytest.mark.anyio
async def test_phase3_message_storage_appends_user_and_mock_assistant_messages() -> None:
    reset_data_files()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        user = (
            await client.post("/auth/login", json={"username": "Charlie", "password": "z"})
        ).json()["user"]
        session = (
            await client.post(f"/users/{user['id']}/sessions", json={"title": "New trip"})
        ).json()["session"]
        other_session = (
            await client.post(f"/users/{user['id']}/sessions", json={"title": "Other trip"})
        ).json()["session"]

        first_message_response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Find me a train from Sai Gon to Da Nang"},
        )
        second_message_response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "I need 2 tickets for 10/6"},
        )
        reloaded_session = await client.get(f"/sessions/{session['id']}")
        untouched_session = await client.get(f"/sessions/{other_session['id']}")

    first_payload = first_message_response.json()
    second_payload = second_message_response.json()
    messages = reloaded_session.json()["session"]["messages"]

    assert first_message_response.status_code == 200
    assert second_message_response.status_code == 200
    assert set(first_payload) == {"status", "session", "user_message", "assistant_message"}
    assert first_payload["user_message"]["role"] == "user"
    assert first_payload["assistant_message"]["role"] == "assistant"
    assert "Mock assistant response:" in first_payload["assistant_message"]["content"]
    assert [message["role"] for message in messages] == [
        "user",
        "assistant",
        "user",
        "assistant",
    ]
    assert messages[0]["content"] == "Find me a train from Sai Gon to Da Nang"
    assert messages[2]["content"] == "I need 2 tickets for 10/6"
    assert reloaded_session.json()["session"]["updated_at"] != session["updated_at"]
    assert untouched_session.json()["session"]["messages"] == []
    assert len(read_sessions()) == 2


@pytest.mark.anyio
async def test_phase2_session_endpoints_handle_not_found_and_default_title() -> None:
    reset_data_files()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        user = (
            await client.post("/auth/login", json={"username": "Dana", "password": "x"})
        ).json()["user"]

        create_with_blank_title = await client.post(
            f"/users/{user['id']}/sessions",
            json={"title": "   "},
        )
        missing_user_create = await client.post(
            "/users/not-a-real-user/sessions",
            json={"title": "Ghost session"},
        )
        missing_user_list = await client.get("/users/not-a-real-user/sessions")
        missing_session_get = await client.get("/sessions/not-a-real-session")

    created_session = create_with_blank_title.json()["session"]

    assert create_with_blank_title.status_code == 200
    assert created_session["title"] == "New chat"
    assert missing_user_create.status_code == 404
    assert missing_user_create.json()["detail"] == "User not found."
    assert missing_user_list.status_code == 404
    assert missing_session_get.status_code == 404
    assert missing_session_get.json()["detail"] == "Session not found."


@pytest.mark.anyio
async def test_phase3_message_endpoint_handles_blank_missing_and_legacy_payloads() -> None:
    reset_data_files()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        user = (
            await client.post("/auth/login", json={"username": "Eve", "password": "x"})
        ).json()["user"]
        session = (
            await client.post(f"/users/{user['id']}/sessions", json={"title": "Chat"})
        ).json()["session"]

        blank_message = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "   "},
        )
        missing_session = await client.post(
            "/sessions/not-a-real-session/messages",
            json={"content": "hello"},
        )
        wrong_payload_key_supported = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"message": "Legacy frontend payload"},
        )
        missing_content = await client.post(
            f"/sessions/{session['id']}/messages",
            json={},
        )

    assert blank_message.status_code == 422
    assert blank_message.json()["detail"] == "Message content must not be blank."
    assert missing_session.status_code == 404
    assert missing_session.json()["detail"] == "Session not found."
    assert wrong_payload_key_supported.status_code == 200
    assert (
        wrong_payload_key_supported.json()["user_message"]["content"]
        == "Legacy frontend payload"
    )
    assert missing_content.status_code == 422


@pytest.mark.anyio
async def test_phase2_phase3_return_clear_error_when_session_store_json_is_corrupt() -> None:
    reset_data_files()
    session_service.session_store.file_path.write_text("{bad json", encoding="utf-8")

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        user = (
            await client.post("/auth/login", json={"username": "Frank", "password": "x"})
        ).json()["user"]
        list_response = await client.get(f"/users/{user['id']}/sessions")

    assert list_response.status_code == 500
    assert "Invalid JSON data in" in list_response.json()["detail"]
