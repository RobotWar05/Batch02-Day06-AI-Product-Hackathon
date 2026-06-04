# Backend API Doc - AI Đi Không

Tài liệu này mô tả API backend cần có để nối với frontend demo **AI Đi Không**.

## Trạng thái hiện tại

Phase 0 đến Phase 3 đã được scaffold:

- FastAPI app có `GET /health`
- Router chính: `auth`, `sessions`, `chat`, `trip`
- JSON data store: `data/users.json`, `data/chat_sessions.json`, `data/mock_trips.json`
- `POST /auth/login` theo flow username-only
- `POST /users/{user_id}/sessions` để tạo chat session
- `GET /users/{user_id}/sessions` để list session theo user
- `GET /sessions/{session_id}` để mở lại session cũ
- `POST /sessions/{session_id}/messages` để lưu user message + mock assistant response

## Chạy local

```bash
cd codebase/Backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Login demo:

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo user","password":"whatever"}'
```

Create session demo:

```bash
curl -X POST http://127.0.0.1:8000/users/<user_id>/sessions \
  -H "Content-Type: application/json" \
  -d '{"title":"Da Nang planning"}'
```

Post message demo:

```bash
curl -X POST http://127.0.0.1:8000/sessions/<session_id>/messages \
  -H "Content-Type: application/json" \
  -d '{"content":"Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6"}'
```

Run tests:

```bash
pytest -q
```

## 1. Kiến trúc tổng quát

```text
Frontend
  |
  | POST /api/parse
  v
Backend Parser
  |
  +-- intent classification
  +-- entity / slot extraction
  +-- confidence scoring
  +-- missing slot detection
  |
  | POST /api/search
  v
Search Tool
  |
  v
Mock Data
  |
  v
Frontend Result Cards
```

Backend nên chia 3 module:

| Module | Trách nhiệm |
|---|---|
| `parser` | Nhận text, trả intent + slots + confidence |
| `validator` | Kiểm tra slot đủ/thiếu/mơ hồ |
| `search` | Lọc mock data theo slot đã xác nhận |

## 2. Phase 2 và 3 contract

Theo `Backend_Phases.md` và `Backend_Delivery_Plan_V2.md`, backend Phase 2 và 3 cần giữ các contract sau để frontend và teammate làm AI/parser không bị block:

### Phase 2 — Chat session persistence

- `POST /users/{user_id}/sessions`
- `GET /users/{user_id}/sessions`
- `GET /sessions/{session_id}`
- Mỗi user có nhiều session riêng
- Session lưu trong `data/chat_sessions.json`
- Reload session phải trả lại `messages` và metadata

### Phase 3 — Chat message storage

- `POST /sessions/{session_id}/messages`
- Append `user` message vào đúng session
- Append `assistant` message mock ngay sau đó
- Update `updated_at` sau mỗi lần gửi
- Session khác không bị ảnh hưởng

### JSON shape hiện tại

`chat_sessions.json` lưu theo danh sách session. Mỗi session gồm:

- `id`
- `user_id`
- `title`
- `messages`
- `created_at`
- `updated_at`

Mỗi message gồm:

- `id`
- `role`
- `content`
- `created_at`
