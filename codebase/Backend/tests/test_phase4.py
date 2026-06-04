import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.models.session import CurrentTripState, TripSlots
from app.services import slot_extractor_service as slot_module
from app.services.auth_service import auth_service
from app.services.intent_classifier_service import IntentClassification, intent_classifier_service
from app.services.slot_extractor_service import slot_extractor_service
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
    intent_classifier_service._api_key = ""
    slot_extractor_service._api_key = ""

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
    assert any(event["event"] == "slot_extractor.mode" for event in payload["debug_trace"])
    assert any(event.get("mode") == "heuristic" for event in payload["debug_trace"])


@pytest.mark.anyio
async def test_parse_prefers_llm_intent_for_route_comparison_queries(monkeypatch: pytest.MonkeyPatch) -> None:
    reset_data_files()

    monkeypatch.setattr(
        intent_classifier_service,
        "_classify_with_gemini",
        lambda message, session_state: IntentClassification(intent="faq", confidence=0.97),
    )
    monkeypatch.setattr(intent_classifier_service, "_api_key", "test-key")

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as client:
        response = await client.post(
            "/api/parse",
            json={"message": "Đi từ Sài Gòn Đà Nẵng thì phương tiện nào tiện hơn"},
        )

    payload = response.json()["parsed"]

    assert response.status_code == 200
    assert payload["intent"] == "faq"
    assert payload["slots"]["departure"] == "TP.HCM"
    assert payload["slots"]["destination"] == "Đà Nẵng"
    assert payload["search_status"] == "not_applicable"


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


def test_slot_extractor_uses_targeted_vietnamese_prompt_for_pending_slot(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    captured: dict[str, object] = {}

    def fake_extract_with_gemini(
        *,
        message: str,
        base_slots: TripSlots,
        pending_slot: str | None,
        prompt: str,
        system_prompt: str,
        target_slot: str | None,
    ) -> TripSlots:
        captured["message"] = message
        captured["base_slots"] = base_slots.model_dump(mode="json")
        captured["pending_slot"] = pending_slot
        captured["prompt"] = prompt
        captured["system_prompt"] = system_prompt
        captured["target_slot"] = target_slot
        return TripSlots(destination="TP.HCM")

    monkeypatch.setattr(slot_module, "HAS_GEMINI", True)
    monkeypatch.setattr(slot_extractor_service, "_api_key", "test-key")
    monkeypatch.setattr(slot_extractor_service, "_extract_with_gemini", fake_extract_with_gemini)

    session_state = CurrentTripState(
        intent="search_trip",
        slots=TripSlots(departure="Hà Nội", date="2026-06-05", transport="flight", passengers=1),
        confidence=0.8,
        missing_slots=["destination"],
        pending_slot="destination",
        search_status="collecting",
        raw_message="Tôi cần đi đâu đó",
    )

    extracted = slot_extractor_service.extract_search_state(
        message="Sài Gòn nhé",
        session_state=session_state,
    )

    assert captured["target_slot"] == "destination"
    assert captured["pending_slot"] == "destination"
    assert "slot_dang_can_dien: destination" in str(captured["prompt"])
    assert "Ưu tiên cao nhất là trích xuất đúng `destination`" in str(captured["prompt"])
    assert "Bạn đang ở chế độ follow-up để điền riêng slot `destination`." in str(captured["system_prompt"])
    assert "Sài Gòn" in str(captured["system_prompt"])
    assert extracted.slots.destination == "TP.HCM"
    assert extracted.pending_slot is None


def test_slot_extractor_uses_full_prompt_when_no_pending_slot(monkeypatch: pytest.MonkeyPatch) -> None:
    captured: dict[str, object] = {}

    def fake_extract_with_gemini(
        *,
        message: str,
        base_slots: TripSlots,
        pending_slot: str | None,
        prompt: str,
        system_prompt: str,
        target_slot: str | None,
    ) -> TripSlots:
        captured["prompt"] = prompt
        captured["system_prompt"] = system_prompt
        captured["target_slot"] = target_slot
        return TripSlots(departure="Hà Nội", destination="Đà Nẵng", date="2026-06-10")

    monkeypatch.setattr(slot_module, "HAS_GEMINI", True)
    monkeypatch.setattr(slot_extractor_service, "_api_key", "test-key")
    monkeypatch.setattr(slot_extractor_service, "_extract_with_gemini", fake_extract_with_gemini)

    extracted = slot_extractor_service.extract_search_state(
        message="Tôi muốn bay từ Hà Nội đi Đà Nẵng ngày 10/6",
        session_state=None,
    )

    assert captured["target_slot"] is None
    assert "Bạn là bộ trích xuất slot cho trợ lý tìm chuyến đi." in str(captured["system_prompt"])
    assert "Ngữ cảnh phiên hiện tại:" in str(captured["prompt"])
    assert extracted.slots.departure == "Hà Nội"
    assert extracted.slots.destination == "Đà Nẵng"
