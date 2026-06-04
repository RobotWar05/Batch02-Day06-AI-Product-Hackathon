from app.models.session import AssistantTurnResponse, CurrentTripState, SlotQuestion, TripSlots
from app.models.trip_search import SearchQuery
from app.services.faq_react_service import faq_react_service
from app.services.intent_classifier_service import intent_classifier_service
from app.services.slot_extractor_service import ASK_ORDER, slot_extractor_service
from app.services.trip_search_service import trip_search_service


class TravelAssistantService:
    def parse_message(
        self,
        message: str,
        session_state: CurrentTripState | None = None,
    ) -> CurrentTripState:
        classification = intent_classifier_service.classify(message=message, session_state=session_state)

        if classification.is_unsafe:
            return CurrentTripState(
                intent="unrelated",
                slots=session_state.slots if session_state else TripSlots(),
                confidence=classification.confidence,
                missing_slots=session_state.missing_slots if session_state else [],
                pending_slot=session_state.pending_slot if session_state else None,
                search_status=session_state.search_status if session_state else "not_applicable",
                is_unsafe=True,
                system_warning=None,
                last_tool_calls=[],
                debug_trace=classification.trace,
                raw_message=message.strip(),
            )

        if classification.intent == "search_trip":
            extracted = slot_extractor_service.extract_search_state(message=message, session_state=session_state)
            return CurrentTripState(
                intent="search_trip",
                slots=extracted.slots,
                confidence=extracted.confidence,
                missing_slots=extracted.missing_slots,
                pending_slot=extracted.pending_slot,
                search_status="collecting" if extracted.missing_slots else "ready",
                is_unsafe=False,
                system_warning=extracted.system_warning,
                last_tool_calls=[],
                debug_trace=classification.trace + extracted.trace,
                raw_message=message.strip(),
            )

        if classification.intent == "faq":
            faq_slots = slot_extractor_service.extract_faq_slots(message=message, session_state=session_state)
            return CurrentTripState(
                intent="faq",
                slots=faq_slots,
                confidence=classification.confidence,
                missing_slots=[],
                pending_slot=None,
                search_status="not_applicable",
                is_unsafe=False,
                system_warning=None,
                last_tool_calls=[],
                debug_trace=classification.trace,
                raw_message=message.strip(),
            )

        return CurrentTripState(
            intent="unrelated",
            slots=session_state.slots if session_state and session_state.intent == "search_trip" else TripSlots(),
            confidence=classification.confidence,
            missing_slots=session_state.missing_slots if session_state and session_state.intent == "search_trip" else [],
            pending_slot=session_state.pending_slot if session_state and session_state.intent == "search_trip" else None,
            search_status=session_state.search_status if session_state and session_state.intent == "search_trip" else "not_applicable",
            is_unsafe=False,
            system_warning=None,
            last_tool_calls=[],
            debug_trace=classification.trace,
            raw_message=message.strip(),
        )

    def build_response(
        self,
        state: CurrentTripState,
        session_state: CurrentTripState | None = None,
    ) -> tuple[CurrentTripState, AssistantTurnResponse]:
        if state.is_unsafe:
            return state, AssistantTurnResponse(
                response_type="error",
                message="Tôi không thể hỗ trợ yêu cầu này.",
                payload={"intent": state.intent, "is_unsafe": True},
                next_action="blocked",
            )

        if state.intent == "search_trip":
            if state.missing_slots:
                question = self._build_question(state.pending_slot)
                state.search_status = "collecting"
                return state, AssistantTurnResponse(
                    response_type="slot_filling",
                    message=self._prepend_warning(state.system_warning, question.question),
                    payload={
                        "current_slots": state.slots.model_dump(mode="json"),
                        "missing_slots": state.missing_slots,
                        "pending_slot": state.pending_slot,
                        "question": question.model_dump(mode="json"),
                        "system_warning": state.system_warning,
                        "debug_trace": state.debug_trace,
                    },
                    next_action=f"awaiting_{state.pending_slot}",
                )

            search_payload = self._search_payload_from_state(state)
            state.search_status = "searched"
            return state, AssistantTurnResponse(
                response_type="search_results",
                message=self._prepend_warning(state.system_warning, search_payload.message),
                payload={
                    **search_payload.model_dump(mode="json"),
                    "system_warning": state.system_warning,
                    "debug_trace": state.debug_trace,
                },
                next_action="search_completed",
            )

        if state.intent == "faq":
            faq_result = faq_react_service.run(message=state.raw_message, session_state=session_state)
            state.last_tool_calls = faq_result.tool_calls
            state.debug_trace.extend(faq_result.trace)
            return state, AssistantTurnResponse(
                response_type="text",
                message=faq_result.message,
                payload={
                    **faq_result.payload,
                    "debug_trace": state.debug_trace,
                },
                next_action="answered",
            )

        return state, AssistantTurnResponse(
            response_type="text",
            message="Tôi hiện chỉ hỗ trợ tìm vé và so sánh dữ liệu chuyến đi trong demo này.",
            payload={"intent": "unrelated"},
            next_action="out_of_scope",
        )

    def rebuild_search_state(self, slots: TripSlots, raw_message: str) -> CurrentTripState:
        missing_slots = [slot_name for slot_name in ASK_ORDER if getattr(slots, slot_name) in (None, "")]
        return CurrentTripState(
            intent="search_trip",
            slots=slots,
            confidence=max(0.4, round(0.93 - 0.12 * len(missing_slots), 2)),
            missing_slots=missing_slots,
            pending_slot=missing_slots[0] if missing_slots else None,
            search_status="collecting" if missing_slots else "ready",
            is_unsafe=False,
            last_tool_calls=[],
            debug_trace=[],
            raw_message=raw_message,
        )

    def _search_payload_from_state(self, state: CurrentTripState):
        return trip_search_service.search_trips(
            SearchQuery(
                origin=state.slots.departure,
                destination=state.slots.destination,
                date=state.slots.date,
                transport_mode=None if state.slots.transport == "both" else state.slots.transport,
                passengers=state.slots.passengers or 1,
            )
        )

    @staticmethod
    def _prepend_warning(system_warning: str | None, message: str) -> str:
        if not system_warning:
            return message
        return f"[Canh bao] {system_warning}\n\n{message}"

    @staticmethod
    def _build_question(slot_name: str | None) -> SlotQuestion:
        if slot_name == "departure":
            return SlotQuestion(slot="departure", question="Bạn muốn khởi hành từ đâu?", options=["Hà Nội", "TP.HCM", "Đà Nẵng", "Hải Phòng", "Đà Lạt"])
        if slot_name == "destination":
            return SlotQuestion(slot="destination", question="Bạn muốn đi đến đâu?", options=["Phú Quốc", "Nha Trang", "Đà Lạt", "Huế", "Quy Nhơn"])
        if slot_name == "date":
            return SlotQuestion(slot="date", question="Bạn muốn đi ngày nào?", options=["2026-06-05", "2026-06-06", "2026-06-07", "2026-06-08"])
        if slot_name == "transport":
            return SlotQuestion(slot="transport", question="Bạn muốn đi máy bay hay tàu hỏa?", options=["Cả hai", "Máy bay", "Tàu hỏa"])
        return SlotQuestion(slot="passengers", question="Bạn đi bao nhiêu người?", options=["1", "2", "3", "4"])


travel_assistant_service = TravelAssistantService()
