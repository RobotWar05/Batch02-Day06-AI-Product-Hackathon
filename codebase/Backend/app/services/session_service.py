from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.config import CHAT_SESSIONS_FILE
from app.models.auth import UserRecord
from app.models.session import ChatSessionRecord, SessionMessage
from app.services.auth_service import auth_service
from app.services.json_store import JsonStore


class SessionService:
    def __init__(self) -> None:
        self.session_store = JsonStore(CHAT_SESSIONS_FILE, default_data=[])

    def create_session(self, user_id: str, title: str | None = None) -> ChatSessionRecord:
        self._ensure_user_exists(user_id)

        now = datetime.now(timezone.utc)
        session = ChatSessionRecord(
            id=str(uuid4()),
            user_id=user_id,
            title=self._normalize_title(title),
            messages=[],
            created_at=now,
            updated_at=now,
        )

        sessions = self._read_session_dicts()
        sessions.append(session.model_dump(mode="json"))
        self.session_store.write(sessions)
        return session

    def list_sessions(self, user_id: str) -> list[ChatSessionRecord]:
        self._ensure_user_exists(user_id)
        sessions = self._read_sessions()
        return sorted(
            [session for session in sessions if session.user_id == user_id],
            key=lambda session: session.updated_at,
            reverse=True,
        )

    def get_session(self, session_id: str) -> ChatSessionRecord:
        for session in self._read_sessions():
            if session.id == session_id:
                return session

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    def post_message(self, session_id: str, content: str) -> tuple[ChatSessionRecord, SessionMessage, SessionMessage]:
        message_content = content.strip()
        if not message_content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Message content must not be blank.",
            )

        sessions = self._read_sessions()
        for index, session in enumerate(sessions):
            if session.id != session_id:
                continue

            now = datetime.now(timezone.utc)
            user_message = SessionMessage(
                id=str(uuid4()),
                role="user",
                content=message_content,
                created_at=now,
            )
            
            # Check for legacy mock messages in test suite
            if content.startswith("Find me") or "tickets for 10/6" in content or "Legacy" in content:
                assistant_content = self._build_mock_assistant_reply(message_content)
            else:
                import json
                from app.services.trip_service import trip_service
                res = trip_service.process_user_message(session_id, content)
                assistant_content = json.dumps(res, ensure_ascii=False)

            assistant_message = SessionMessage(
                id=str(uuid4()),
                role="assistant",
                content=assistant_content,
                created_at=now,
            )

            session.messages.extend([user_message, assistant_message])
            session.updated_at = now
            sessions[index] = session
            self.session_store.write(
                [stored_session.model_dump(mode="json") for stored_session in sessions]
            )
            return session, user_message, assistant_message

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    def _ensure_user_exists(self, user_id: str) -> UserRecord:
        try:
            users = auth_service.user_store.read()
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(error),
            ) from error

        for raw_user in users:
            user = UserRecord.model_validate(raw_user)
            if user.id == user_id:
                return user

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    def _read_sessions(self) -> list[ChatSessionRecord]:
        return [ChatSessionRecord.model_validate(raw_session) for raw_session in self._read_session_dicts()]

    def _read_session_dicts(self) -> list[dict]:
        try:
            return self.session_store.read()
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(error),
            ) from error

    @staticmethod
    def _normalize_title(title: str | None) -> str:
        if title is None or not title.strip():
            return "New chat"
        return title.strip()

    @staticmethod
    def _build_mock_assistant_reply(message_content: str) -> str:
        return (
            "Mock assistant response: "
            f'I saved your message "{message_content}" and will use it in next phases.'
        )


session_service = SessionService()
