import re
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.config import USERS_FILE
from app.models.auth import LoginRequest, LoginResponse, UserRecord
from app.services.json_store import JsonStore


class AuthService:
    def __init__(self) -> None:
        self.user_store = JsonStore(USERS_FILE, default_data=[])

    def login(self, payload: LoginRequest) -> LoginResponse:
        username_display = payload.username.strip()
        username_normalized = self._normalize_username(payload.username)
        if not username_normalized:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Username must not be blank.",
            )

        users = self._read_users()
        now = datetime.now(timezone.utc)

        for raw_user in users:
            user = UserRecord.model_validate(raw_user)
            if user.username_normalized == username_normalized:
                user.updated_at = now
                self._replace_user(users, user)
                self.user_store.write(users)
                return LoginResponse(is_new_user=False, user=user)

        user = UserRecord(
            id=str(uuid4()),
            username=username_display,
            username_normalized=username_normalized,
            created_at=now,
            updated_at=now,
        )
        users.append(user.model_dump(mode="json"))
        self.user_store.write(users)
        return LoginResponse(is_new_user=True, user=user)

    def _read_users(self) -> list[dict]:
        try:
            return self.user_store.read()
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(error),
            ) from error

    @staticmethod
    def _normalize_username(username: str) -> str:
        normalized = re.sub(r"\s+", " ", username.strip()).casefold()
        return normalized

    @staticmethod
    def _replace_user(users: list[dict], updated_user: UserRecord) -> None:
        for index, raw_user in enumerate(users):
            if raw_user["id"] == updated_user.id:
                users[index] = updated_user.model_dump(mode="json")
                return


auth_service = AuthService()
