from fastapi import APIRouter

from app.models.session import PostMessageRequest, PostMessageResponse
from app.services.session_service import session_service

router = APIRouter(prefix="", tags=["chat"])


@router.post("/sessions/{session_id}/messages", response_model=PostMessageResponse)
def post_message(session_id: str, payload: PostMessageRequest) -> PostMessageResponse:
    session, user_message, assistant_message = session_service.post_message(
        session_id=session_id,
        content=payload.content,
    )
    return PostMessageResponse(
        session=session,
        user_message=user_message,
        assistant_message=assistant_message,
    )
