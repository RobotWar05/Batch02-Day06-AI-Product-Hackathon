from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import CHAT_SESSIONS_FILE, MOCK_TRIPS_FILE, USERS_FILE, TRIP_STATES_FILE
from app.routers import auth, chat, sessions, trip
from app.services.json_store import JsonStore


@asynccontextmanager
async def lifespan(_: FastAPI):
    JsonStore(USERS_FILE, default_data=[]).ensure_exists()
    JsonStore(CHAT_SESSIONS_FILE, default_data=[]).ensure_exists()
    JsonStore(MOCK_TRIPS_FILE, default_data=[]).ensure_exists()
    JsonStore(TRIP_STATES_FILE, default_data={}).ensure_exists()
    yield


app = FastAPI(
    title="AI Di Khong Backend",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(trip.router)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
