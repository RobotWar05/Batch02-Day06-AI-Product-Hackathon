from app.models.session import AssistantTurnResponse, CurrentTripState, SlotQuestion, TripSlots


class TripStateService:
    _REQUIRED_SLOTS = ("departure", "destination", "date", "transport")
    _LOW_CONFIDENCE_THRESHOLD = 0.75
    _EDITABLE_FIELDS = ["departure", "destination", "date", "transport", "passengers"]

    def build_decision(self, trip_state: CurrentTripState) -> AssistantTurnResponse:
        if trip_state.missing_slots:
            questions = [self._build_question(slot_name) for slot_name in trip_state.missing_slots]
            return AssistantTurnResponse(
                response_type="slot_filling",
                message="Tôi cần thêm thông tin để tìm chuyến đi phù hợp.",
                payload={
                    "missing_slots": trip_state.missing_slots,
                    "questions": [question.model_dump(mode="json") for question in questions],
                    "current_slots": trip_state.slots.model_dump(mode="json"),
                },
                next_action="ask_follow_up",
            )

        if trip_state.confidence < self._LOW_CONFIDENCE_THRESHOLD:
            return AssistantTurnResponse(
                response_type="confirm_low_confidence",
                message="Tôi đã hiểu gần đủ nhưng cần bạn xác nhận lại thông tin chuyến đi.",
                payload={
                    "slots": trip_state.slots.model_dump(mode="json"),
                    "confidence": trip_state.confidence,
                },
                next_action="confirm_low_confidence",
            )

        return AssistantTurnResponse(
            response_type="trip_widget",
            message="Tôi đã tìm thấy thông tin chuyến đi của bạn.",
            payload={
                **trip_state.slots.model_dump(mode="json"),
                "editable_fields": self._EDITABLE_FIELDS,
            },
            next_action="ready_to_search" if trip_state.raw_message.startswith("[correction]") else "show_widget",
        )

    def rebuild_state_from_slots(self, slots: TripSlots, raw_message: str) -> CurrentTripState:
        missing_slots = [
            slot_name
            for slot_name in self._REQUIRED_SLOTS
            if getattr(slots, slot_name) in (None, "")
        ]

        confidence = 0.92
        if missing_slots:
            confidence -= min(0.08 * len(missing_slots), 0.24)
        if slots.departure and slots.destination and slots.departure == slots.destination:
            confidence -= 0.23

        return CurrentTripState(
            intent="search_trip",
            slots=slots,
            confidence=max(0.2, round(confidence, 2)),
            missing_slots=missing_slots,
            raw_message=raw_message,
        )

    @staticmethod
    def _build_question(slot_name: str) -> SlotQuestion:
        if slot_name == "departure":
            return SlotQuestion(
                slot="departure",
                question="Bạn muốn khởi hành từ đâu?",
                options=["Hà Nội", "TP.HCM", "Đà Nẵng"],
            )
        if slot_name == "destination":
            return SlotQuestion(
                slot="destination",
                question="Bạn muốn đi đến đâu?",
                options=["Hà Nội", "TP.HCM", "Đà Nẵng", "Phú Quốc"],
            )
        if slot_name == "date":
            return SlotQuestion(
                slot="date",
                question="Bạn muốn đi ngày nào?",
                options=["2026-06-10", "2026-06-11", "2026-06-15"],
            )
        if slot_name == "transport":
            return SlotQuestion(
                slot="transport",
                question="Bạn muốn đi bằng gì?",
                options=["Máy bay", "Tàu hỏa", "Xe khách"],
            )
        return SlotQuestion(
            slot="passengers",
            question="Bạn muốn đặt cho bao nhiêu hành khách?",
            options=["1", "2", "3", "4"],
        )


trip_state_service = TripStateService()
