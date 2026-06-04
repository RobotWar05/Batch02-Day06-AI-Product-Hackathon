# High-level Implementation Plan — Trip.com Chatbot Backend

## Mục tiêu

Implement backend theo hướng demo-first: mỗi phase sau khi hoàn thành đều có thể chạy thử một phần flow thật. Ưu tiên làm API ổn định, lưu được user/session/message bằng JSON, sau đó mới gắn AI extraction và mock search.

---

## Phase 0 — Project setup & skeleton

Thiết lập FastAPI project, folder structure, router rỗng, service layer rỗng, file JSON mẫu trong `data/`.

### Deliverables

- FastAPI app chạy được.
- Có các router chính: `auth`, `sessions`, `chat`, `trip`.
- Có `data/users.json`, `data/chat_sessions.json`, `data/mock_trips.json`.

### Test

Phase này chỉ cần smoke test:

- Chạy server không lỗi.
- Gọi `GET /health` trả `{ "status": "ok" }`.

---

## Phase 1 — Demo auth bằng username

Implement login tối giản: user nhập username/password, backend ignore password. Nếu username chưa có thì tạo user mới trong `users.json`, nếu đã có thì login lại user cũ.

### Deliverables

- `POST /auth/login`
- Auto-create user.
- Normalize username.
- Không lưu password.

### Test nên tạo

Manual/API test bằng Postman hoặc curl:

1. Login username mới → trả `is_new_user = true`.
2. Login lại username đó → trả `is_new_user = false`.
3. Check `users.json` chỉ có một user cho username đó.
4. Nhập password bất kỳ vẫn login được.

---

## Phase 2 — Chat session persistence

Implement session theo user: một user có thể tạo nhiều chat session, xem danh sách session, mở lại một session cũ.

### Deliverables

- `POST /users/{user_id}/sessions`
- `GET /users/{user_id}/sessions`
- `GET /sessions/{session_id}`
- Lưu session vào `chat_sessions.json`.

### Test nên tạo

1. Tạo 2 sessions cho cùng một user.
2. Gọi list sessions → thấy đủ 2 sessions.
3. Tạo session cho user khác → không bị lẫn session.
4. Mở session theo `session_id` → trả đúng messages và metadata.

---

## Phase 3 — Chat message storage

Implement API nhận message và lưu vào session. Ở phase này chưa cần AI thật, có thể trả assistant response mock.

### Deliverables

- `POST /sessions/{session_id}/messages`
- Append user message.
- Append assistant response mock.
- Update `updated_at`.

### Test nên tạo

1. Gửi message vào session.
2. Reload session → thấy message vừa gửi.
3. Gửi nhiều message liên tiếp → thứ tự messages đúng.
4. Session khác không bị ảnh hưởng.

---

## Phase 4 — Intent & entity extraction

Implement service phân tích message. Ban đầu có thể dùng rule-based hoặc LLM mock, sau đó thay bằng LLM thật. Output phải chuẩn hóa thành structured slots.

### Deliverables

- Detect intent `search_trip`.
- Extract `departure`, `destination`, `date`, `transport`, `passengers`.
- Normalize basic values: Sài Gòn → TP.HCM, tàu hỏa → train, máy bay → flight.
- Lưu `current_trip_state`.

### Test nên tạo

1. Message đầy đủ → extract đủ slots.
2. Message thiếu điểm đi → missing `departure`.
3. Message thiếu phương tiện → missing `transport`.
4. Message không liên quan travel → intent `unknown` hoặc `faq`.

---

## Phase 5 — Slot validation & widget response

Implement validator quyết định backend nên trả `trip_widget`, `slot_filling`, hoặc `confirm_low_confidence`.

### Deliverables

- Required slots validation.
- Response type thống nhất.
- Quick options cho missing slots.
- Trip widget payload cho frontend.

### Test nên tạo

1. Đủ slot → response type `trip_widget`.
2. Thiếu slot → response type `slot_filling`.
3. Slot thiếu có question và options.
4. `current_trip_state` được update đúng sau mỗi message.

---

## Phase 6 — Correction flow

Implement API update slot khi user sửa field sai hoặc chọn quick option.

### Deliverables

- `PATCH /sessions/{session_id}/trip-state`
- Update một hoặc nhiều slots.
- Validate lại state.
- Trả widget mới.

### Test nên tạo

1. Update `transport` từ `flight` sang `train`.
2. Update `date` sang ngày mới.
3. Sau update, reload session thấy state mới.
4. Nếu sau update đủ slot → `next_action = ready_to_search`.

---

## Phase 7 — Mock trip search

Implement search trên `mock_trips.json` dựa trên `current_trip_state`.

### Deliverables

- `POST /sessions/{session_id}/search`
- Filter mock trips theo departure, destination, date, transport.
- Trả `trip_results`.
- Lưu assistant result vào session.

### Test nên tạo

1. State đủ thông tin → trả danh sách kết quả.
2. State thiếu thông tin → trả error có missing slots.
3. Không có kết quả → trả empty results message.
4. Search xong reload session → thấy result message đã lưu.

---

## Phase 8 — End-to-end demo test

Ghép toàn bộ flow từ login đến search.

### Test nên tạo

Demo script:

1. Login user mới.
2. Tạo chat session.
3. Gửi: “Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6”.
4. Backend trả trip widget.
5. User bấm search.
6. Backend trả trip results.
7. Mở lại session → toàn bộ conversation vẫn còn.

Test thêm low-confidence path:

1. Gửi: “Tìm vé đi Đà Nẵng ngày 10/6”.
2. Backend hỏi thiếu departure và transport.
3. User chọn quick options.
4. Backend update widget.
5. Search ra kết quả.

---

## Thứ tự ưu tiên

P0: Phase 0 → 5 để có chatbot parse và trả widget.  
P1: Phase 6 → 7 để demo correction và search.  
P2: Phase 8 để polish end-to-end demo.
