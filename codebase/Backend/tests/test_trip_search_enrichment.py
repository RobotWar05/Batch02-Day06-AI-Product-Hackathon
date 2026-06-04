from app.models.trip_search import SearchQuery
from app.services.slot_extractor_service import slot_extractor_service
from app.services.trip_search_service import trip_search_service


def test_search_trips_falls_back_to_nearest_available_date():
    result = trip_search_service.search_trips(
        SearchQuery(
            origin="Hà Nội",
            destination="TP.HCM",
            date="2026-06-20",
            transport_mode="flight",
            passengers=2,
        )
    )

    assert result.status == "ok"
    assert result.query["requested_date"] == "2026-06-20"
    assert result.query["effective_date"] == "2026-06-09"
    assert result.query["date_fallback_used"] is True
    assert "2026-06-09" in result.message
    assert result.grouped_results["flight"].default


def test_compare_modes_uses_fallback_date_for_existing_route():
    result = trip_search_service.compare_modes(
        SearchQuery(
            origin="Hà Nội",
            destination="Đà Nẵng",
            date="2026-06-20",
            passengers=1,
        )
    )

    assert result.query["requested_date"] == "2026-06-20"
    assert result.query["effective_date"] == "2026-06-09"
    assert result.query["date_fallback_used"] is True
    assert result.cheapest_flight is not None
    assert result.cheapest_train is not None


def test_slot_extractor_supports_flexible_date_requests():
    extracted = slot_extractor_service.extract_search_state(
        "Từ Hà Nội đi Đà Nẵng ngày nào cũng được, đi máy bay cho 2 người"
    )

    assert extracted.slots.departure == "Hà Nội"
    assert extracted.slots.destination == "Đà Nẵng"
    assert extracted.slots.date == "2026-06-05"
    assert extracted.slots.transport == "flight"
    assert extracted.slots.passengers == 2
    assert extracted.pending_slot is None


def test_slot_extractor_supports_more_popular_vietnam_locations():
    extracted = slot_extractor_service.extract_search_state(
        "Từ Hải Phòng đi Quy Nhơn ngày 07/06 bằng máy bay"
    )

    assert extracted.slots.departure == "Hải Phòng"
    assert extracted.slots.destination == "Quy Nhơn"
    assert extracted.slots.date == "2026-06-07"
