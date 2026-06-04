from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_ROOT / "data"
CODEBASE_ROOT = BACKEND_ROOT.parent
PROJECT_DATA_DIR = CODEBASE_ROOT / "Data"
USERS_FILE = DATA_DIR / "users.json"
CHAT_SESSIONS_FILE = DATA_DIR / "chat_sessions.json"
MOCK_TRIPS_FILE = DATA_DIR / "mock_trips.json"
TRIPS_MANIFEST_FILE = PROJECT_DATA_DIR / "trips" / "trips_manifest.json"
QUERY_SCHEMA_FILE = PROJECT_DATA_DIR / "schemas" / "query_schema.json"
RESPONSE_SCHEMA_FILE = PROJECT_DATA_DIR / "schemas" / "response_schema.json"
FALLBACK_RULES_FILE = PROJECT_DATA_DIR / "rules" / "fallback_rules.json"
RANKING_RULES_FILE = PROJECT_DATA_DIR / "rules" / "ranking_rules.json"
