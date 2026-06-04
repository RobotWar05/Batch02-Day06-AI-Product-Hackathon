import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.auth_service import auth_service
from app.services.session_service import session_service


def reset_data_files() -> None:
    auth_service.user_store.write([])
    session_service.session_store.write([])


async def create_user_and_session(client: AsyncClient, username: str, title: str = "Trip") -> dict:
    user = (await client.post("/auth/login", json={"username": username, "password": "x"})).json()["user"]
    return (await client.post(f"/users/{user['id']}/sessions", json={"title": title})).json()["session"]


@pytest.mark.anyio
async def test_faq_react_flow_returns_tool_grounded_answer_and_trace() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "faq-react")
        response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Đi từ Hà Nội Đà Nẵng vé máy bay rẻ hơn tàu hỏa bao nhiêu cho 2 người"},
        )

    payload = response.json()

    assert response.status_code == 200
    assert payload["response"]["response_type"] == "text"
    assert "2 người" in payload["response"]["message"]
    assert payload["session"]["current_trip_state"]["intent"] == "faq"
    assert payload["session"]["current_trip_state"]["last_tool_calls"]
    assert payload["session"]["current_trip_state"]["last_tool_calls"][0]["tool"] == "compare_modes"


@pytest.mark.anyio
async def test_unrelated_message_stays_out_of_scope_without_tools() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "unrelated")
        response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tôi có được đem đồ lên máy bay không"},
        )

    payload = response.json()

    assert response.status_code == 200
    assert payload["response"]["response_type"] == "text"
    assert payload["response"]["next_action"] == "out_of_scope"
    assert payload["session"]["current_trip_state"]["intent"] == "unrelated"
    assert payload["session"]["current_trip_state"]["last_tool_calls"] == []


@pytest.mark.anyio
async def test_complete_search_returns_manifest_backed_ranked_results() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "search-ranked")
        response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm 2 vé tàu hỏa từ Hà Nội đi Đà Nẵng ngày 6/6"},
        )

    payload = response.json()["response"]["payload"]

    assert payload["status"] == "ok"
    assert payload["grouped_results"]["train"]["default"]
    assert payload["grouped_results"]["train"]["default"][0]["provider"] == "Vietnam Railways"
    assert payload["grouped_results"]["flight"]["default"] == []
