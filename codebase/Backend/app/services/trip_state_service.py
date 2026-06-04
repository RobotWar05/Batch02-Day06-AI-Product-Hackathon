from app.models.session import AssistantTurnResponse, CurrentTripState, TripSlots
from app.services.travel_assistant_service import travel_assistant_service


class TripStateService:
    def build_decision(
        self,
        trip_state: CurrentTripState,
        session_state: CurrentTripState | None = None,
    ) -> tuple[CurrentTripState, AssistantTurnResponse]:
        return travel_assistant_service.build_response(state=trip_state, session_state=session_state)

    def rebuild_state_from_slots(self, slots: TripSlots, raw_message: str) -> CurrentTripState:
        return travel_assistant_service.rebuild_search_state(slots=slots, raw_message=raw_message)


trip_state_service = TripStateService()
