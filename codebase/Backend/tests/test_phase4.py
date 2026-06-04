import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.auth_service import auth_service
from app.services.session_service import session_service


def reset_data_files() -> None:
    auth_service.user_store.write([])
    session_service.session_store.write([])


@pytest.mark.anyio
async def test_parse_classifies_search_trip_faq_and_unrelated() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        search_response = await client.post(
            "/api/parse",
            json={"message": "Tôi muốn đặt vé máy bay 2 người đi Hà Nội Đà Nẵng"},
        )
        faq_response = await client.post(
            "/api/parse",
            json={"message": "Đi từ Hà Nội Đà Nẵng vé máy bay rẻ hơn tàu hỏa bao nhiêu"},
        )
        unrelated_response = await client.post(
            "/api/parse",
            json={"message": "Tôi có được đem đồ lên máy bay không"},
        )

    search_payload = search_response.json()["parsed"]
    faq_payload = faq_response.json()["parsed"]
    unrelated_payload = unrelated_response.json()["parsed"]

    assert search_response.status_code == 200
    assert search_payload["intent"] == "search_trip"
    assert search_payload["slots"]["departure"] == "Hà Nội"
    assert search_payload["slots"]["destination"] == "Đà Nẵng"
    assert search_payload["slots"]["transport"] == "flight"
    assert search_payload["slots"]["passengers"] == 2

    assert faq_response.status_code == 200
    assert faq_payload["intent"] == "faq"
    assert faq_payload["slots"]["departure"] == "Hà Nội"
    assert faq_payload["slots"]["destination"] == "Đà Nẵng"

    assert unrelated_response.status_code == 200
    assert unrelated_payload["intent"] == "unrelated"
    assert unrelated_payload["search_status"] == "not_applicable"


@pytest.mark.anyio
async def test_parse_uses_session_state_to_fill_pending_passenger_slot() -> None:
    reset_data_files()

    prior_state = {
        "intent": "search_trip",
        "slots": {
            "departure": "Hà Nội",
            "destination": "Đà Nẵng",
            "date": "2026-06-10",
            "transport": "flight",
            "passengers": None,
        },
        "confidence": 0.7,
        "missing_slots": ["passengers"],
        "pending_slot": "passengers",
        "search_status": "collecting",
        "is_unsafe": False,
        "last_tool_calls": [],
        "raw_message": "Tìm vé máy bay từ Hà Nội đi Đà Nẵng ngày 10/6",
    }

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.post(
            "/api/parse",
            json={"message": "Tôi đi chung với vợ", "session_state": prior_state},
        )

    payload = response.json()["parsed"]

    assert response.status_code == 200
    assert payload["intent"] == "search_trip"
    assert payload["slots"]["passengers"] == 2
    assert payload["missing_slots"] == []
    assert payload["search_status"] == "ready"


@pytest.mark.anyio
async def test_message_endpoint_persists_trip_state_and_nested_assistant_response() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        user = (await client.post("/auth/login", json={"username": "phase4-user"})).json()["user"]
        session = (await client.post(f"/users/{user['id']}/sessions", json={"title": "Agent"})).json()["session"]
        response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé đi Đà Nẵng ngày 10/6"},
        )
        reload_response = await client.get(f"/sessions/{session['id']}")

    payload = response.json()
    persisted_state = reload_response.json()["session"]["current_trip_state"]

    assert response.status_code == 200
    assert payload["assistant_message"]["payload"]["intent"] == "search_trip"
    assert payload["assistant_message"]["payload"]["assistant_response"]["response_type"] == "slot_filling"
    assert payload["response"]["payload"]["pending_slot"] == "departure"
    assert persisted_state["pending_slot"] == "departure"
    assert persisted_state["missing_slots"] == ["departure", "transport", "passengers"]
