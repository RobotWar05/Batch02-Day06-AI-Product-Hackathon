import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.auth_service import auth_service
from app.services.session_service import session_service


def reset_data_files() -> None:
    auth_service.user_store.write([])
    session_service.session_store.write([])


@pytest.mark.anyio
async def test_phase4_parse_full_query_returns_normalized_structured_slots() -> None:
    reset_data_files()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post(
            "/api/parse",
            json={"message": "Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6"},
        )

    payload = response.json()["parsed"]

    assert response.status_code == 200
    assert set(payload) == {"intent", "slots", "confidence", "missing_slots", "raw_message"}
    assert payload["intent"] == "search_trip"
    assert payload["slots"] == {
        "departure": "TP.HCM",
        "destination": "Đà Nẵng",
        "date": "2026-06-10",
        "transport": "train",
        "passengers": 2,
    }
    assert payload["missing_slots"] == []
    assert payload["confidence"] >= 0.85


@pytest.mark.anyio
async def test_phase4_parse_missing_slots_and_non_travel_intents_follow_contract() -> None:
    reset_data_files()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        missing_response = await client.post(
            "/api/parse",
            json={"message": "Tìm vé đi Đà Nẵng ngày 10/6"},
        )
        faq_response = await client.post(
            "/api/parse",
            json={"message": "Trip.com có hỗ trợ hoàn tiền không?"},
        )

    missing_payload = missing_response.json()["parsed"]
    faq_payload = faq_response.json()["parsed"]

    assert missing_response.status_code == 200
    assert missing_payload["intent"] == "search_trip"
    assert missing_payload["slots"]["departure"] is None
    assert missing_payload["slots"]["destination"] == "Đà Nẵng"
    assert missing_payload["slots"]["date"] == "2026-06-10"
    assert missing_payload["slots"]["transport"] is None
    assert missing_payload["slots"]["passengers"] == 1
    assert set(missing_payload["missing_slots"]) == {"departure", "transport"}

    assert faq_response.status_code == 200
    assert faq_payload["intent"] == "faq"
    assert faq_payload["slots"] == {
        "departure": None,
        "destination": None,
        "date": None,
        "transport": None,
        "passengers": 1,
    }
    assert faq_payload["missing_slots"] == []


@pytest.mark.anyio
@pytest.mark.parametrize(
    ("message", "expected_departure", "expected_destination", "expected_transport"),
    [
        ("Tim ve tau hoa tu Sai Gon di Da Nang ngay 10/6", "TP.HCM", "Đà Nẵng", "train"),
        ("Find 2 train tickets from Sai Gon to Da Nang on 10/6", "TP.HCM", "Đà Nẵng", "train"),
        ("Tìm vé máy bay từ Hà Nội đi Phú Quốc ngày 15/6 cho 3 người", "Hà Nội", "Phú Quốc", "flight"),
    ],
)
async def test_phase4_parse_normalizes_language_date_and_passenger_variants(
    message: str,
    expected_departure: str,
    expected_destination: str,
    expected_transport: str,
) -> None:
    reset_data_files()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post("/api/parse", json={"message": message})

    payload = response.json()["parsed"]

    assert response.status_code == 200
    assert payload["intent"] == "search_trip"
    assert payload["slots"]["departure"] == expected_departure
    assert payload["slots"]["destination"] == expected_destination
    assert payload["slots"]["transport"] == expected_transport
    assert payload["slots"]["date"] in {"2026-06-10", "2026-06-15"}
    assert payload["slots"]["passengers"] in {1, 2, 3}


@pytest.mark.anyio
async def test_phase4_parse_uses_session_state_for_follow_up_and_corrections() -> None:
    reset_data_files()

    previous_state = {
        "intent": "search_trip",
        "slots": {
            "departure": None,
            "destination": "Đà Nẵng",
            "date": "2026-06-10",
            "transport": "train",
            "passengers": 1,
        },
        "confidence": 0.7,
        "missing_slots": ["departure"],
        "raw_message": "Tìm vé đi Đà Nẵng ngày 10/6",
    }

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        fill_response = await client.post(
            "/api/parse",
            json={"message": "Từ Sài Gòn", "session_state": previous_state},
        )
        correction_response = await client.post(
            "/api/parse",
            json={
                "message": "Không, tôi muốn đi tàu hỏa",
                "session_state": {
                    **previous_state,
                    "slots": {
                        "departure": "Hà Nội",
                        "destination": "Đà Nẵng",
                        "date": "2026-06-10",
                        "transport": "flight",
                        "passengers": 1,
                    },
                    "missing_slots": [],
                },
            },
        )

    fill_payload = fill_response.json()["parsed"]
    correction_payload = correction_response.json()["parsed"]

    assert fill_response.status_code == 200
    assert fill_payload["slots"] == {
        "departure": "TP.HCM",
        "destination": "Đà Nẵng",
        "date": "2026-06-10",
        "transport": "train",
        "passengers": 1,
    }
    assert fill_payload["missing_slots"] == []

    assert correction_response.status_code == 200
    assert correction_payload["slots"]["departure"] == "Hà Nội"
    assert correction_payload["slots"]["destination"] == "Đà Nẵng"
    assert correction_payload["slots"]["date"] == "2026-06-10"
    assert correction_payload["slots"]["transport"] == "train"


@pytest.mark.anyio
async def test_phase4_message_endpoint_persists_current_trip_state_and_parser_payload() -> None:
    reset_data_files()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        user = (
            await client.post("/auth/login", json={"username": "phase4", "password": "x"})
        ).json()["user"]
        session = (
            await client.post(f"/users/{user['id']}/sessions", json={"title": "Phase 4"})
        ).json()["session"]

        post_response = await client.post(
            f"/sessions/{session['id']}/messages",
            json={"content": "Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6"},
        )
        reload_response = await client.get(f"/sessions/{session['id']}")

    post_payload = post_response.json()
    reloaded_session = reload_response.json()["session"]

    assert post_response.status_code == 200
    assert post_payload["response"]["response_type"] == "trip_widget"
    assert post_payload["response"]["next_action"] == "show_widget"
    assert post_payload["assistant_message"]["payload"]["intent"] == "search_trip"
    assert post_payload["assistant_message"]["payload"]["missing_slots"] == []
    assert post_payload["assistant_message"]["payload"]["slots"]["transport"] == "train"
    assert reloaded_session["current_trip_state"]["slots"] == {
        "departure": "TP.HCM",
        "destination": "Đà Nẵng",
        "date": "2026-06-10",
        "transport": "train",
        "passengers": 2,
    }
    assert len(reloaded_session["messages"]) == 2


@pytest.mark.anyio
async def test_phase4_parse_handles_ambiguous_transport_by_lowering_confidence() -> None:
    reset_data_files()

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as client:
        response = await client.post(
            "/api/parse",
            json={"message": "Tìm vé máy bay hoặc tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6"},
        )

    payload = response.json()["parsed"]

    assert response.status_code == 200
    assert payload["intent"] == "search_trip"
    assert payload["slots"]["transport"] is None
    assert "transport" in payload["missing_slots"]
    assert payload["confidence"] < 0.8
