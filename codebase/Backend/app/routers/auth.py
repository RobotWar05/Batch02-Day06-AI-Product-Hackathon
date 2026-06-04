from fastapi import APIRouter

from app.models.auth import LoginRequest, LoginResponse
from app.services.auth_service import auth_service


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    return auth_service.login(payload)
