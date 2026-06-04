import json
from datetime import date
from pathlib import Path
from typing import Any

from app.core.config import FALLBACK_RULES_FILE, RANKING_RULES_FILE, RESPONSE_SCHEMA_FILE, TRIPS_MANIFEST_FILE
from app.models.trip_search import GroupedTrips, ModeComparison, SearchQuery, SearchResultSet


class TripSearchService:
    def __init__(self) -> None:
        self._manifest = self._read_json(TRIPS_MANIFEST_FILE)
        self._ranking_rules = self._read_json(RANKING_RULES_FILE)
        self._fallback_rules = self._read_json(FALLBACK_RULES_FILE)
        self._response_schema = self._read_json(RESPONSE_SCHEMA_FILE)
        self._trips = self._load_trips()

    def search_trips(self, query: SearchQuery) -> SearchResultSet:
        matched, effective_date = self._resolve_candidate_trips(query=query)
        if not matched:
            return SearchResultSet(
                status="no_results",
                query=query.model_dump(mode="json"),
                grouped_results={"flight": GroupedTrips(), "train": GroupedTrips()},
                recommendation={"best_option_id": None, "reason": "", "confidence": 0.0},
                follow_up_question=self._fallback_rules["no_results"]["unsupported_route"],
                message=self._fallback_rules["no_results"]["unsupported_route"],
            )

        ranked = self.rank_options(query=query, trips=matched)
        grouped = self._group_ranked_trips(ranked)
        best_option = ranked[0]
        return SearchResultSet(
            status="ok",
            query=self._build_response_query(query=query, effective_date=effective_date),
            grouped_results=grouped,
            recommendation={
                "best_option_id": best_option["id"],
                "reason": best_option.get("recommendation_reason", ""),
                "confidence": 0.88,
            },
            follow_up_question=None,
            message=self._build_search_message(query=query, effective_date=effective_date, result_count=len(ranked)),
        )

    def compare_modes(self, query: SearchQuery) -> ModeComparison:
        both_modes = query.model_copy(update={"transport_mode": None})
        matched, effective_date = self._resolve_candidate_trips(query=both_modes)
        flights = self.rank_options(query=both_modes.model_copy(update={"transport_mode": "flight"}), trips=[trip for trip in matched if trip["transport_mode"] == "flight"])
        trains = self.rank_options(query=both_modes.model_copy(update={"transport_mode": "train"}), trips=[trip for trip in matched if trip["transport_mode"] == "train"])

        cheapest_flight = flights[0] if flights else None
        cheapest_train = trains[0] if trains else None
        passengers = query.passengers or 1

        flight_total = self._trip_price_value(cheapest_flight, query.trip_type) * passengers if cheapest_flight else None
        train_total = self._trip_price_value(cheapest_train, query.trip_type) * passengers if cheapest_train else None

        cheaper_mode: str | None = None
        price_delta = None
        duration_delta = None
        summary = "Tôi chưa đủ dữ liệu để so sánh máy bay và tàu hỏa cho tuyến này."
        if cheapest_flight and cheapest_train:
            cheaper_mode = "flight" if flight_total < train_total else "train"
            price_delta = abs(flight_total - train_total)
            duration_delta = abs(cheapest_flight["duration_minutes"] - cheapest_train["duration_minutes"])
            summary = (
                f"{'Máy bay' if cheaper_mode == 'flight' else 'Tàu hỏa'} rẻ hơn "
                f"{self.format_currency(price_delta)} cho {passengers} người."
            )

        return ModeComparison(
            query=self._build_response_query(query=query, effective_date=effective_date),
            cheaper_mode=cheaper_mode,
            cheapest_flight=cheapest_flight,
            cheapest_train=cheapest_train,
            flight_total_price_vnd=flight_total,
            train_total_price_vnd=train_total,
            price_delta_vnd=price_delta,
            duration_delta_minutes=duration_delta,
            summary=summary,
        )

    def rank_options(self, query: SearchQuery, trips: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
        ranked = list(trips if trips is not None else self._filter_trips(query=query))
        if not ranked:
            return []

        priority = query.priority
        if query.preferred_provider:
            priority = "provider_first"

        if priority == "cheap":
            ranked.sort(key=lambda trip: (self._trip_price_value(trip, query.trip_type), trip["display_rank"]))
            return ranked
        if priority == "fast":
            ranked.sort(key=lambda trip: (trip["duration_minutes"], self._trip_price_value(trip, query.trip_type)))
            return ranked
        if priority == "provider_first":
            ranked.sort(
                key=lambda trip: (
                    0 if trip["provider"] == query.preferred_provider else 1,
                    self._trip_price_value(trip, query.trip_type),
                    trip["duration_minutes"],
                )
            )
            return ranked
        if priority == "premium":
            return sorted(ranked, key=lambda trip: self._weighted_score(trip, "premium"), reverse=True)
        return sorted(ranked, key=lambda trip: self._weighted_score(trip, "balanced"), reverse=True)

    @staticmethod
    def format_currency(value: int | None) -> str:
        if value is None:
            return "0đ"
        return f"{value:,.0f}đ".replace(",", ".")

    @staticmethod
    def format_duration(minutes: int | None) -> str:
        if minutes is None:
            return "0m"
        hours, remainder = divmod(minutes, 60)
        return f"{hours}h {remainder}m" if hours else f"{remainder}m"

    def _filter_trips(self, query: SearchQuery) -> list[dict[str, Any]]:
        matched: list[dict[str, Any]] = []
        for trip in self._trips:
            if query.origin and trip["origin"] != query.origin:
                continue
            if query.destination and trip["destination"] != query.destination:
                continue
            if query.date and trip["date"] != query.date:
                continue
            if query.transport_mode and trip["transport_mode"] != query.transport_mode:
                continue
            if query.preferred_provider and trip["provider"] != query.preferred_provider and query.priority == "provider_first":
                continue
            if query.trip_type not in trip["trip_type_supported"]:
                continue
            matched.append(trip)
        return matched

    def _resolve_candidate_trips(self, query: SearchQuery) -> tuple[list[dict[str, Any]], str | None]:
        matched = self._filter_trips(query=query)
        if matched or not query.date:
            return matched, query.date

        same_route_query = query.model_copy(update={"date": None})
        same_route_trips = self._filter_trips(query=same_route_query)
        if not same_route_trips:
            return [], query.date

        effective_date = self._closest_available_date(requested_date=query.date, trips=same_route_trips)
        if effective_date is None:
            return [], query.date

        fallback_query = query.model_copy(update={"date": effective_date})
        return self._filter_trips(query=fallback_query), effective_date

    @staticmethod
    def _closest_available_date(requested_date: str, trips: list[dict[str, Any]]) -> str | None:
        available_dates = sorted({trip["date"] for trip in trips if trip.get("date")})
        if not available_dates:
            return None
        return min(
            available_dates,
            key=lambda candidate: (abs(TripSearchService._date_distance(candidate, requested_date)), candidate),
        )

    @staticmethod
    def _date_distance(candidate: str, requested: str) -> int:
        return (date.fromisoformat(candidate) - date.fromisoformat(requested)).days

    @staticmethod
    def _build_response_query(query: SearchQuery, effective_date: str | None) -> dict[str, Any]:
        payload = query.model_dump(mode="json")
        payload["requested_date"] = query.date
        payload["effective_date"] = effective_date
        payload["date_fallback_used"] = bool(query.date and effective_date and effective_date != query.date)
        if effective_date is not None:
            payload["date"] = effective_date
        return payload

    def _build_search_message(self, query: SearchQuery, effective_date: str | None, result_count: int) -> str:
        if query.date and effective_date and effective_date != query.date:
            return (
                f"Ngày {query.date} chưa có chuyến phù hợp. "
                f"Tôi đang hiển thị {result_count} lựa chọn gần nhất vào ngày {effective_date}."
            )
        return f"Tôi đã tìm thấy {result_count} lựa chọn phù hợp cho hành trình của bạn."

    def _group_ranked_trips(self, ranked: list[dict[str, Any]]) -> dict[str, GroupedTrips]:
        grouped = {"flight": GroupedTrips(), "train": GroupedTrips()}
        for mode in ("flight", "train"):
            mode_trips = [trip for trip in ranked if trip["transport_mode"] == mode]
            visible_count = self._ranking_rules["default_visibility"][mode]
            grouped[mode] = GroupedTrips(
                default=[trip for trip in mode_trips if trip.get("default_visible", False)][:visible_count],
                see_more=[trip for trip in mode_trips if not trip.get("default_visible", False)],
            )
        return grouped

    def _weighted_score(self, trip: dict[str, Any], strategy_name: str) -> float:
        weights = self._ranking_rules["strategies"][strategy_name]["weights"]
        return sum(float(trip.get(field_name, 0)) * float(weight) for field_name, weight in weights.items())

    @staticmethod
    def _trip_price_value(trip: dict[str, Any] | None, trip_type: str) -> int:
        if trip is None:
            return 0
        return int(trip["round_trip_price_vnd"] if trip_type == "round_trip" else trip["one_way_price_vnd"])

    def _load_trips(self) -> list[dict[str, Any]]:
        manifest_root = TRIPS_MANIFEST_FILE.parent
        trips: list[dict[str, Any]] = []
        for group in self._manifest["files"].values():
            for relative_path in group.values():
                trips.extend(self._read_json(manifest_root / relative_path))
        return trips

    @staticmethod
    def _read_json(path: Path) -> Any:
        with path.open("r", encoding="utf-8") as file:
            return json.load(file)


trip_search_service = TripSearchService()
