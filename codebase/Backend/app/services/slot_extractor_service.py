import os
import re
import unicodedata
from dataclasses import dataclass
from datetime import date, timedelta

from fastapi import HTTPException, status

from app.core.env import load_local_env
from app.models.session import CurrentTripState, TripSlots

load_local_env()

try:
    import google.generativeai as genai

    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False


REFERENCE_DATE = date(2026, 6, 4)
DEFAULT_FLEXIBLE_DATE = date(2026, 6, 5)
ASK_ORDER = ("departure", "destination", "date", "transport", "passengers")
LLM_FALLBACK_WARNING = (
    "Loi extractor: thieu `google-generativeai` hoac `GEMINI_API_KEY`, "
    "he thong dang fallback sang heuristic parser."
)


def build_slot_extractor_system_prompt() -> str:
    return f"""
Bạn là bộ trích xuất slot cho trợ lý tìm chuyến đi.
Hôm nay là {REFERENCE_DATE.isoformat()}.

Mục tiêu:
- Đọc tin nhắn tiếng Việt của người dùng cùng trạng thái hội thoại hiện tại.
- Trích xuất hoặc cập nhật đúng 5 slot: departure, destination, date, transport, passengers.
- Ưu tiên hiểu nghĩa câu nói tự nhiên và ngữ cảnh hội thoại, không phụ thuộc máy móc vào regex.

Ngữ cảnh đầu vào:
- `pending_slot` cho biết bot đang hỏi tiếp trường nào.
- `current_slots` là các giá trị đã thu thập từ các lượt trước.
- `message` là tin nhắn mới nhất của người dùng.

Quy tắc hội thoại:
- Nếu người dùng đang trả lời cho `pending_slot`, hãy điền đúng slot đó từ ngữ cảnh câu hỏi đáp.
- Nếu người dùng nêu hành trình mới rõ ràng, hãy cập nhật lại departure và destination theo message mới thay vì bám route cũ.
- Chỉ cập nhật slot khi có tín hiệu đủ chắc chắn từ message mới.
- Không suy diễn thêm thông tin không được nói ra hoặc không suy ra chắc chắn.
- Nếu mơ hồ, giữ giá trị đó là null.

Quy tắc chuẩn hóa:
- `date` phải ở dạng YYYY-MM-DD, dùng mốc tham chiếu {REFERENCE_DATE.isoformat()}.
- Các cách nói tương đối như `hôm nay`, `ngày mai`, `ngày kia`, `cuối tuần này`, `cuối tuần sau` phải quy đổi theo mốc trên.
- Nếu người dùng nói ngày linh hoạt như `ngày nào cũng được`, `date không quan trọng`, hãy tự chọn ngày gần nhất khả dụng thay vì hỏi lại ngày.
- `transport` chỉ được là `flight`, `train`, `both`, hoặc null.
- Nếu người dùng chấp nhận cả máy bay lẫn tàu hỏa, hoặc nói `cả hai`, `đều được`, `gì cũng được`, hãy chuẩn hóa thành `both`.
- `departure` và `destination` chỉ được chuẩn hóa thành một trong các thành phố phổ biến ở Việt Nam: Hà Nội, Hải Phòng, TP.HCM, Cần Thơ, Đà Nẵng, Huế, Đà Lạt, Nha Trang, Quy Nhơn, Phú Quốc.
- `passengers` phải là số nguyên dương.

Suy luận hành khách:
- `một mình`, `chỉ mình tôi` -> 1.
- `đi với vợ`, `đi với chồng`, `vợ chồng` -> 2.
- `đi với vợ và con`, `đi với chồng và con` -> 3.
- `tôi bố và mẹ` -> 3.
- Có thể suy luận từ cụm gia đình quen thuộc nếu đủ chắc chắn; nếu không chắc, trả về null.

Ràng buộc đầu ra:
- Chỉ trả về đúng một JSON object.
- JSON chỉ có các field: `departure`, `destination`, `date`, `transport`, `passengers`.
- Không thêm giải thích, không markdown, không text ngoài JSON.
""".strip()


def build_slot_extractor_user_prompt(
    *,
    pending_slot: str | None,
    base_slots: TripSlots,
    message: str,
) -> str:
    return (
        "Ngữ cảnh phiên hiện tại:\n"
        f"- pending_slot: {pending_slot}\n"
        f"- current_slots: {base_slots.model_dump(mode='json')}\n"
        f"- reference_date: {REFERENCE_DATE.isoformat()}\n"
        f"- latest_user_message: {message}\n\n"
        "Yêu cầu:\n"
        "- Điền slot mới hoặc slot cần cập nhật từ message mới nhất.\n"
        "- Nếu message thể hiện đổi hành trình, route mới phải thắng route cũ.\n"
        "- Nếu không chắc một field, trả field đó là null.\n"
        "- Trả về duy nhất JSON object hợp lệ."
    )


@dataclass(slots=True)
class SlotExtractionResult:
    slots: TripSlots
    missing_slots: list[str]
    pending_slot: str | None
    confidence: float
    system_warning: str | None = None


class SlotExtractorService:
    _CITY_ALIASES: dict[str, str] = {
        "ha noi": "Hà Nội",
        "hn": "Hà Nội",
        "hanoi": "Hà Nội",
        "hai phong": "Hải Phòng",
        "haiphong": "Hải Phòng",
        "hp": "Hải Phòng",
        "sai gon": "TP.HCM",
        "saigon": "TP.HCM",
        "sg": "TP.HCM",
        "tp hcm": "TP.HCM",
        "tphcm": "TP.HCM",
        "tp.hcm": "TP.HCM",
        "ho chi minh": "TP.HCM",
        "can tho": "Cần Thơ",
        "cantho": "Cần Thơ",
        "da nang": "Đà Nẵng",
        "danang": "Đà Nẵng",
        "dn": "Đà Nẵng",
        "hue": "Huế",
        "huế": "Huế",
        "da lat": "Đà Lạt",
        "dalat": "Đà Lạt",
        "dl": "Đà Lạt",
        "phu quoc": "Phú Quốc",
        "pq": "Phú Quốc",
        "nha trang": "Nha Trang",
        "nt": "Nha Trang",
        "quy nhon": "Quy Nhơn",
        "quynhon": "Quy Nhơn",
        "qn": "Quy Nhơn",
    }
    _PASSENGER_WORDS: dict[str, int] = {
        "mot": 1,
        "một": 1,
        "hai": 2,
        "ba": 3,
        "bon": 4,
        "bốn": 4,
    }
    _FAMILY_MEMBER_TOKENS: tuple[str, ...] = (
        "toi",
        "mình",
        "minh",
        "bo",
        "bố",
        "me",
        "mẹ",
        "ba",
        "má",
        "ma",
        "vo",
        "vợ",
        "chong",
        "chồng",
        "con",
        "anh",
        "chị",
        "chi",
        "em",
        "ong",
        "ông",
        "ba",
        "bà",
    )

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
        pending_slot = session_state.pending_slot if session_state else None
        normalized = self._normalize_text(message)
        llm_slots = None
        system_warning: str | None = None

        if HAS_GEMINI and self._api_key:
            llm_slots = self._extract_with_gemini(
                message=message,
                base_slots=existing_slots,
                pending_slot=pending_slot,
            )
        else:
            system_warning = LLM_FALLBACK_WARNING

        if llm_slots is not None:
            route_slots = {
                "departure": llm_slots.departure,
                "destination": llm_slots.destination,
            }
            route_changed = self._route_changed(existing_slots=existing_slots, route_slots=route_slots)
            base_slots = TripSlots() if route_changed else existing_slots.model_copy(deep=True)
            base_slots = self._merge_slot_values(base_slots=base_slots, new_slots=llm_slots)
            base_slots = self._fill_missing_with_heuristics(
                base_slots=base_slots,
                message=message,
                normalized=normalized,
                pending_slot=None if route_changed else pending_slot,
            )
        else:
            route_slots = self._extract_route(normalized)
            route_changed = self._route_changed(existing_slots=existing_slots, route_slots=route_slots)
            base_slots = TripSlots() if route_changed else existing_slots.model_copy(deep=True)

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
            elif self._is_flexible_date_request(normalized):
                base_slots.date = DEFAULT_FLEXIBLE_DATE.isoformat()

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
            system_warning=system_warning,
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

    def _fill_missing_with_heuristics(
        self,
        base_slots: TripSlots,
        message: str,
        normalized: str,
        pending_slot: str | None,
    ) -> TripSlots:
        enriched = base_slots.model_copy(deep=True)

        if pending_slot and getattr(enriched, pending_slot) in (None, ""):
            extracted_value = self._extract_pending_slot_value(
                pending_slot=pending_slot,
                message=message,
                normalized=normalized,
            )
            if extracted_value is not None:
                setattr(enriched, pending_slot, extracted_value)

        route_slots = self._extract_route(normalized)
        if enriched.departure is None and route_slots["departure"] is not None:
            enriched.departure = route_slots["departure"]
        if enriched.destination is None and route_slots["destination"] is not None:
            enriched.destination = route_slots["destination"]

        if enriched.date is None:
            parsed_date = self._extract_date(normalized)
            if parsed_date is not None:
                enriched.date = parsed_date
            elif self._is_flexible_date_request(normalized):
                enriched.date = DEFAULT_FLEXIBLE_DATE.isoformat()

        if enriched.transport is None:
            parsed_transport = self._extract_transport(normalized)
            if parsed_transport is not None:
                enriched.transport = parsed_transport

        if enriched.passengers is None:
            parsed_passengers = self._extract_passengers(normalized)
            if parsed_passengers is not None:
                enriched.passengers = parsed_passengers

        return enriched

    @staticmethod
    def _merge_slot_values(base_slots: TripSlots, new_slots: TripSlots) -> TripSlots:
        merged = base_slots.model_copy(deep=True)
        for field_name in ASK_ORDER:
            next_value = getattr(new_slots, field_name)
            if next_value not in (None, ""):
                setattr(merged, field_name, next_value)
        return merged

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
            (
                r"\b(?P<departure>ha noi|hanoi|hn|hai phong|haiphong|hp|sai gon|saigon|sg|tp hcm|tphcm|ho chi minh|"
                r"can tho|cantho|da nang|danang|dn|hue|huế|da lat|dalat|dl|phu quoc|pq|nha trang|nt|quy nhon|quynhon|qn)"
                r"\s+(?:di|den|toi)\s+(?P<destination>.+)"
            ),
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

    @staticmethod
    def _is_flexible_date_request(normalized: str) -> bool:
        return any(
            token in normalized
            for token in (
                "ngay nao cung duoc",
                "hom nao cung duoc",
                "date nao cung duoc",
                "date khong quan trong",
                "ngay khong quan trong",
                "khong quan trong ngay",
                "khong can dung ngay",
                "bat ky ngay nao",
            )
        )

    def _extract_transport(self, normalized: str) -> str | None:
        has_both = any(
            token in normalized
            for token in (
                "ca hai",
                "cả hai",
                "deu duoc",
                "đều được",
                "gi cung duoc",
                "gì cũng được",
                "may bay hay tau hoa deu duoc",
                "flight hay train deu duoc",
            )
        )
        has_flight = any(token in normalized for token in ("may bay", "ve bay", "flight", "plane"))
        has_train = any(token in normalized for token in ("tau hoa", "tau", "train"))
        if has_both or (has_flight and has_train):
            return "both"
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

        family_mentions = self._count_distinct_family_members(normalized)
        if family_mentions:
            return family_mentions
        return None

    def _count_distinct_family_members(self, normalized: str) -> int | None:
        matches: list[str] = []
        for token in self._FAMILY_MEMBER_TOKENS:
            if re.search(r"\b" + re.escape(token) + r"\b", normalized):
                matches.append(token)

        if not matches:
            return None

        normalized_roles = {
            "toi": "self",
            "mình": "self",
            "minh": "self",
            "bo": "father",
            "bố": "father",
            "ba": "father",
            "me": "mother",
            "mẹ": "mother",
            "má": "mother",
            "ma": "mother",
            "vo": "spouse",
            "vợ": "spouse",
            "chong": "spouse",
            "chồng": "spouse",
            "con": "child",
            "anh": "sibling",
            "chị": "sibling",
            "chi": "sibling",
            "em": "sibling",
            "ong": "grandfather",
            "ông": "grandfather",
            "bà": "grandmother",
        }
        distinct_roles = {normalized_roles[token] for token in matches if token in normalized_roles}
        return len(distinct_roles) if distinct_roles else None

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
                system_instruction=build_slot_extractor_system_prompt(),
            )
            prompt = build_slot_extractor_user_prompt(
                pending_slot=pending_slot,
                base_slots=base_slots,
                message=message,
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
