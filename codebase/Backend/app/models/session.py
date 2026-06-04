from datetime import datetime
from typing import Any, Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, model_validator


class TripSlots(BaseModel):
    departure: str | None = None
    destination: str | None = None
    date: str | None = None
    transport: str | None = None
    passengers: int | None = None


class CurrentTripState(BaseModel):
    intent: Literal["search_trip", "faq", "unrelated"]
    slots: TripSlots
    confidence: float = Field(..., ge=0.0, le=1.0)
    missing_slots: list[str] = Field(default_factory=list)
    pending_slot: Literal["departure", "destination", "date", "transport", "passengers"] | None = None
    search_status: Literal["collecting", "ready", "searched", "not_applicable"] = "not_applicable"
    is_unsafe: bool = False
    last_tool_calls: list[dict[str, Any]] = Field(default_factory=list)
    raw_message: str


class SlotQuestion(BaseModel):
    slot: Literal["departure", "destination", "date", "transport", "passengers"]
    question: str
    options: list[str] = Field(default_factory=list)


class AssistantTurnResponse(BaseModel):
    response_type: Literal["text", "slot_filling", "trip_widget", "search_results", "error"]
    message: str
    payload: dict[str, Any] = Field(default_factory=dict)
    next_action: str | None = None


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
    response: AssistantTurnResponse


class TripStatePatchFields(BaseModel):
    model_config = ConfigDict(extra="forbid")

    departure: str | None = None
    destination: str | None = None
    date: str | None = None
    transport: str | None = None
    passengers: int | None = Field(default=None, ge=1)


class PatchTripStateRequest(BaseModel):
    updates: TripStatePatchFields

    @model_validator(mode="after")
    def validate_updates_not_empty(self) -> "PatchTripStateRequest":
        if not self.updates.model_dump(exclude_none=True):
            raise ValueError("updates must include at least one supported field.")
        return self


class PatchTripStateResponse(BaseModel):
    status: Literal["ok"] = "ok"
    session: ChatSessionRecord
    trip_state: CurrentTripState
    assistant_message: SessionMessage
    response: AssistantTurnResponse
