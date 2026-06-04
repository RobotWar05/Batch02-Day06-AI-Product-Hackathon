import re
import unicodedata
from datetime import date

from fastapi import HTTPException, status

from app.models.session import CurrentTripState, TripSlots


class AIParserService:
    _CITY_ALIASES: dict[str, str] = {
        "sai gon": "TP.HCM",
        "saigon": "TP.HCM",
        "ho chi minh": "TP.HCM",
        "ho chi minh city": "TP.HCM",
        "hcm": "TP.HCM",
        "tphcm": "TP.HCM",
        "tp hcm": "TP.HCM",
        "tp.hcm": "TP.HCM",
        "thanh pho ho chi minh": "TP.HCM",
        "ha noi": "Hà Nội",
        "hanoi": "Hà Nội",
        "da nang": "Đà Nẵng",
        "danang": "Đà Nẵng",
        "phu quoc": "Phú Quốc",
    }
    _SEARCH_HINTS = (
        "tim",
        "ve",
        "ticket",
        "tickets",
        "find",
        "from",
        "to",
        "di",
        "tau",
        "flight",
        "train",
        "bus",
    )
    _FAQ_HINTS = (
        "hoan tien",
        "refund",
        "doi lich",
        "support",
        "ho tro",
        "chinh sach",
    )
    _REQUIRED_SLOTS = ("departure", "destination", "date", "transport")

    def parse_message(
        self,
        message: str,
        session_state: CurrentTripState | None = None,
    ) -> CurrentTripState:
        raw_message = message.strip()
        normalized = self._normalize_text(raw_message)
        intent = self._detect_intent(normalized)

        base_slots = session_state.slots if session_state else TripSlots()
        extracted_slots, flags = self._extract_slots(raw_message, normalized, base_slots)

        if intent != "search_trip" and session_state and self._has_trip_context(session_state):
            if any(flags.values()):
                intent = "search_trip"
            else:
                return CurrentTripState(
                    intent=session_state.intent,
                    slots=session_state.slots,
                    confidence=session_state.confidence,
                    missing_slots=session_state.missing_slots,
                    raw_message=raw_message,
                )

        if intent == "search_trip":
            missing_slots = [
                slot_name
                for slot_name in self._REQUIRED_SLOTS
                if getattr(extracted_slots, slot_name) in (None, "")
            ]
            confidence = self._score_search_trip(extracted_slots, missing_slots, normalized, flags)
        else:
            extracted_slots = TripSlots()
            missing_slots = []
            confidence = 0.45 if intent == "faq" else 0.2

        return CurrentTripState(
            intent=intent,
            slots=extracted_slots,
            confidence=confidence,
            missing_slots=missing_slots,
            raw_message=raw_message,
        )

    def normalize_slot_updates(self, updates: dict[str, object]) -> TripSlots:
        normalized_updates: dict[str, object] = {}
        for field_name, raw_value in updates.items():
            if field_name in {"departure", "destination"}:
                normalized_updates[field_name] = self._normalize_city_value(field_name, raw_value)
            elif field_name == "transport":
                normalized_updates[field_name] = self._normalize_transport_value(raw_value)
            elif field_name == "date":
                normalized_updates[field_name] = self._normalize_date_value(raw_value)
            elif field_name == "passengers":
                normalized_updates[field_name] = self._normalize_passenger_value(raw_value)
            else:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=f"Unsupported trip state field: {field_name}.",
                )
        return TripSlots(**normalized_updates)

    def _detect_intent(self, normalized: str) -> str:
        if any(hint in normalized for hint in self._FAQ_HINTS):
            return "faq"
        if any(hint in normalized for hint in self._SEARCH_HINTS):
            return "search_trip"
        return "unknown"

    def _extract_slots(
        self,
        raw_message: str,
        normalized: str,
        base_slots: TripSlots,
    ) -> tuple[TripSlots, dict[str, bool]]:
        slots = base_slots.model_copy(deep=True)
        flags = {
            "found_departure": False,
            "found_destination": False,
            "found_date": False,
            "found_transport": False,
            "found_passengers": False,
            "ambiguous_transport": False,
            "ambiguous_destination": False,
            "same_route": False,
            "invalid_passengers": False,
        }

        departure, destination, route_flags = self._extract_route(normalized)
        if departure is not None:
            slots.departure = departure
            flags["found_departure"] = True
        if destination is not None:
            slots.destination = destination
            flags["found_destination"] = True
        flags.update(route_flags)

        parsed_date = self._extract_date(normalized)
        if parsed_date is not None:
            slots.date = parsed_date
            flags["found_date"] = True

        transport, ambiguous_transport = self._extract_transport(normalized)
        if transport is not None:
            slots.transport = transport
            flags["found_transport"] = True
        if ambiguous_transport:
            slots.transport = None
            flags["ambiguous_transport"] = True

        passengers, invalid_passengers = self._extract_passengers(normalized)
        if passengers is not None:
            slots.passengers = passengers
            flags["found_passengers"] = True
        else:
            slots.passengers = slots.passengers or 1
        if invalid_passengers:
            slots.passengers = 1
            flags["invalid_passengers"] = True

        if slots.departure and slots.destination and slots.departure == slots.destination:
            flags["same_route"] = True

        return slots, flags

    def _extract_route(self, normalized: str) -> tuple[str | None, str | None, dict[str, bool]]:
        flags = {
            "ambiguous_destination": False,
            "same_route": False,
        }

        route_patterns = (
            r"(?:tu|from)\s+(?P<departure>.+?)\s+(?:di|toi|to)\s+(?P<destination>.+)",
            r"(?P<departure>.+?)\s+(?:di|toi|to)\s+(?P<destination>.+)",
        )
        for pattern in route_patterns:
            match = re.search(pattern, normalized)
            if not match:
                continue
            departure = self._extract_city_from_fragment(match.group("departure"), prefer_last=True)
            destination_fragment = match.group("destination")
            destination = self._extract_city_from_fragment(destination_fragment, prefer_last=False)
            if departure and destination:
                destinations_found = self._find_cities_in_fragment(destination_fragment)
                if len(destinations_found) > 1:
                    flags["ambiguous_destination"] = True
                return departure, destination, flags

        cities = self._find_cities_in_fragment(normalized)
        if len(cities) >= 2:
            if len(cities) > 2:
                flags["ambiguous_destination"] = True
            return cities[0], cities[1], flags
        if len(cities) == 1 and re.search(r"\b(?:tu|from)\b", normalized):
            return cities[0], None, flags
        if len(cities) == 1 and re.search(r"\b(?:di|toi|to)\b", normalized):
            return None, cities[0], flags
        return None, None, flags

    def _extract_city_from_fragment(self, fragment: str, prefer_last: bool) -> str | None:
        found = self._find_cities_in_fragment(fragment)
        if not found:
            return None
        return found[-1] if prefer_last else found[0]

    def _find_cities_in_fragment(self, fragment: str) -> list[str]:
        hits: list[tuple[int, str]] = []
        normalized_fragment = self._normalize_text(fragment)
        for alias, canonical in sorted(self._CITY_ALIASES.items(), key=lambda item: len(item[0]), reverse=True):
            match = re.search(r"\b" + re.escape(alias) + r"\b", normalized_fragment)
            if match:
                hits.append((match.start(), canonical))

        hits.sort(key=lambda item: item[0])
        deduped: list[str] = []
        for _, canonical in hits:
            if canonical not in deduped:
                deduped.append(canonical)
        return deduped

    def _extract_transport(self, normalized: str) -> tuple[str | None, bool]:
        matches = set()
        transport_patterns = self._transport_patterns()
        for canonical, patterns in transport_patterns.items():
            if any(re.search(pattern, normalized) for pattern in patterns):
                matches.add(canonical)

        if len(matches) > 1:
            return None, True
        if len(matches) == 1:
            return next(iter(matches)), False
        return None, False

    def _extract_date(self, normalized: str) -> str | None:
        iso_match = re.search(r"\b(20\d{2})-(\d{1,2})-(\d{1,2})\b", normalized)
        if iso_match:
            return self._format_valid_date(
                year=int(iso_match.group(1)),
                month=int(iso_match.group(2)),
                day=int(iso_match.group(3)),
            )

        short_match = re.search(r"\b(\d{1,2})[/-](\d{1,2})\b", normalized)
        if not short_match:
            return None

        current_year = date.today().year
        day = int(short_match.group(1))
        month = int(short_match.group(2))
        return self._format_valid_date(year=current_year, month=month, day=day)

    def _extract_passengers(self, normalized: str) -> tuple[int | None, bool]:
        patterns = (
            r"\b(\d+)\s*(?:ve|ticket|tickets)\b",
            r"\b(?:cho|for)\s*(\d+)\s*(?:nguoi|people|persons)\b",
        )
        for pattern in patterns:
            match = re.search(pattern, normalized)
            if not match:
                continue

            passengers = int(match.group(1))
            if passengers <= 0:
                return None, True
            return passengers, False
        return None, False

    def _score_search_trip(
        self,
        slots: TripSlots,
        missing_slots: list[str],
        normalized: str,
        flags: dict[str, bool],
    ) -> float:
        confidence = 0.92

        if missing_slots:
            confidence -= min(0.08 * len(missing_slots), 0.24)
        if flags["ambiguous_transport"]:
            confidence -= 0.25
        if flags["ambiguous_destination"]:
            confidence -= 0.15
        if flags["same_route"]:
            confidence -= 0.18
        if flags["invalid_passengers"]:
            confidence -= 0.12
        if "hoac" in normalized or "or" in normalized:
            confidence -= 0.08
        if slots.departure and slots.destination and slots.departure == slots.destination:
            confidence -= 0.05

        return max(0.2, round(confidence, 2))

    @staticmethod
    def _has_trip_context(state: CurrentTripState) -> bool:
        return any(
            getattr(state.slots, field_name) not in (None, "")
            for field_name in ("departure", "destination", "date", "transport")
        )

    def _normalize_city_value(self, field_name: str, raw_value: object) -> str:
        if not isinstance(raw_value, str) or not raw_value.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"{field_name} must be a non-empty string.",
            )

        matches = self._find_cities_in_fragment(raw_value)
        if len(matches) != 1:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"Invalid {field_name} value.",
            )
        return matches[0]

    def _normalize_transport_value(self, raw_value: object) -> str:
        if not isinstance(raw_value, str) or not raw_value.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="transport must be a non-empty string.",
            )

        normalized = self._normalize_text(raw_value)
        matches = [
            canonical
            for canonical, patterns in self._transport_patterns().items()
            if any(re.search(pattern, normalized) for pattern in patterns)
        ]
        if len(matches) != 1:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid transport value.",
            )
        return matches[0]

    def _normalize_date_value(self, raw_value: object) -> str:
        if not isinstance(raw_value, str) or not raw_value.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="date must be a non-empty string.",
            )

        normalized = self._normalize_text(raw_value)
        parsed_date = self._extract_date(normalized)
        if parsed_date is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid date value.",
            )
        return parsed_date

    def _normalize_passenger_value(self, raw_value: object) -> int:
        if not isinstance(raw_value, int):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="passengers must be an integer.",
            )
        if raw_value <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="passengers must be greater than 0.",
            )
        return raw_value

    @staticmethod
    def _transport_patterns() -> dict[str, tuple[str, ...]]:
        return {
            "train": (r"\btau hoa\b", r"\bxe lua\b", r"\btrain\b"),
            "flight": (r"\bmay bay\b", r"\bflight\b", r"\bplane\b"),
            "bus": (r"\bxe khach\b", r"\bbus\b"),
        }

    @staticmethod
    def _format_valid_date(year: int, month: int, day: int) -> str | None:
        try:
            parsed = date(year, month, day)
        except ValueError:
            return None
        return parsed.isoformat()

    @staticmethod
    def _normalize_text(value: str) -> str:
        normalized = unicodedata.normalize("NFD", value.lower())
        ascii_text = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
        ascii_text = ascii_text.replace("đ", "d")
        return re.sub(r"\s+", " ", ascii_text).strip()


ai_parser_service = AIParserService()
