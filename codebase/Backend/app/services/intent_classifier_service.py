import os
import re
from dataclasses import dataclass

from app.core.env import load_local_env
from app.models.session import CurrentTripState

load_local_env()

try:
    import google.generativeai as genai

    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False


@dataclass(slots=True)
class IntentClassification:
    intent: str
    confidence: float
    is_unsafe: bool = False


class IntentClassifierService:
    _SEARCH_HINTS = (
        "dat ve",
        "tim ve",
        "ve may bay",
        "ve tau",
        "chuyen bay",
        "tau hoa",
        "khoi hanh",
        "di tu",
        "bay",
        "tau",
        "ve",
    )
    _FAQ_HINTS = (
        "so sanh",
        "re hon",
        "nhanh hon",
        "tien hon",
        "bao nhieu",
        "chenh lech",
        "tong tien",
        "tong chi phi",
        "tot nhat",
        "re nhat",
        "nhanh nhat",
    )
    _UNRELATED_HINTS = (
        "hanh ly",
        "do len may bay",
        "co duoc dem",
        "chinh sach hanh ly",
        "bom",
        "sung",
        "vu khi",
        "system prompt",
        "ignore instructions",
        "jailbreak",
    )

    def __init__(self) -> None:
        self._api_key = os.getenv("GEMINI_API_KEY", "")
        if HAS_GEMINI and self._api_key:
            genai.configure(api_key=self._api_key)

    def classify(self, message: str, session_state: CurrentTripState | None = None) -> IntentClassification:
        normalized = self._normalize_text(message)

        if self._is_unsafe(normalized):
            return IntentClassification(intent="unrelated", confidence=1.0, is_unsafe=True)

        if HAS_GEMINI and self._api_key:
            llm_result = self._classify_with_gemini(message=message, session_state=session_state)
            if llm_result is not None:
                return llm_result

        if self._is_out_of_scope(normalized):
            return IntentClassification(intent="unrelated", confidence=0.93)

        has_search_hint = any(hint in normalized for hint in self._SEARCH_HINTS)
        has_faq_hint = any(hint in normalized for hint in self._FAQ_HINTS)
        has_trip_context = session_state is not None and session_state.search_status in {"collecting", "ready", "searched"}
        has_pending_slot = session_state is not None and session_state.pending_slot is not None

        if has_faq_hint and self._contains_route_context(normalized):
            return IntentClassification(intent="faq", confidence=0.88)
        if has_search_hint or has_pending_slot:
            return IntentClassification(intent="search_trip", confidence=0.84)
        if has_trip_context and self._looks_like_follow_up(normalized):
            return IntentClassification(intent="search_trip", confidence=0.74)
        return IntentClassification(intent="unrelated", confidence=0.82)

    def _classify_with_gemini(
        self,
        message: str,
        session_state: CurrentTripState | None,
    ) -> IntentClassification | None:
        try:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={"response_mime_type": "application/json"},
                system_instruction=(
                    "Phan loai message thanh mot trong ba nhan: search_trip, faq, unrelated. "
                    "FAQ chi dung cho cau hoi so sanh gia, tong tien, chen lech thoi gian dua tren du lieu tuyen duong. "
                    "Cau hoi chinh sach hanh ly va van de khong nam trong du lieu mock phai la unrelated. "
                    "Tra ve JSON: {\"intent\": string, \"confidence\": number, \"is_unsafe\": boolean}."
                ),
            )
            prompt = message
            if session_state is not None:
                prompt += (
                    "\n\nCurrent session state:\n"
                    f"intent={session_state.intent}, pending_slot={session_state.pending_slot}, "
                    f"search_status={session_state.search_status}, missing_slots={session_state.missing_slots}"
                )
            response = model.generate_content(prompt)
            payload = response.text
            if not payload:
                return None
            import json

            data = json.loads(payload)
            intent = data.get("intent")
            if intent not in {"search_trip", "faq", "unrelated"}:
                return None
            return IntentClassification(
                intent=intent,
                confidence=float(data.get("confidence", 0.7)),
                is_unsafe=bool(data.get("is_unsafe", False)),
            )
        except Exception:
            return None

    def _is_unsafe(self, normalized: str) -> bool:
        return any(hint in normalized for hint in self._UNRELATED_HINTS if hint in {"bom", "sung", "vu khi", "system prompt", "ignore instructions", "jailbreak"}) or (
            "bo qua huong dan" in normalized
        )

    def _is_out_of_scope(self, normalized: str) -> bool:
        return any(
            hint in normalized
            for hint in ("hanh ly", "do len may bay", "co duoc dem", "chinh sach hanh ly")
        )

    @staticmethod
    def _contains_route_context(normalized: str) -> bool:
        return any(token in normalized for token in ("ha noi", "da nang", "phu quoc", "sai gon", "tp hcm", "nha trang"))

    @staticmethod
    def _looks_like_follow_up(normalized: str) -> bool:
        return bool(re.search(r"\b(\d{1,2}/\d{1,2}|\d+|ha noi|da nang|phu quoc|sai gon|tau|may bay|vo|chong|con)\b", normalized))

    @staticmethod
    def _normalize_text(value: str) -> str:
        import re
        import unicodedata

        normalized = unicodedata.normalize("NFD", value.lower())
        ascii_text = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
        ascii_text = ascii_text.replace("đ", "d")
        return re.sub(r"\s+", " ", ascii_text).strip()


intent_classifier_service = IntentClassifierService()
