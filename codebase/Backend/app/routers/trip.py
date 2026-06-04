from fastapi import APIRouter

from app.models.session import (
    ParseMessageRequest,
    ParseMessageResponse,
    PatchTripStateRequest,
    PatchTripStateResponse,
)
from app.services.ai_parser_service import ai_parser_service
from app.services.session_service import session_service


router = APIRouter(prefix="", tags=["trip"])


@router.post("/api/parse", response_model=ParseMessageResponse)
def parse_message(payload: ParseMessageRequest) -> ParseMessageResponse:
    parsed = ai_parser_service.parse_message(
        message=payload.message,
        session_state=payload.session_state,
    )
    return ParseMessageResponse(parsed=parsed)


@router.patch("/sessions/{session_id}/trip-state", response_model=PatchTripStateResponse)
def patch_trip_state(session_id: str, payload: PatchTripStateRequest) -> PatchTripStateResponse:
    session, trip_state, assistant_message, response = session_service.patch_trip_state(
        session_id=session_id,
        updates=payload.updates.model_dump(exclude_none=True),
    )
    return PatchTripStateResponse(
        session=session,
        trip_state=trip_state,
        assistant_message=assistant_message,
        response=response,
    )
