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
async def test_phase5_full_slots_return_trip_widget_response() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "phase5-widget")
        response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6"},
        )

    payload = response.json()

    assert response.status_code == 200
    assert payload["response"]["response_type"] == "trip_widget"
    assert payload["response"]["next_action"] == "show_widget"
    assert payload["response"]["payload"]["departure"] == "TP.HCM"
    assert payload["response"]["payload"]["transport"] == "train"
    assert payload["response"]["payload"]["editable_fields"] == [
        "departure",
        "destination",
        "date",
        "transport",
        "passengers",
    ]


@pytest.mark.anyio
async def test_phase5_missing_slots_return_slot_filling_with_questions_and_options() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "phase5-slot-fill")
        response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé đi Đà Nẵng ngày 10/6"},
        )
        reload_response = await client.get(f"/sessions/{session['id']}")

    payload = response.json()
    questions = payload["response"]["payload"]["questions"]

    assert response.status_code == 200
    assert payload["response"]["response_type"] == "slot_filling"
    assert payload["response"]["next_action"] == "ask_follow_up"
    assert payload["response"]["payload"]["missing_slots"] == ["departure", "transport"]
    assert questions[0]["slot"] == "departure"
    assert "TP.HCM" in questions[0]["options"]
    assert questions[1]["slot"] == "transport"
    assert "Tàu hỏa" in questions[1]["options"]
    assert reload_response.json()["session"]["current_trip_state"]["missing_slots"] == [
        "departure",
        "transport",
    ]


@pytest.mark.anyio
async def test_phase5_low_confidence_state_returns_confirm_low_confidence() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "phase5-confidence")
        response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé tàu hỏa từ Hà Nội đi Hà Nội ngày 10/6"},
        )

    payload = response.json()

    assert response.status_code == 200
    assert payload["response"]["response_type"] == "confirm_low_confidence"
    assert payload["response"]["next_action"] == "confirm_low_confidence"
    assert payload["response"]["payload"]["slots"]["departure"] == "Hà Nội"
    assert payload["response"]["payload"]["slots"]["destination"] == "Hà Nội"


@pytest.mark.anyio
async def test_phase6_update_transport_and_date_persist_state() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "phase6-update-transport")
        await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé máy bay từ Sài Gòn đi Đà Nẵng ngày 10/6"},
        )
        transport_response = await client.patch(
            f"/sessions/{session['id']}/trip-state",
            json={"updates": {"transport": "train"}},
        )
        date_response = await client.patch(
            f"/sessions/{session['id']}/trip-state",
            json={"updates": {"date": "2026-06-11"}},
        )
        reload_response = await client.get(f"/sessions/{session['id']}")

    assert transport_response.status_code == 200
    assert transport_response.json()["trip_state"]["slots"]["transport"] == "train"
    assert date_response.status_code == 200
    assert date_response.json()["trip_state"]["slots"]["date"] == "2026-06-11"
    assert reload_response.json()["session"]["current_trip_state"]["slots"]["transport"] == "train"
    assert reload_response.json()["session"]["current_trip_state"]["slots"]["date"] == "2026-06-11"


@pytest.mark.anyio
async def test_phase6_update_multiple_slots_and_normalize_quick_options() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "phase6-normalize")
        await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé đi Đà Nẵng ngày 10/6"},
        )
        response = await client.patch(
            f"/sessions/{session['id']}/trip-state",
            json={"updates": {"departure": "Sài Gòn", "transport": "Tàu hỏa"}},
        )

    payload = response.json()

    assert response.status_code == 200
    assert payload["trip_state"]["slots"]["departure"] == "TP.HCM"
    assert payload["trip_state"]["slots"]["transport"] == "train"
    assert payload["response"]["response_type"] == "trip_widget"
    assert payload["response"]["next_action"] == "ready_to_search"


@pytest.mark.anyio
async def test_phase6_partial_update_keeps_slot_filling_when_state_still_incomplete() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "phase6-partial")
        await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé đi Đà Nẵng ngày 10/6"},
        )
        response = await client.patch(
            f"/sessions/{session['id']}/trip-state",
            json={"updates": {"departure": "TP.HCM"}},
        )

    payload = response.json()

    assert response.status_code == 200
    assert payload["response"]["response_type"] == "slot_filling"
    assert payload["response"]["payload"]["missing_slots"] == ["transport"]


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("updates", "expected_detail"),
    [
        ({"transport": "spaceship"}, "Invalid transport value."),
        ({"date": "abc"}, "Invalid date value."),
        ({"passengers": 0}, None),
        ({"hotel": "abc"}, None),
    ],
)
async def test_phase6_invalid_updates_return_422_and_do_not_change_state(
    updates: dict[str, object],
    expected_detail: str | None,
) -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "phase6-invalid")
        await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé máy bay từ Sài Gòn đi Đà Nẵng ngày 10/6"},
        )
        response = await client.patch(
            f"/sessions/{session['id']}/trip-state",
            json={"updates": updates},
        )
        reload_response = await client.get(f"/sessions/{session['id']}")

    assert response.status_code == 422
    if expected_detail is not None:
        assert response.json()["detail"] == expected_detail
    assert reload_response.json()["session"]["current_trip_state"]["slots"]["transport"] == "flight"
    assert reload_response.json()["session"]["current_trip_state"]["slots"]["date"] == "2026-06-10"
    assert reload_response.json()["session"]["current_trip_state"]["slots"]["passengers"] == 1


@pytest.mark.anyio
async def test_phase6_empty_update_fake_session_and_missing_trip_state_follow_contract() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        empty_session = await create_user_and_session(client, "phase6-empty")
        blank_update = await client.patch(
            f"/sessions/{empty_session['id']}/trip-state",
            json={"updates": {}},
        )
        missing_session = await client.patch(
            "/sessions/not-a-real-session/trip-state",
            json={"updates": {"transport": "train"}},
        )
        missing_trip_state = await client.patch(
            f"/sessions/{empty_session['id']}/trip-state",
            json={"updates": {"transport": "train"}},
        )

    assert blank_update.status_code == 422
    assert missing_session.status_code == 404
    assert missing_trip_state.status_code == 400
    assert missing_trip_state.json()["detail"] == "Session does not have an active trip state."


@pytest.mark.anyio
async def test_phase6_multiple_corrections_keep_all_changes() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "phase6-multi")
        await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé máy bay đi Đà Nẵng ngày 10/6"},
        )
        await client.patch(
            f"/sessions/{session['id']}/trip-state",
            json={"updates": {"departure": "TP.HCM"}},
        )
        await client.patch(
            f"/sessions/{session['id']}/trip-state",
            json={"updates": {"transport": "Tàu hỏa"}},
        )
        final_response = await client.patch(
            f"/sessions/{session['id']}/trip-state",
            json={"updates": {"passengers": 3, "date": "2026-06-11"}},
        )
        reload_response = await client.get(f"/sessions/{session['id']}")

    final_slots = final_response.json()["trip_state"]["slots"]
    reloaded_slots = reload_response.json()["session"]["current_trip_state"]["slots"]

    assert final_response.status_code == 200
    assert final_slots == {
        "departure": "TP.HCM",
        "destination": "Đà Nẵng",
        "date": "2026-06-11",
        "transport": "train",
        "passengers": 3,
    }
    assert reloaded_slots == final_slots
    assert final_response.json()["response"]["next_action"] == "ready_to_search"
