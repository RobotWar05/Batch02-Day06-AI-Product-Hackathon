import json
import logging
from typing import Any


TRACE_LOGGER = logging.getLogger("ai_di_khong.trace")
if not TRACE_LOGGER.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("[TRACE] %(message)s"))
    TRACE_LOGGER.addHandler(handler)
TRACE_LOGGER.setLevel(logging.INFO)
TRACE_LOGGER.propagate = False


def trace_event(event: str, **details: Any) -> dict[str, Any]:
    payload = {"event": event, **details}
    TRACE_LOGGER.info(json.dumps(payload, ensure_ascii=False, default=str))
    return payload
