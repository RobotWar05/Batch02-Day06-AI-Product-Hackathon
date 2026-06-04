import os
import re
import unicodedata
from dataclasses import dataclass
from datetime import date, timedelta

from fastapi import HTTPException, status

from app.models.session import CurrentTripState, TripSlots

try:
    import google.generativeai as genai

    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False


REFERENCE_DATE = date(2026, 6, 4)
ASK_ORDER = ("departure", "destination", "date", "transport", "passengers")


@dataclass(slots=True)
class SlotExtractionResult:
    slots: TripSlots
    missing_slots: list[str]
    pending_slot: str | None
    confidence: float


class SlotExtractorService:
    _CITY_ALIASES: dict[str, str] = {
        "ha noi": "Hà Nội",
        "hn": "Hà Nội",
        "hanoi": "Hà Nội",
        "sai gon": "TP.HCM",
        "saigon": "TP.HCM",
        "sg": "TP.HCM",
        "tp hcm": "TP.HCM",
        "tphcm": "TP.HCM",
        "tp.hcm": "TP.HCM",
        "ho chi minh": "TP.HCM",
        "da nang": "Đà Nẵng",
        "danang": "Đà Nẵng",
        "dn": "Đà Nẵng",
        "phu quoc": "Phú Quốc",
        "pq": "Phú Quốc",
        "nha trang": "Nha Trang",
        "nt": "Nha Trang",
    }
    _PASSENGER_WORDS: dict[str, int] = {
        "mot": 1,
        "một": 1,
        "hai": 2,
        "ba": 3,
        "bon": 4,
        "bốn": 4,
    }

    def __init__(self) -> None:
        self._api_key = os.getenv("GEMINI_API_KEY", "")
        if HAS_GEMINI and self._api_key:
            genai.configure(api_key=self._api_key)

    def extract_search_state(
        self,
        message: str,
        session_state: CurrentTripState | None = None,
    ) -> SlotExtractionResult:
        existing_slots = session_state.slots.model_copy(deep=True) if session_state else TripSlots()
        normalized = self._normalize_text(message)
        pending_slot = session_state.pending_slot if session_state else None
        route_slots = self._extract_route(normalized)
        route_changed = self._route_changed(existing_slots=existing_slots, route_slots=route_slots)
        base_slots = TripSlots() if route_changed else existing_slots.model_copy(deep=True)

        if HAS_GEMINI and self._api_key:
            llm_slots = self._extract_with_gemini(
                message=message,
                base_slots=base_slots,
                pending_slot=None if route_changed else pending_slot,
            )
            if llm_slots is not None:
                base_slots = llm_slots

        if pending_slot and not route_changed:
            extracted_value = self._extract_pending_slot_value(pending_slot=pending_slot, message=message, normalized=normalized)
            if extracted_value is not None:
                setattr(base_slots, pending_slot, extracted_value)

        if route_slots["departure"] is not None:
            base_slots.departure = route_slots["departure"]
        if route_slots["destination"] is not None:
            base_slots.destination = route_slots["destination"]

        parsed_date = self._extract_date(normalized)
        if parsed_date is not None:
            base_slots.date = parsed_date

        parsed_transport = self._extract_transport(normalized)
        if parsed_transport is not None:
            base_slots.transport = parsed_transport

        parsed_passengers = self._extract_passengers(normalized)
        if parsed_passengers is not None:
            base_slots.passengers = parsed_passengers

        missing_slots = [slot_name for slot_name in ASK_ORDER if getattr(base_slots, slot_name) in (None, "")]
        next_pending = missing_slots[0] if missing_slots else None
        confidence = self._score_confidence(missing_slots=missing_slots, normalized=normalized)
        return SlotExtractionResult(
            slots=base_slots,
            missing_slots=missing_slots,
            pending_slot=next_pending,
            confidence=confidence,
        )

    def extract_faq_slots(
        self,
        message: str,
        session_state: CurrentTripState | None = None,
    ) -> TripSlots:
        extracted = self.extract_search_state(message=message, session_state=session_state)
        if extracted.slots.passengers is None:
            extracted.slots.passengers = 1
        return extracted.slots

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

    def _extract_pending_slot_value(self, pending_slot: str, message: str, normalized: str) -> object | None:
        if pending_slot in {"departure", "destination"}:
            cities = self._find_cities(normalized)
            return cities[0] if cities else None
        if pending_slot == "date":
            return self._extract_date(normalized)
        if pending_slot == "transport":
            return self._extract_transport(normalized)
        if pending_slot == "passengers":
            return self._extract_passengers(normalized)
        return None

    def _extract_route(self, normalized: str) -> dict[str, str | None]:
        route = {"departure": None, "destination": None}
        route_patterns = (
            r"\btu\s+(?P<departure>.+?)\s+(?:di|den|toi)\s+(?P<destination>.+)",
            r"\b(?P<departure>ha noi|hanoi|hn|sai gon|saigon|sg|tp hcm|tphcm|ho chi minh|da nang|danang|dn|phu quoc|pq|nha trang|nt)\s+(?:di|den|toi)\s+(?P<destination>.+)",
        )
        for pattern in route_patterns:
            match = re.search(pattern, normalized)
            if not match:
                continue
            departure_hits = self._find_cities(match.group("departure"))
            destination_hits = self._find_cities(match.group("destination"))
            if departure_hits and destination_hits:
                route["departure"] = departure_hits[0]
                route["destination"] = destination_hits[0]
                return route

        cities = self._find_cities(normalized)
        if len(cities) >= 2 and any(token in normalized for token in ("di", "ve", "may bay", "tau", "dat", "tim")):
            route["departure"] = cities[0]
            route["destination"] = cities[1]
        elif len(cities) == 1:
            if re.search(r"\b(?:tu|from|khoi hanh)\b", normalized):
                route["departure"] = cities[0]
            else:
                route["destination"] = cities[0]
        return route

    def _extract_date(self, normalized: str) -> str | None:
        if "hom nay" in normalized:
            return REFERENCE_DATE.isoformat()
        if "ngay mai" in normalized or re.search(r"\bmai\b", normalized):
            return (REFERENCE_DATE + timedelta(days=1)).isoformat()
        if "ngay kia" in normalized or "ngay mot" in normalized or "mốt" in normalized:
            return (REFERENCE_DATE + timedelta(days=2)).isoformat()
        if "cuoi tuan nay" in normalized:
            return date(2026, 6, 6).isoformat()
        if "cuoi tuan sau" in normalized:
            return date(2026, 6, 13).isoformat()

        iso_match = re.search(r"\b(20\d{2})-(\d{1,2})-(\d{1,2})\b", normalized)
        if iso_match:
            return self._format_date(int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3)))

        short_match = re.search(r"\b(\d{1,2})[/-](\d{1,2})(?:[/-](20\d{2}))?\b", normalized)
        if short_match:
            day = int(short_match.group(1))
            month = int(short_match.group(2))
            year = int(short_match.group(3)) if short_match.group(3) else REFERENCE_DATE.year
            return self._format_date(year, month, day)
        return None

    def _extract_transport(self, normalized: str) -> str | None:
        has_flight = any(token in normalized for token in ("may bay", "ve bay", "flight", "plane"))
        has_train = any(token in normalized for token in ("tau hoa", "tau", "train"))
        if has_flight and not has_train:
            return "flight"
        if has_train and not has_flight:
            return "train"
        return None

    def _extract_passengers(self, normalized: str) -> int | None:
        explicit_digit_patterns = (
            r"\b(\d+)\s*(?:nguoi|ve|hanh khach)\b",
            r"\bcho\s*(\d+)\s*(?:nguoi|hanh khach)\b",
        )
        for pattern in explicit_digit_patterns:
            match = re.search(pattern, normalized)
            if match:
                passengers = int(match.group(1))
                return passengers if passengers > 0 else None

        for word, value in self._PASSENGER_WORDS.items():
            if re.search(rf"\b{re.escape(word)}\s*(?:nguoi|ve|hanh khach)\b", normalized):
                return value

        if "mot minh" in normalized or "chi minh toi" in normalized:
            return 1
        if "di voi vo" in normalized or "di voi chong" in normalized or "vo chong" in normalized:
            return 2
        if "di voi vo va con" in normalized or "di voi chong va con" in normalized:
            return 3

        has_spouse = any(token in normalized for token in ("vo", "chong"))
        has_child = "con" in normalized
        if has_spouse or has_child:
            return 1 + int(has_spouse) + int(has_child)
        return None

    @staticmethod
    def _route_changed(existing_slots: TripSlots, route_slots: dict[str, str | None]) -> bool:
        for field_name in ("departure", "destination"):
            next_value = route_slots[field_name]
            current_value = getattr(existing_slots, field_name)
            if next_value is not None and current_value is not None and next_value != current_value:
                return True
        return False

    def _find_cities(self, normalized_fragment: str) -> list[str]:
        hits: list[tuple[int, str]] = []
        for alias, canonical in sorted(self._CITY_ALIASES.items(), key=lambda item: len(item[0]), reverse=True):
            match = re.search(r"\b" + re.escape(alias) + r"\b", normalized_fragment)
            if match:
                hits.append((match.start(), canonical))
        hits.sort(key=lambda item: item[0])

        ordered: list[str] = []
        for _, canonical in hits:
            if canonical not in ordered:
                ordered.append(canonical)
        return ordered

    def _extract_with_gemini(
        self,
        message: str,
        base_slots: TripSlots,
        pending_slot: str | None,
    ) -> TripSlots | None:
        try:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={"response_mime_type": "application/json"},
                system_instruction=(
                    "Trich xuat slot dat ve du lich thanh JSON. "
                    "Truong hop pending_slot=passengers phai suy luan cac cum nhu 'di voi vo' = 2, 'di voi chong va con' = 3, 'mot minh' = 1. "
                    "Chi tra ve JSON object voi cac field departure, destination, date, transport, passengers."
                ),
            )
            prompt = (
                f"Pending slot: {pending_slot}\n"
                f"Current slots: {base_slots.model_dump(mode='json')}\n"
                f"Message: {message}"
            )
            response = model.generate_content(prompt)
            if not response.text:
                return None
            import json

            data = json.loads(response.text)
            normalized: dict[str, object] = {}
            for field_name in ("departure", "destination", "date", "transport", "passengers"):
                if field_name not in data or data[field_name] in ("", None):
                    continue
                if field_name in {"departure", "destination"}:
                    normalized[field_name] = self._normalize_city_value(field_name, data[field_name])
                elif field_name == "date":
                    normalized[field_name] = self._normalize_date_value(data[field_name])
                elif field_name == "transport":
                    normalized[field_name] = self._normalize_transport_value(data[field_name])
                else:
                    normalized[field_name] = self._normalize_passenger_value(data[field_name])
            return base_slots.model_copy(update=normalized)
        except Exception:
            return None

    def _score_confidence(self, missing_slots: list[str], normalized: str) -> float:
        confidence = 0.93 - 0.12 * len(missing_slots)
        if "hoac" in normalized:
            confidence -= 0.08
        return max(0.35, round(confidence, 2))

    def _normalize_city_value(self, field_name: str, raw_value: object) -> str:
        if not isinstance(raw_value, str) or not raw_value.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"{field_name} must be a non-empty string.",
            )
        matches = self._find_cities(self._normalize_text(raw_value))
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
        transport = self._extract_transport(self._normalize_text(raw_value))
        if transport is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid transport value.",
            )
        return transport

    def _normalize_date_value(self, raw_value: object) -> str:
        if not isinstance(raw_value, str) or not raw_value.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="date must be a non-empty string.",
            )
        parsed_date = self._extract_date(self._normalize_text(raw_value))
        if parsed_date is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid date value.",
            )
        return parsed_date

    @staticmethod
    def _normalize_passenger_value(raw_value: object) -> int:
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
    def _format_date(year: int, month: int, day: int) -> str | None:
        try:
            return date(year, month, day).isoformat()
        except ValueError:
            return None

    @staticmethod
    def _normalize_text(value: str) -> str:
        normalized = unicodedata.normalize("NFD", value.lower())
        ascii_text = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
        ascii_text = ascii_text.replace("đ", "d")
        return re.sub(r"\s+", " ", ascii_text).strip()


slot_extractor_service = SlotExtractorService()
