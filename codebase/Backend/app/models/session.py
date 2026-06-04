from datetime import datetime
from typing import Literal

from pydantic import AliasChoices, BaseModel, Field


class SessionMessage(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1)
    created_at: datetime


class ChatSessionRecord(BaseModel):
    id: str
    user_id: str
    title: str
    messages: list[SessionMessage] = Field(default_factory=list)
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


class PostMessageResponse(BaseModel):
    status: Literal["ok"] = "ok"
    session: ChatSessionRecord
    user_message: SessionMessage
    assistant_message: SessionMessage
