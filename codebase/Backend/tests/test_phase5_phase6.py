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
async def test_missing_multiple_slots_asks_one_question_at_a_time_in_fixed_order() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "slot-order")

        first = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé đi Đà Nẵng"},
        )
        second = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Từ Hà Nội"},
        )
        third = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Ngày 10/6"},
        )
        fourth = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Máy bay"},
        )

    assert first.json()["response"]["payload"]["pending_slot"] == "departure"
    assert second.json()["response"]["payload"]["pending_slot"] == "date"
    assert third.json()["response"]["payload"]["pending_slot"] == "transport"
    assert fourth.json()["response"]["payload"]["pending_slot"] == "passengers"
    assert fourth.json()["response"]["message"] == "Bạn đi bao nhiêu người?"


@pytest.mark.anyio
async def test_passenger_follow_up_extracts_relational_phrase_and_executes_search() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "passenger-follow-up")
        await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé máy bay từ Hà Nội đi Đà Nẵng ngày 6/6"},
        )
        response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tôi đi chung với vợ"},
        )

    payload = response.json()

    assert response.status_code == 200
    assert payload["response"]["response_type"] == "search_results"
    assert payload["session"]["current_trip_state"]["slots"]["passengers"] == 2
    assert payload["session"]["current_trip_state"]["search_status"] == "searched"
    assert payload["response"]["payload"]["status"] == "ok"
    assert payload["response"]["payload"]["grouped_results"]["flight"]["default"]


@pytest.mark.anyio
async def test_new_route_message_clears_stale_slots_and_returns_slot_filling() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "route-reset")
        await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm 2 vé tàu hỏa từ Hà Nội đi Đà Nẵng ngày 6/6"},
        )
        response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Vé máy bay từ TP.HCM tới Hà Nội"},
        )

    payload = response.json()

    assert response.status_code == 200
    assert payload["response"]["response_type"] == "slot_filling"
    assert payload["response"]["payload"]["pending_slot"] == "date"
    assert payload["session"]["current_trip_state"]["slots"] == {
        "departure": "TP.HCM",
        "destination": "Hà Nội",
        "date": None,
        "transport": "flight",
        "passengers": None,
    }
    assert payload["session"]["current_trip_state"]["missing_slots"] == ["date", "passengers"]


@pytest.mark.anyio
async def test_patch_trip_state_keeps_other_values_and_returns_results_when_complete() -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "patch-complete")
        await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé tàu hỏa đi Đà Nẵng ngày 6/6"},
        )
        await client.patch(
            f"/sessions/{session['id']}/trip-state",
            json={"updates": {"departure": "Hà Nội"}},
        )
        response = await client.patch(
            f"/sessions/{session['id']}/trip-state",
            json={"updates": {"passengers": 3}},
        )

    payload = response.json()

    assert response.status_code == 200
    assert payload["trip_state"]["slots"] == {
        "departure": "Hà Nội",
        "destination": "Đà Nẵng",
        "date": "2026-06-06",
        "transport": "train",
        "passengers": 3,
    }
    assert payload["response"]["response_type"] == "search_results"
    assert payload["response"]["payload"]["status"] == "ok"


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
async def test_invalid_patch_updates_return_422(updates: dict[str, object], expected_detail: str | None) -> None:
    reset_data_files()

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        session = await create_user_and_session(client, "invalid-patch")
        await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm vé máy bay từ Hà Nội đi Đà Nẵng ngày 6/6"},
        )
        response = await client.patch(
            f"/sessions/{session['id']}/trip-state",
            json={"updates": updates},
        )

    assert response.status_code == 422
    if expected_detail is not None:
        assert response.json()["detail"] == expected_detail
