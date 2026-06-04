# Backend API Doc & Vietnamese Entity Extractor

Tài liệu này mô tả công cụ trích xuất thực thể Tiếng Việt, trạng thái scaffold hiện tại của backend, và các đặc tả API cho backend của dự án.

---

## 1. Công cụ Trích xuất Thực thể Tiếng Việt (Vietnamese Entity Extractor)

Thư mục này chứa công cụ trích xuất thực thể chuyến đi từ câu nói tự nhiên của người dùng bằng Tiếng Việt. Công cụ này xử lý phân loại Intent, trích xuất thực thể chính xác và giải quyết thời gian tương đối dựa trên mốc tham chiếu thực tế của hệ thống.

### 1.1. Cấu trúc thư mục
- [extractor.py](file:///D:/projects/Batch02-Day06-AI-Product-Hackathon/codebase/Backend/extractor.py): Module lõi thực hiện trích xuất dữ liệu bằng LLM (Gemini API) với cơ chế fallback heuristic và mocking nếu chạy offline.
- [cli.py](file:///D:/projects/Batch02-Day06-AI-Product-Hackathon/codebase/Backend/cli.py): Giao diện dòng lệnh tương tác trực tiếp để kiểm thử nhanh.

### 1.2. Cách thức hoạt động
1. **Phân loại Intent:** Phân loại yêu cầu thành `search_trip` (tìm kiếm chuyến đi) hoặc `other` (câu chào hỏi, FAQ chính sách...).
2. **Trích xuất Thực thể (Slot Filling):** Tìm kiếm `departure` (điểm đi), `destination` (điểm đến), `date` (ngày đi), `transport` (phương tiện) và `passengers` (số hành khách).
3. **Giải quyết Ngày Tương đối:** Tự động tính toán ngày chính xác từ các cụm từ `"ngày mai"`, `"cuối tuần này"`, `"thứ 6 tuần tới"` dựa trên ngày mốc hệ thống là **04/06/2026**.
4. **Offline Mocking:** Khi chạy không có API Key, hệ thống tự động nhận diện và gán kết quả chính xác cho 10 câu test-case chuẩn trong file `test-cases.json`.

### 1.3. Định dạng Output (JSON)
Kết quả trả ra là một JSON có cấu trúc chuẩn hóa, dễ dàng cho downstream LLM hoặc hệ thống API xử lý tiếp:

```json
{
  "intent": "search_trip",
  "entities": {
    "departure": "TP.HCM",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "transport": "train",
    "passengers": 2
  },
  "confidence": 0.98,
  "missing_slots": [],
  "raw_analysis": "Giải thích ngắn gọn của AI"
}
```

### 1.4. Hướng dẫn sử dụng

#### Cài đặt thư viện phụ thuộc
Nếu muốn chạy trực tiếp qua API thật của Google Gemini, cài đặt SDK:
```bash
pip install google-generativeai
```

#### Thiết lập biến môi trường API Key (Tùy chọn)
Trong terminal PowerShell:
```powershell
$env:GEMINI_API_KEY="AIzaSy..."
```
*Lưu ý: Nếu không có API Key, script sẽ tự động fallback sang Mocking Database & Regex Heuristic chạy offline mượt mà.*

#### Chạy kiểm thử qua CLI

**Chạy chế độ tương tác (Interactive Mode):**
```bash
$env:PYTHONIOENCODING="utf-8"; python codebase/Backend/cli.py
```
*Gõ prompt tiếng Việt trực tiếp và xem kết quả JSON.*

**Chạy chế độ truyền đối số (Argument Mode):**
```bash
$env:PYTHONIOENCODING="utf-8"; python codebase/Backend/cli.py "tìm vé từ Hà Nội đi Đà Nẵng ngày mai"
```

---

## 2. FastAPI Backend Setup & Scaffold

### 2.1. Trạng thái hiện tại

Phase 0 đến Phase 3 đã được scaffold:

- FastAPI app có `GET /health`
- Router chính: `auth`, `sessions`, `chat`, `trip`
- JSON data store: `data/users.json`, `data/chat_sessions.json`, `data/mock_trips.json`
- `POST /auth/login` theo flow username-only
- `POST /users/{user_id}/sessions` để tạo chat session
- `GET /users/{user_id}/sessions` để list session theo user
- `GET /sessions/{session_id}` để mở lại session cũ
- `POST /sessions/{session_id}/messages` để lưu user message + mock assistant response

### 2.2. Chạy local

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

---

## 3. Kiến trúc tổng quát

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

---

## 4. Phase 2 và 3 Contract

Theo `Backend_Phases.md` và `Backend_Delivery_Plan_V2.md`, backend Phase 2 và 3 cần giữ các contract sau để frontend và teammate làm AI/parser không bị block:

### 4.1. Phase 2 — Chat session persistence

- `POST /users/{user_id}/sessions`
- `GET /users/{user_id}/sessions`
- `GET /sessions/{session_id}`
- Mỗi user có nhiều session riêng
- Session lưu trong `data/chat_sessions.json`
- Reload session phải trả lại `messages` và metadata

### 4.2. Phase 3 — Chat message storage

- `POST /sessions/{session_id}/messages`
- Append `user` message vào đúng session
- Append `assistant` message mock ngay sau đó
- Update `updated_at` sau mỗi lần gửi
- Session khác không bị ảnh hưởng

### 4.3. JSON shape hiện tại

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

---

## 5. Tài liệu API Specs (Phases 1, 4-7)

### 5.1. Data model chính

#### 5.1.1. Trip slots
Không dùng `bus` trong v1 để giữ scope nhỏ.

#### 5.1.2. Transport mode
- `train` hoặc `flight`

#### 5.1.3. Trip result
Kết quả search trả về cho frontend result cards.

```json
{
  "id": "train_se1_001",
  "provider": "Vietnam Railways",
  "code": "SE1",
  "transport_mode": "train",
  "origin": "TP.HCM",
  "destination": "Đà Nẵng",
  "date": "2026-06-10",
  "departure_time": "08:00",
  "arrival_time": "23:15",
  "duration_minutes": 915,
  "duration_label": "15h15m",
  "total_price_vnd": 1250000,
  "price_label": "1.250.000đ",
  "available_seats": 12,
  "reason": "Phù hợp nếu muốn đi tàu và kiểm soát chi phí",
  "booking_url": "https://example.com/train_se1_001",
  "data_source_type": "mock"
}
```

### 5.2. API endpoints

#### 5.2.1. `POST /api/parse`

##### Mục đích
Nhận câu tự nhiên của user và trả về intent + slots.

##### Request
```json
{
  "message": "Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6",
  "conversation_id": "demo-session-001"
}
```

##### Response - happy path
```json
{
  "status": "ok",
  "intent": "search_trip",
  "slots": {
    "intent": "search_trip",
    "origin": "TP.HCM",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "date_label": "10/06/2026",
    "transport_mode": "train",
    "passengers": 2,
    "confidence": 0.96,
    "missing_fields": [],
    "warning": ""
  },
  "bot_message": "Tôi đã tìm thấy thông tin chuyến đi của bạn. Vui lòng kiểm tra trước khi tìm kiếm."
}
```

##### Response - low-confidence / thiếu slot
Ví dụ user nhập:
```text
Tìm vé đi Đà Nẵng ngày 10/6
```

Response:
```json
{
  "status": "need_more_info",
  "intent": "search_trip",
  "slots": {
    "intent": "search_trip",
    "origin": null,
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "date_label": "10/06/2026",
    "transport_mode": null,
    "passengers": 1,
    "confidence": 0.72,
    "missing_fields": ["origin", "transport_mode"],
    "warning": ""
  },
  "bot_message": "Tôi cần thêm thông tin để tìm chuyến chính xác hơn.",
  "quick_replies": [
    {
      "field": "origin",
      "label": "Hà Nội",
      "value": "Hà Nội"
    },
    {
      "field": "origin",
      "label": "TP.HCM",
      "value": "TP.HCM"
    },
    {
      "field": "transport_mode",
      "label": "Máy bay",
      "value": "flight"
    },
    {
      "field": "transport_mode",
      "label": "Tàu hỏa",
      "value": "train"
    }
  ]
}
```

##### Response - failure demo
Với input:
```text
Tìm vé từ Hà Nội đi Đà Nẵng bằng tàu hỏa
```

Backend có thể cố tình giả lập AI hiểu sai để demo failure path:
```json
{
  "status": "needs_review",
  "intent": "search_trip",
  "slots": {
    "intent": "search_trip",
    "origin": "Hà Nội",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "date_label": "10/06/2026",
    "transport_mode": "flight",
    "passengers": 1,
    "confidence": 0.62,
    "missing_fields": [],
    "warning": "AI có thể đã hiểu sai phương tiện. Vui lòng kiểm tra trước khi tìm."
  },
  "bot_message": "Tôi đã trích xuất được thông tin, nhưng có một số điểm cần bạn kiểm tra lại."
}
```

##### Parse rule v1
Backend v1 có thể dùng rule-based parser để demo ổn định:

| Input chứa | Output |
|---|---|
| `Sài Gòn`, `TP.HCM`, `Hồ Chí Minh` | `origin = "TP.HCM"` |
| `Hà Nội` | `origin = "Hà Nội"` |
| `Đà Nẵng` | `destination = "Đà Nẵng"` |
| `10/6` | `date = "2026-06-10"` |
| `tàu`, `tàu hỏa` | `transport_mode = "train"` |
| `máy bay`, `bay` | `transport_mode = "flight"` |
| `2 vé`, `2 người` | `passengers = 2` |

---

#### 5.2.2. `POST /api/search`

##### Mục đích
Tìm chuyến phù hợp từ mock data sau khi user đã xác nhận widget.

##### Request
```json
{
  "slots": {
    "origin": "TP.HCM",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "transport_mode": "train",
    "passengers": 2
  },
  "sort_by": "recommended"
}
```

##### Response - có kết quả
```json
{
  "status": "ok",
  "query": {
    "origin": "TP.HCM",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "transport_mode": "train",
    "passengers": 2
  },
  "results": [
    {
      "id": "train_se1_001",
      "provider": "Vietnam Railways",
      "code": "SE1",
      "transport_mode": "train",
      "origin": "TP.HCM",
      "destination": "Đà Nẵng",
      "date": "2026-06-10",
      "departure_time": "08:00",
      "arrival_time": "23:15",
      "duration_minutes": 915,
      "duration_label": "15h15m",
      "total_price_vnd": 1250000,
      "price_label": "1.250.000đ",
      "available_seats": 12,
      "reason": "Phù hợp nếu muốn đi tàu và kiểm soát chi phí",
      "booking_url": "https://example.com/train_se1_001",
      "data_source_type": "mock"
    }
  ],
  "message": "Tìm thấy các lựa chọn phù hợp từ dữ liệu demo."
}
```

##### Response - không có kết quả
```json
{
  "status": "no_results",
  "query": {
    "origin": "Hà Nội",
    "destination": "Phú Quốc",
    "date": "2026-06-10",
    "transport_mode": "train",
    "passengers": 1
  },
  "results": [],
  "message": "Chưa có kết quả phù hợp trong dữ liệu demo. Bạn có thể đổi phương tiện hoặc ngày đi."
}
```

##### Search rule v1
Search tool chỉ cần filter mock data:
```text
origin exact match
destination exact match
date exact match
transport_mode exact match
available_seats >= passengers
```

Sort:

| `sort_by` | Logic |
|---|---|
| `recommended` | Có thể giữ thứ tự trong mock data |
| `price` | Giá thấp trước |
| `duration` | Thời lượng ngắn trước |
| `departure_time` | Giờ đi sớm trước |

---

#### 5.2.3. `POST /api/update-slot`

##### Mục đích
Cập nhật slot khi user sửa thông tin trên widget hoặc bấm quick reply.

##### Request
```json
{
  "slots": {
    "intent": "search_trip",
    "origin": "Hà Nội",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "date_label": "10/06/2026",
    "transport_mode": "flight",
    "passengers": 1,
    "confidence": 0.62,
    "missing_fields": [],
    "warning": "AI có thể đã hiểu sai phương tiện. Vui lòng kiểm tra trước khi tìm."
  },
  "patch": {
    "transport_mode": "train"
  }
}
```

##### Response
```json
{
  "status": "ok",
  "slots": {
    "intent": "search_trip",
    "origin": "Hà Nội",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "date_label": "10/06/2026",
    "transport_mode": "train",
    "passengers": 1,
    "confidence": 0.94,
    "missing_fields": [],
    "warning": ""
  },
  "bot_message": "Thông tin đã được cập nhật. Bạn kiểm tra lại trước khi tìm chuyến nhé."
}
```

##### Rule
- Merge `patch` vào `slots`.
- Tính lại `missing_fields`.
- Nếu user sửa thủ công thì tăng `confidence` lên khoảng `0.9 - 0.95`.
- Xóa `warning` nếu field sai đã được sửa.

---

### 5.3. Error format
Tất cả lỗi backend nên trả cùng format:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: message"
  }
}
```

Các code nên có:

| Code | Khi nào dùng |
|---|---|
| `INVALID_REQUEST` | Body thiếu field hoặc sai type |
| `UNSUPPORTED_INTENT` | Intent không thuộc demo v1 |
| `INTERNAL_ERROR` | Lỗi không mong muốn |

Lưu ý: `no_results` trong `/api/search` là trạng thái nghiệp vụ hợp lệ, không phải lỗi hệ thống. Backend chỉ dùng error format khi request sai hoặc server lỗi.

---

### 5.4. Test cases backend

| Case | API | Input | Expected |
|---|---|---|---|
| Happy train | `/api/parse` | `Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6` | Đủ slot, `transport_mode = train`, `missing_fields = []` |
| Happy flight | `/api/parse` | `Tìm vé máy bay từ Hà Nội đi Đà Nẵng ngày 10/6` | Đủ slot, `transport_mode = flight` |
| Missing origin | `/api/parse` | `Tìm vé đi Đà Nẵng ngày 10/6` | `status = need_more_info`, thiếu `origin` |
| Missing transport | `/api/parse` | `Tìm vé từ Sài Gòn đi Đà Nẵng ngày 10/6` | Thiếu `transport_mode`, có quick replies |
| Failure demo | `/api/parse` | `Tìm vé từ Hà Nội đi Đà Nẵng bằng tàu hỏa` | Trả warning và `confidence = 0.62` |
| Correction | `/api/update-slot` | patch `transport_mode = train` | Cập nhật slot, xóa warning |
| Search train | `/api/search` | slot `TP.HCM -> Đà Nẵng`, `train` | Trả danh sách tàu |
| Search flight | `/api/search` | slot `Hà Nội -> Đà Nẵng`, `flight` | Trả danh sách máy bay |
| No results | `/api/search` | route không có data | `status = no_results`, `results = []` |

---

### 5.5. Gợi ý thứ tự implement
1. Tạo mock data trong `codebase/Data`.
2. Implement parser rule-based cho `/api/parse`.
3. Implement validator tính `missing_fields`.
4. Implement `/api/update-slot`.
5. Implement search tool cho `/api/search`.
6. Nối frontend từ hard-code JS sang API thật.
7. Test 4 paths trước demo: Happy, Low-confidence, Failure, Correction.

---

### 5.6. Mock data tối thiểu

Để frontend demo có dữ liệu đủ nhìn và backend search được, mock data nên có tối thiểu:

| Nhóm data | Số record | Mục đích |
|---|---:|---|
| `TP.HCM -> Đà Nẵng`, `train`, `2026-06-10` | 3 | Happy path tàu hỏa |
| `Hà Nội -> Đà Nẵng`, `flight`, `2026-06-10` | 3 | Happy path máy bay |
| `Hà Nội -> Đà Nẵng`, `train`, `2026-06-10` | 2 | Correction từ máy bay sang tàu |
| Route/date không có data | 1-2 case | Test `no_results` |

Các record nên dùng đúng schema ở mục `Trip result`. Nếu chưa có backend search, frontend có thể hard-code trước nhưng field nên giữ cùng tên để dễ tách sang `Data` sau.

---

### 5.7. Nguyên tắc quan trọng
- Backend không được tự đặt vé thật.
- Không scrape web đặt vé.
- Không gọi API thương mại nếu chưa có key/partner access.
- Với demo Day 06, mock data là đủ.
- Tất cả response phải giải thích rõ khi dữ liệu là mock.
- Khi thiếu hoặc mơ hồ, backend phải hỏi lại, không đoán bừa.
