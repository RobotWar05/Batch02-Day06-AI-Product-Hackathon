from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, description="Username typed by user")
    password: str | None = Field(default=None, description="Ignored in Phase 1")


class UserRecord(BaseModel):
    id: str
    username: str
    username_normalized: str
    created_at: datetime
    updated_at: datetime


class LoginResponse(BaseModel):
    status: Literal["ok"] = "ok"
    is_new_user: bool
    user: UserRecord
