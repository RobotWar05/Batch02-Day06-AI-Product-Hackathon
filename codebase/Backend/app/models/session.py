from datetime import datetime
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, Field


class TripSlots(BaseModel):
    departure: str | None = None
    destination: str | None = None
    date: str | None = None
    transport: str | None = None
    passengers: int = 1


class CurrentTripState(BaseModel):
    intent: Literal["search_trip", "faq", "unknown"]
    slots: TripSlots
    confidence: float = Field(..., ge=0.0, le=1.0)
    missing_slots: list[str] = Field(default_factory=list)
    raw_message: str


class SessionMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)
    created_at: datetime
    response_type: str | None = None
    payload: dict[str, Any] | None = None
    next_action: str | None = None


class ChatSessionRecord(BaseModel):
    id: str
    user_id: str
    title: str
    messages: list[SessionMessage] = Field(default_factory=list)
    current_trip_state: CurrentTripState | None = None
    created_at: datetime
    updated_at: datetime


class CreateSessionRequest(BaseModel):
    title: str | None = Field(default=None, description="Optional session title")


class CreateSessionResponse(BaseModel):
    status: Literal["ok"] = "ok"
    session: ChatSessionRecord


class ListSessionsResponse(BaseModel):
    status: Literal["ok"] = "ok"
    sessions: list[ChatSessionRecord]


class GetSessionResponse(BaseModel):
    status: Literal["ok"] = "ok"
    session: ChatSessionRecord


class PostMessageRequest(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        description="User message content",
        validation_alias=AliasChoices("content", "message"),
    )


class ParseMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message content to parse")
    session_state: CurrentTripState | None = None


class ParseMessageResponse(BaseModel):
    status: Literal["ok"] = "ok"
    parsed: CurrentTripState


class PostMessageResponse(BaseModel):
    status: Literal["ok"] = "ok"
    session: ChatSessionRecord
    user_message: SessionMessage
    assistant_message: SessionMessage
