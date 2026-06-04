from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Any

from app.services.trip_service import trip_service

router = APIRouter(prefix="", tags=["trip"])


class PatchTripStateRequest(BaseModel):
    departure: str | None = None
    destination: str | None = None
    date: str | None = None
    return_date: str | None = None
    is_round_trip: bool | None = None
    transport: str | None = None
    passengers: int | None = None


@router.patch("/sessions/{session_id}/trip-state")
def patch_trip_state(session_id: str, payload: PatchTripStateRequest) -> Any:
    # Filter non-None values to build patch dict
    patch_dict = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    # Try to load session to make sure it exists
    from app.services.session_service import session_service
    session_service.get_session(session_id)
    
    return trip_service.patch_trip_state(session_id, patch_dict)


@router.post("/sessions/{session_id}/search")
def search_trips(session_id: str) -> Any:
    # Try to load session to make sure it exists
    from app.services.session_service import session_service
    session_service.get_session(session_id)
    
    return trip_service.search_trips(session_id)
