from fastapi import APIRouter

from app.models.session import ParseMessageRequest, ParseMessageResponse
from app.services.ai_parser_service import ai_parser_service


router = APIRouter(prefix="", tags=["trip"])


@router.post("/api/parse", response_model=ParseMessageResponse)
def parse_message(payload: ParseMessageRequest) -> ParseMessageResponse:
    parsed = ai_parser_service.parse_message(
        message=payload.message,
        session_state=payload.session_state,
    )
    return ParseMessageResponse(parsed=parsed)
