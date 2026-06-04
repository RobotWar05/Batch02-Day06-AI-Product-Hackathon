from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.config import CHAT_SESSIONS_FILE
from app.models.auth import UserRecord
from app.models.session import AssistantTurnResponse, ChatSessionRecord, CurrentTripState, SessionMessage
from app.services.auth_service import auth_service
from app.services.ai_parser_service import ai_parser_service
from app.services.json_store import JsonStore
from app.services.trip_state_service import trip_state_service


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
            current_trip_state=None,
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

    def post_message(
        self,
        session_id: str,
        content: str,
    ) -> tuple[ChatSessionRecord, SessionMessage, SessionMessage, AssistantTurnResponse]:
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
            parsed_state = ai_parser_service.parse_message(
                message=message_content,
                session_state=session.current_trip_state,
            )
            response = trip_state_service.build_decision(parsed_state)
            user_message = SessionMessage(
                id=str(uuid4()),
                role="user",
                content=message_content,
                created_at=now,
            )
            assistant_message = SessionMessage(
                id=str(uuid4()),
                role="assistant",
                content=response.message,
                created_at=now,
                response_type=response.response_type,
                payload=parsed_state.model_dump(mode="json"),
                next_action=response.next_action,
            )

            session.messages.extend([user_message, assistant_message])
            session.current_trip_state = parsed_state
            session.updated_at = now
            sessions[index] = session
            self.session_store.write(
                [stored_session.model_dump(mode="json") for stored_session in sessions]
            )
            return session, user_message, assistant_message, response

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found.",
        )

    def patch_trip_state(
        self,
        session_id: str,
        updates: dict[str, object],
    ) -> tuple[ChatSessionRecord, CurrentTripState, SessionMessage, AssistantTurnResponse]:
        sessions = self._read_sessions()
        for index, session in enumerate(sessions):
            if session.id != session_id:
                continue

            if session.current_trip_state is None or session.current_trip_state.intent != "search_trip":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Session does not have an active trip state.",
                )

            normalized_updates = ai_parser_service.normalize_slot_updates(updates)
            merged_slots = session.current_trip_state.slots.model_copy(
                update=normalized_updates.model_dump(exclude_none=True)
            )
            updated_state = trip_state_service.rebuild_state_from_slots(
                slots=merged_slots,
                raw_message="[correction] " + ", ".join(
                    f"{field_name}={value}"
                    for field_name, value in normalized_updates.model_dump(exclude_none=True).items()
                ),
            )
            response = trip_state_service.build_decision(updated_state)
            now = datetime.now(timezone.utc)
            assistant_message = SessionMessage(
                id=str(uuid4()),
                role="assistant",
                content="Thông tin chuyến đi đã được cập nhật.",
                created_at=now,
                response_type=response.response_type,
                payload=updated_state.model_dump(mode="json"),
                next_action=response.next_action,
            )

            session.current_trip_state = updated_state
            session.messages.append(assistant_message)
            session.updated_at = now
            sessions[index] = session
            self.session_store.write(
                [stored_session.model_dump(mode="json") for stored_session in sessions]
            )
            return session, updated_state, assistant_message, response

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

session_service = SessionService()
