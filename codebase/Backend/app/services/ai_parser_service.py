from app.models.session import CurrentTripState, TripSlots
from app.services.slot_extractor_service import slot_extractor_service
from app.services.travel_assistant_service import travel_assistant_service


class AIParserService:
    def parse_message(
        self,
        message: str,
        session_state: CurrentTripState | None = None,
    ) -> CurrentTripState:
        return travel_assistant_service.parse_message(message=message, session_state=session_state)

    def normalize_slot_updates(self, updates: dict[str, object]) -> TripSlots:
        return slot_extractor_service.normalize_slot_updates(updates)


ai_parser_service = AIParserService()
