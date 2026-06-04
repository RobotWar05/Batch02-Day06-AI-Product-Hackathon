# Backend Deliver Plan — Trip.com Price Comparison Chatbot

## 1. Tổng quan backend

Backend của project đóng vai trò là **orchestrator** cho toàn bộ flow chatbot:

```text
User login
    ↓
User chọn / tạo chat session
    ↓
User gửi message tự nhiên
    ↓
Backend detect intent
    ↓
Backend extract trip slots
    ↓
Backend validate thiếu / sai / không chắc
    ↓
Backend trả widget / follow-up question / search results
    ↓
Lưu lại toàn bộ chat theo session của user
```

Project demo không cần auth thật. Mục tiêu là có một màn hình login tối giản để phân biệt user và lưu lịch sử chat theo từng user.

---

## 2. Auth demo requirements

### Mục tiêu

Có màn hình login tối giản:

```text
User nhập username + password
Nếu username chưa tồn tại → tạo user mới
Nếu username đã tồn tại → login vào user đó
Password nhập gì cũng được
Không lưu password
```

Auth chỉ dùng để:

- Biết chat session thuộc user nào.
- Hiển thị lịch sử chat theo từng user.
- Cho phép một user có nhiều chat session.
- Làm demo giống app thật hơn.

---

## 3. Auth API

### `POST /auth/login`

#### Request

```json
{
  "username": "bach",
  "password": "anything"
}
```

#### Backend logic

```text
1. Normalize username: trim, lowercase.
2. Check users.json.
3. Nếu user chưa tồn tại → tạo user mới.
4. Nếu user đã tồn tại → login luôn.
5. Trả về user_id + username.
```

#### Response

```json
{
  "user_id": "user_bach",
  "username": "bach",
  "is_new_user": true
}
```

### Lưu ý

- Không cần JWT cho demo.
- Không lưu password.
- Frontend có thể lưu `user_id` trong `localStorage`.
- Nếu muốn demo sạch hơn, có thể tạo thêm `session_token` fake, nhưng không bắt buộc.

---

## 4. JSON database design

Vì demo nhỏ, có thể dùng file JSON thay database thật.

### Folder đề xuất

```text
backend/
  data/
    users.json
    chat_sessions.json
    mock_trips.json
```

---

## 5. `users.json`

```json
{
  "users": [
    {
      "user_id": "user_bach",
      "username": "bach",
      "created_at": "2026-06-04T10:00:00Z"
    },
    {
      "user_id": "user_demo",
      "username": "demo",
      "created_at": "2026-06-04T10:10:00Z"
    }
  ]
}
```

### Rule

- `username` là unique.
- `username` nên được normalize về lowercase.
- Không lưu password.

---

## 6. `chat_sessions.json`

Một user có thể có nhiều chat session.

```json
{
  "sessions": [
    {
      "session_id": "sess_001",
      "user_id": "user_bach",
      "title": "Tìm vé TP.HCM đi Đà Nẵng",
      "created_at": "2026-06-04T10:20:00Z",
      "updated_at": "2026-06-04T10:25:00Z",
      "messages": [
        {
          "role": "user",
          "content": "Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6",
          "created_at": "2026-06-04T10:20:10Z"
        },
        {
          "role": "assistant",
          "response_type": "trip_widget",
          "content": "Tôi đã tìm thấy thông tin chuyến đi của bạn",
          "payload": {
            "departure": "TP.HCM",
            "destination": "Đà Nẵng",
            "date": "2026-06-10",
            "transport": "train",
            "passengers": 2
          },
          "created_at": "2026-06-04T10:20:15Z"
        }
      ],
      "current_trip_state": {
        "intent": "search_trip",
        "slots": {
          "departure": "TP.HCM",
          "destination": "Đà Nẵng",
          "date": "2026-06-10",
          "transport": "train",
          "passengers": 2
        },
        "confidence": 0.96,
        "status": "ready_to_search"
      }
    }
  ]
}
```

### Điểm quan trọng

Mỗi session nên lưu `current_trip_state` vì user có thể:

- Bổ sung thông tin còn thiếu.
- Sửa field AI hiểu sai.
- Tìm lại kết quả sau khi chỉnh.
- Quay lại session cũ và tiếp tục flow.

---

## 7. Chat session APIs

## 7.1. Tạo chat session mới

### `POST /users/{user_id}/sessions`

Frontend gọi API này khi user bấm **New chat**.

#### Request

```json
{
  "title": "New chat"
}
```

#### Response

```json
{
  "session_id": "sess_abc123",
  "user_id": "user_bach",
  "title": "New chat",
  "created_at": "2026-06-04T10:00:00Z"
}
```

---

## 7.2. Lấy danh sách chat session của user

### `GET /users/{user_id}/sessions`

Frontend dùng API này để render sidebar hoặc chat history.

#### Response

```json
{
  "sessions": [
    {
      "session_id": "sess_001",
      "title": "Tìm vé TP.HCM đi Đà Nẵng",
      "updated_at": "2026-06-04T10:25:00Z"
    },
    {
      "session_id": "sess_002",
      "title": "Hà Nội đi Phú Quốc",
      "updated_at": "2026-06-04T11:00:00Z"
    }
  ]
}
```

---

## 7.3. Lấy nội dung một chat session

### `GET /sessions/{session_id}`

#### Response

```json
{
  "session_id": "sess_001",
  "user_id": "user_bach",
  "title": "Tìm vé TP.HCM đi Đà Nẵng",
  "messages": [
    {
      "role": "user",
      "content": "Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6"
    },
    {
      "role": "assistant",
      "response_type": "trip_widget",
      "content": "Tôi đã tìm thấy thông tin chuyến đi của bạn",
      "payload": {
        "departure": "TP.HCM",
        "destination": "Đà Nẵng",
        "date": "2026-06-10",
        "transport": "train",
        "passengers": 2
      }
    }
  ],
  "current_trip_state": {
    "intent": "search_trip",
    "status": "ready_to_search"
  }
}
```

---

## 8. Chat message API

### `POST /sessions/{session_id}/messages`

#### Request

```json
{
  "message": "Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6"
}
```

#### Backend flow

```text
1. Load session từ chat_sessions.json.
2. Append user message.
3. Chạy intent classifier.
4. Nếu intent = search_trip:
   - Extract entities.
   - Validate slots.
   - Update current_trip_state.
   - Return trip_widget / slot_filling / low_confidence confirmation.
5. Append assistant response vào session.
6. Save lại chat_sessions.json.
```

#### Response example — Happy Path

```json
{
  "response_type": "trip_widget",
  "message": "Tôi đã tìm thấy thông tin chuyến đi của bạn",
  "payload": {
    "departure": "TP.HCM",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "transport": "train",
    "passengers": 2,
    "editable_fields": [
      "departure",
      "destination",
      "date",
      "transport",
      "passengers"
    ]
  },
  "next_action": "show_widget"
}
```

---

## 9. Slot filling API behavior

Khi user thiếu thông tin, backend trả quick options để frontend render thành button.

### Example user message

```text
Tìm vé đi Đà Nẵng ngày 10/6
```

Backend phát hiện thiếu:

```json
{
  "missing_slots": ["departure", "transport"]
}
```

### Response

```json
{
  "response_type": "slot_filling",
  "message": "Tôi cần thêm thông tin",
  "payload": {
    "missing_slots": ["departure", "transport"],
    "questions": [
      {
        "slot": "departure",
        "question": "Bạn muốn khởi hành từ đâu?",
        "options": ["Hà Nội", "TP.HCM", "Khác"]
      },
      {
        "slot": "transport",
        "question": "Bạn muốn đi bằng gì?",
        "options": ["Máy bay", "Tàu hỏa", "Xe khách"]
      }
    ]
  }
}
```

### UX requirement

Không hỏi bằng text dài. Backend nên trả options rõ ràng để frontend render quick buttons.

---

## 10. Update slot / correction API

### `PATCH /sessions/{session_id}/trip-state`

Dùng khi user sửa field AI hiểu sai hoặc bổ sung field còn thiếu.

#### Request

```json
{
  "transport": "train"
}
```

#### Backend flow

```text
1. Load session.
2. Update current_trip_state.slots.transport = train.
3. Validate lại slots.
4. Append assistant response dạng updated trip_widget.
5. Save session.
6. Return widget mới.
```

#### Response

```json
{
  "response_type": "trip_widget",
  "message": "Thông tin chuyến đi đã được cập nhật",
  "payload": {
    "departure": "Hà Nội",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "transport": "train",
    "passengers": 1
  },
  "next_action": "ready_to_search"
}
```

### Mục tiêu

User chỉ cần sửa field sai, không cần nhập lại toàn bộ câu hỏi.

---

## 11. Search results API

### `POST /sessions/{session_id}/search`

Không nhất thiết cần truyền lại toàn bộ slot, vì backend đã có `current_trip_state`.

#### Request

```json
{}
```

#### Backend flow

```text
1. Load current_trip_state.
2. Check đủ departure, destination, date, transport.
3. Search trong mock_trips.json.
4. Append assistant response dạng trip_results.
5. Save session.
6. Return results.
```

#### Response

```json
{
  "response_type": "trip_results",
  "message": "Kết quả phù hợp",
  "payload": {
    "results": [
      {
        "id": "SE1",
        "name": "SE1",
        "departure": "TP.HCM",
        "destination": "Đà Nẵng",
        "departure_time": "08:00",
        "arrival_time": "23:15",
        "price": 1250000,
        "currency": "VND",
        "transport": "train"
      },
      {
        "id": "SE3",
        "name": "SE3",
        "departure": "TP.HCM",
        "destination": "Đà Nẵng",
        "departure_time": "13:00",
        "arrival_time": "04:30",
        "price": 1150000,
        "currency": "VND",
        "transport": "train"
      }
    ]
  }
}
```

---

## 12. Response types

Backend nên trả response theo type cố định để frontend dễ render.

```text
text
slot_filling
trip_widget
trip_results
error
```

### Example unified response shape

```json
{
  "response_type": "trip_widget",
  "message": "Tôi đã tìm thấy thông tin chuyến đi của bạn",
  "payload": {
    "departure": "TP.HCM",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "transport": "train",
    "passengers": 2
  },
  "next_action": "show_widget"
}
```

---

## 13. Backend module structure

```text
backend/
  main.py

  routers/
    auth.py
    sessions.py
    chat.py
    trip.py

  services/
    auth_service.py
    session_service.py
    json_db.py
    intent_service.py
    entity_extractor.py
    slot_validator.py
    trip_state_service.py
    search_service.py

  schemas/
    auth.py
    session.py
    chat.py
    trip.py

  data/
    users.json
    chat_sessions.json
    mock_trips.json
```

---

## 14. JSON DB helper

Nên viết một service riêng:

```text
services/json_db.py
```

### Nhiệm vụ

```text
read_json(path)
write_json(path, data)
find_user_by_username(username)
create_user(username)
find_sessions_by_user(user_id)
find_session_by_id(session_id)
save_session(session)
append_message(session_id, message)
update_trip_state(session_id, trip_state)
```

### Lưu ý

JSON file ổn cho demo, nhưng nếu có nhiều request ghi cùng lúc thì có thể conflict.

Với demo local 1 nhóm thì chấp nhận được.

---

## 15. Core backend services

## 15.1. Intent Classifier

Phân loại message thành:

```text
search_trip
book_ticket
cancel_ticket
check_order
faq
unknown
```

MVP chỉ cần làm tốt `search_trip`.

---

## 15.2. Entity Extractor

Trích xuất các field:

```text
departure
destination
date
transport
passengers
```

### Normalization examples

| User nói | Backend chuẩn hóa |
|---|---|
| Sài Gòn | TP.HCM |
| Hồ Chí Minh | TP.HCM |
| tàu hỏa | train |
| máy bay | flight |
| xe khách | bus |
| 10/6 | 2026-06-10 |
| 2 vé | passengers = 2 |

---

## 15.3. Slot Validator

Nhiệm vụ:

```text
Check thiếu field nào
Check confidence
Check field có hợp lệ không
Quyết định next action
```

### Required slots

| Slot | Required? | Default |
|---|---:|---|
| departure | Yes | None |
| destination | Yes | None |
| date | Yes | None |
| transport | Yes | None |
| passengers | No | 1 |

### Possible next actions

```text
ask_follow_up
show_widget
search_results
confirm_low_confidence
```

---

## 15.4. Trip State Service

Quản lý `current_trip_state` trong từng session.

```json
{
  "intent": "search_trip",
  "slots": {
    "departure": "Hà Nội",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "transport": "train",
    "passengers": 1
  },
  "confidence": {
    "departure": 0.94,
    "destination": 0.97,
    "date": 0.88,
    "transport": 0.62
  },
  "status": "awaiting_confirmation"
}
```

---

## 15.5. Search Provider Layer

Vì đây là demo/prototype, backend có thể chưa cần Trip.com API thật.

### Search mode

| Mode | Dùng khi nào |
|---|---|
| Mock data | Demo hackathon / workshop |
| External API | Nếu tìm được API phù hợp |

MVP nên bắt đầu bằng mock search data để đảm bảo flow end-to-end chạy được.

---

## 16. Updated MVP priorities

| Priority | Requirement | Ghi chú |
|---|---|---|
| P0 | Login bằng username | Không lưu password |
| P0 | Auto-create user nếu chưa có | Demo nhanh |
| P0 | Lưu users vào `users.json` | JSON DB |
| P0 | Tạo nhiều chat session theo user | Cần cho history |
| P0 | Lưu messages theo session | User quay lại xem được |
| P0 | Lưu `current_trip_state` theo session | Cần cho correction flow |
| P0 | Parse intent + slots | Core AI flow |
| P0 | Slot validation | Happy / low-confidence |
| P0 | Update slot khi user sửa | Correction path |
| P0 | Mock search results | Demo end-to-end |
| P1 | Auto-generate session title từ message đầu | UI đẹp hơn |
| P1 | Confidence per field | Dễ demo failure/low confidence |
| P1 | Delete session | Nice to have |
| P2 | Real Trip.com/search API | Chưa cần cho demo |
| P2 | Password/JWT/auth thật | Không cần cho demo |

---

## 17. Backend API summary

```text
POST   /auth/login
POST   /users/{user_id}/sessions
GET    /users/{user_id}/sessions
GET    /sessions/{session_id}
POST   /sessions/{session_id}/messages
PATCH  /sessions/{session_id}/trip-state
POST   /sessions/{session_id}/search
```

---

## 18. Final deliverable

Backend cần deliver được:

```text
1. Login bằng username.
2. Auto-create user nếu username chưa tồn tại.
3. Lưu user vào users.json.
4. Tạo nhiều chat session theo user.
5. Lưu messages theo session.
6. Lưu current_trip_state theo session.
7. Nhận message tự nhiên từ user.
8. Detect intent.
9. Extract trip slots.
10. Validate thiếu / sai / không chắc.
11. Trả slot filling quick options.
12. Trả trip widget schema.
13. Cho user update từng slot.
14. Search mock trip results.
15. Trả results dạng card.
16. Lưu toàn bộ assistant response vào session.
```

Nói gọn lại:

```text
Username login
        ↓
User profile in users.json
        ↓
Multiple chat sessions per user
        ↓
Each session stores messages + current trip state
        ↓
AI flow can continue, correct, search, and save history
```

Với hướng này, demo sẽ có cảm giác giống app thật hơn mà vẫn đủ nhẹ để nhóm 4 người làm nhanh.
