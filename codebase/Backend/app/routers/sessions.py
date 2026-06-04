from fastapi import APIRouter

from app.models.session import (
    CreateSessionRequest,
    CreateSessionResponse,
    GetSessionResponse,
    ListSessionsResponse,
)
from app.services.session_service import session_service

router = APIRouter(prefix="", tags=["sessions"])


@router.post("/users/{user_id}/sessions", response_model=CreateSessionResponse)
def create_session(user_id: str, payload: CreateSessionRequest) -> CreateSessionResponse:
    session = session_service.create_session(user_id=user_id, title=payload.title)
    return CreateSessionResponse(session=session)


@router.get("/users/{user_id}/sessions", response_model=ListSessionsResponse)
def list_sessions(user_id: str) -> ListSessionsResponse:
    sessions = session_service.list_sessions(user_id=user_id)
    return ListSessionsResponse(sessions=sessions)


@router.get("/sessions/{session_id}", response_model=GetSessionResponse)
def get_session(session_id: str) -> GetSessionResponse:
    session = session_service.get_session(session_id=session_id)
    return GetSessionResponse(session=session)
