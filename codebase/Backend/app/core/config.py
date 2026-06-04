from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_ROOT / "data"
USERS_FILE = DATA_DIR / "users.json"
CHAT_SESSIONS_FILE = DATA_DIR / "chat_sessions.json"
MOCK_TRIPS_FILE = DATA_DIR / "mock_trips.json"
