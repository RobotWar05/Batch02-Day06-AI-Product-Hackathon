import os
import json
import re
from datetime import datetime
from uuid import uuid4

# Import your extractor logic
from extractor import extract_entities

# Paths relative to the codebase/Backend directory
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
TRIP_STATES_FILE = os.path.join(BACKEND_DIR, "data", "trip_states.json")
MOCK_TRIPS_FILE = os.path.join(BACKEND_DIR, "data", "mock_trips.json")


class TripAgent:
    def __init__(self) -> None:
        self._ensure_file_exists(TRIP_STATES_FILE, {})
        self._ensure_file_exists(MOCK_TRIPS_FILE, [])

    def _ensure_file_exists(self, path: str, default_content) -> None:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        if not os.path.exists(path):
            with open(path, "w", encoding="utf-8") as f:
                json.dump(default_content, f, ensure_ascii=False, indent=2)

    def _read_json(self, path: str):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {} if path == TRIP_STATES_FILE else []

    def _write_json(self, path: str, data) -> None:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def get_trip_state(self, session_id: str) -> dict:
        states = self._read_json(TRIP_STATES_FILE)
        if session_id not in states:
            states[session_id] = {
                "departure": None,
                "destination": None,
                "date": None,
                "return_date": None,
                "is_round_trip": False,
                "time": None,
                "transport": None,
                "passengers": 1,
                "last_asked_slot": None
            }
            self._write_json(TRIP_STATES_FILE, states)
        return states[session_id]

    def save_trip_state(self, session_id: str, state: dict) -> None:
        states = self._read_json(TRIP_STATES_FILE)
        states[session_id] = state
        self._write_json(TRIP_STATES_FILE, states)

    def process_user_message(self, session_id: str, content: str) -> dict:
        state = self.get_trip_state(session_id)
        last_asked = state.get("last_asked_slot")

        # 1. Apply heuristics for short answers if we just asked a question
        message_clean = content.strip().lower()
        words = message_clean.split()
        
        # If it's a short answer (1-3 words) and we have last_asked_slot
        if last_asked and len(words) <= 3:
            if last_asked in ["departure", "destination"]:
                city = self._detect_city(message_clean)
                if city:
                    state[last_asked] = city
                    state["last_asked_slot"] = None
            elif last_asked == "date":
                date_val = self._detect_date(message_clean)
                if date_val:
                    state["date"] = date_val
                    state["last_asked_slot"] = None
            elif last_asked == "return_date":
                date_val = self._detect_date(message_clean)
                if date_val:
                    state["return_date"] = date_val
                    state["is_round_trip"] = True
                    state["last_asked_slot"] = None
            elif last_asked == "transport":
                if any(kw in message_clean for kw in ["tàu", "train", "sắt"]):
                    state["transport"] = "train"
                    state["last_asked_slot"] = None
                elif any(kw in message_clean for kw in ["bay", "plane", "khống", "vé máy bay"]):
                    state["transport"] = "plane"
                    state["last_asked_slot"] = None
            elif last_asked == "passengers":
                digits = re.findall(r'\d+', message_clean)
                if digits:
                    state["passengers"] = int(digits[0])
                    state["last_asked_slot"] = None

        # 2. Run the main entity extractor
        extraction = extract_entities(content)
        intent = extraction.get("intent", "search_trip")
        entities = extraction.get("entities", {})

        # Safety & Security Guardrails checks
        if intent in ["safety_block", "security_block"]:
            state["last_asked_slot"] = None
            self.save_trip_state(session_id, state)
            return {
                "response_type": "error",
                "message": extraction.get("raw_analysis", "Yêu cầu bị từ chối do chính sách bảo mật/an toàn."),
                "payload": state,
                "next_action": "blocked"
            }

        if intent == "other":
            return {
                "response_type": "text",
                "message": extraction.get("raw_analysis", "Tôi là trợ lý đặt vé. Hãy cho tôi biết thông tin chuyến đi của bạn."),
                "payload": state,
                "next_action": "conversational"
            }

        # 3. Merge new extracted entities into accumulated state
        # Contextual redirection based on last_asked
        if last_asked == "departure" and entities.get("destination") and not entities.get("departure"):
            entities["departure"] = entities["destination"]
            entities["destination"] = None
        elif last_asked == "destination" and entities.get("departure") and not entities.get("destination"):
            entities["destination"] = entities["departure"]
            entities["departure"] = None
        elif last_asked == "date" and entities.get("return_date") and not entities.get("date"):
            entities["date"] = entities["return_date"]
            entities["return_date"] = None

        for k, v in entities.items():
            if v is not None:
                state[k] = v

        if "passengers" in entities and entities["passengers"] is not None:
            state["passengers"] = entities["passengers"]

        # Validate missing slots
        missing = []
        if not state["departure"]:
            missing.append("departure")
        if not state["destination"]:
            missing.append("destination")
        if not state["date"]:
            missing.append("date")
        if state["is_round_trip"] and not state["return_date"]:
            missing.append("return_date")
        if not state["transport"]:
            missing.append("transport")
        if not state["passengers"]:
            state["passengers"] = 1

        # 4. Generate bot response based on completeness
        if missing:
            next_slot = missing[0]
            state["last_asked_slot"] = next_slot
            self.save_trip_state(session_id, state)

            questions = {
                "departure": "Bạn muốn khởi hành từ đâu?",
                "destination": "Bạn muốn đi đến đâu?",
                "date": "Bạn muốn đi vào ngày nào?",
                "return_date": "Bạn muốn quay về ngày nào?",
                "transport": "Bạn muốn di chuyển bằng máy bay hay tàu hỏa?",
                "passengers": "Có bao nhiêu hành khách tham gia chuyến đi?"
            }

            replies = {
                "departure": [
                    {"field": "departure", "label": "Hà Nội", "value": "Hà Nội"},
                    {"field": "departure", "label": "TP.HCM", "value": "TP.HCM"},
                    {"field": "departure", "label": "Đà Nẵng", "value": "Đà Nẵng"}
                ],
                "destination": [
                    {"field": "destination", "label": "Đà Nẵng", "value": "Đà Nẵng"},
                    {"field": "destination", "label": "Phú Quốc", "value": "Phú Quốc"},
                    {"field": "destination", "label": "Nha Trang", "value": "Nha Trang"}
                ],
                "date": [
                    {"field": "date", "label": "Hôm nay", "value": "Hôm nay"},
                    {"field": "date", "label": "Ngày mai", "value": "Ngày mai"},
                    {"field": "date", "label": "Cuối tuần này", "value": "Cuối tuần này"}
                ],
                "return_date": [
                    {"field": "return_date", "label": "Ngày mai", "value": "Ngày mai"},
                    {"field": "return_date", "label": "Cuối tuần sau", "value": "Cuối tuần sau"}
                ],
                "transport": [
                    {"field": "transport", "label": "Máy bay ✈️", "value": "plane"},
                    {"field": "transport", "label": "Tàu hỏa 🚂", "value": "train"}
                ],
                "passengers": [
                    {"field": "passengers", "label": "1 người", "value": "1"},
                    {"field": "passengers", "label": "2 người", "value": "2"},
                    {"field": "passengers", "label": "3 người", "value": "3"}
                ]
            }

            return {
                "response_type": "slot_filling",
                "message": questions[next_slot],
                "payload": {
                    "departure": state["departure"],
                    "destination": state["destination"],
                    "date": state["date"],
                    "return_date": state["return_date"],
                    "is_round_trip": state["is_round_trip"],
                    "transport": state["transport"],
                    "passengers": state["passengers"]
                },
                "next_action": f"awaiting_{next_slot}",
                "quick_replies": replies[next_slot]
            }

        # If all slots are present, transition to READY_TO_SEARCH
        state["last_asked_slot"] = None
        self.save_trip_state(session_id, state)
        return {
            "response_type": "trip_widget",
            "message": "Tôi đã tìm thấy thông tin chuyến đi của bạn. Vui lòng xác nhận trước khi tìm kiếm.",
            "payload": {
                "departure": state["departure"],
                "destination": state["destination"],
                "date": state["date"],
                "return_date": state["return_date"],
                "is_round_trip": state["is_round_trip"],
                "transport": state["transport"],
                "passengers": state["passengers"]
            },
            "next_action": "ready_to_search"
        }

    def patch_trip_state(self, session_id: str, patch: dict) -> dict:
        state = self.get_trip_state(session_id)
        for k, v in patch.items():
            state[k] = v
        
        missing = []
        if not state["departure"]:
            missing.append("departure")
        if not state["destination"]:
            missing.append("destination")
        if not state["date"]:
            missing.append("date")
        if state["is_round_trip"] and not state["return_date"]:
            missing.append("return_date")
        if not state["transport"]:
            missing.append("transport")
        if not state["passengers"]:
            state["passengers"] = 1

        state["last_asked_slot"] = None if not missing else missing[0]
        self.save_trip_state(session_id, state)

        if missing:
            next_slot = missing[0]
            questions = {
                "departure": "Bạn muốn khởi hành từ đâu?",
                "destination": "Bạn muốn đi đến đâu?",
                "date": "Bạn muốn đi vào ngày nào?",
                "return_date": "Bạn muốn quay về ngày nào?",
                "transport": "Bạn muốn di chuyển bằng máy bay hay tàu hỏa?",
                "passengers": "Có bao nhiêu hành khách tham gia chuyến đi?"
            }
            replies = {
                "departure": [
                    {"field": "departure", "label": "Hà Nội", "value": "Hà Nội"},
                    {"field": "departure", "label": "TP.HCM", "value": "TP.HCM"},
                    {"field": "departure", "label": "Đà Nẵng", "value": "Đà Nẵng"}
                ],
                "destination": [
                    {"field": "destination", "label": "Đà Nẵng", "value": "Đà Nẵng"},
                    {"field": "destination", "label": "Phú Quốc", "value": "Phú Quốc"},
                    {"field": "destination", "label": "Nha Trang", "value": "Nha Trang"}
                ],
                "date": [
                    {"field": "date", "label": "Hôm nay", "value": "Hôm nay"},
                    {"field": "date", "label": "Ngày mai", "value": "Ngày mai"},
                    {"field": "date", "label": "Cuối tuần này", "value": "Cuối tuần này"}
                ],
                "return_date": [
                    {"field": "return_date", "label": "Ngày mai", "value": "Ngày mai"},
                    {"field": "return_date", "label": "Cuối tuần sau", "value": "Cuối tuần sau"}
                ],
                "transport": [
                    {"field": "transport", "label": "Máy bay ✈️", "value": "plane"},
                    {"field": "transport", "label": "Tàu hỏa 🚂", "value": "train"}
                ],
                "passengers": [
                    {"field": "passengers", "label": "1 người", "value": "1"},
                    {"field": "passengers", "label": "2 người", "value": "2"},
                    {"field": "passengers", "label": "3 người", "value": "3"}
                ]
            }
            res = {
                "response_type": "slot_filling",
                "message": f"Thông tin chuyến đi đã được cập nhật. {questions[next_slot]}",
                "payload": state,
                "next_action": f"awaiting_{next_slot}",
                "quick_replies": replies[next_slot]
            }
        else:
            res = {
                "response_type": "trip_widget",
                "message": "Thông tin chuyến đi đã được cập nhật",
                "payload": {
                    "departure": state["departure"],
                    "destination": state["destination"],
                    "date": state["date"],
                    "return_date": state["return_date"],
                    "is_round_trip": state["is_round_trip"],
                    "transport": state["transport"],
                    "passengers": state["passengers"]
                },
                "next_action": "ready_to_search"
            }

        return res

    def search_trips(self, session_id: str) -> dict:
        state = self.get_trip_state(session_id)
        
        missing = []
        if not state["departure"]:
            missing.append("departure")
        if not state["destination"]:
            missing.append("destination")
        if not state["date"]:
            missing.append("date")
        if not state["transport"]:
            missing.append("transport")

        if missing:
            raise ValueError(f"Missing fields for search: {', '.join(missing)}")

        transport_mode = state["transport"]
        if transport_mode == "plane":
            transport_mode = "flight"

        all_trips = self._read_json(MOCK_TRIPS_FILE)
        results = []
        for trip in all_trips:
            origin_match = self._normalize_city(trip.get("origin")) == self._normalize_city(state["departure"])
            dest_match = self._normalize_city(trip.get("destination")) == self._normalize_city(state["destination"])
            date_match = trip.get("date") == state["date"]
            trans_match = trip.get("transport_mode") == transport_mode

            if origin_match and dest_match and date_match and trans_match:
                results.append(trip)

        return {
            "response_type": "trip_results",
            "message": f"Tìm thấy {len(results)} kết quả phù hợp cho chuyến đi của bạn.",
            "payload": {
                "results": results
            }
        }

    def _normalize_city(self, city: str | None) -> str:
        if not city:
            return ""
        c = city.lower().strip()
        c = re.sub(r'^(tp\.hcm|hồ chí minh|sài gòn|sg)$', 'tp.hcm', c)
        c = re.sub(r'^(hà nội|hn)$', 'hà nội', c)
        c = re.sub(r'^(đà nẵng|đn)$', 'đà nẵng', c)
        c = re.sub(r'^(phú quốc|pq)$', 'phú quốc', c)
        c = re.sub(r'^(nha trang|nt)$', 'nha trang', c)
        c = re.sub(r'^(đà lạt|đl)$', 'đà lạt', c)
        c = re.sub(r'^(hải phòng|hp)$', 'hải phòng', c)
        return c

    def _detect_city(self, text: str) -> str | None:
        text = text.lower()
        if "hà nội" in text or "hn" in text:
            return "Hà Nội"
        if "sài gòn" in text or "tp.hcm" in text or "hồ chí minh" in text or "sg" in text:
            return "TP.HCM"
        if "đà nẵng" in text or "đn" in text:
            return "Đà Nẵng"
        if "phú quốc" in text or "pq" in text:
            return "Phú Quốc"
        if "nha trang" in text or "nt" in text:
            return "Nha Trang"
        if "đà lạt" in text or "đl" in text:
            return "Đà Lạt"
        if "hải phòng" in text or "hp" in text:
            return "Hải Phòng"
        return None

    def _detect_date(self, text: str) -> str | None:
        if "hôm nay" in text:
            return "2026-06-04"
        if "ngày mai" in text or "mai" in text:
            return "2026-06-05"
        if "cuối tuần" in text:
            return "2026-06-06"
        match = re.search(r'\d{4}-\d{2}-\d{2}', text)
        if match:
            return match.group(0)
        match = re.search(r'(\d{1,2})/(\d{1,2})(?:/(\d{4}))?', text)
        if match:
            day, month, year = match.groups()
            year = year if year else "2026"
            return f"{int(year):04d}-{int(month):02d}-{int(day):02d}"
        return None


# Global agent instance
trip_agent = TripAgent()
