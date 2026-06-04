# High-level Implementation Plan — Trip.com Chatbot Backend

## Mục tiêu

Implement backend theo hướng demo-first: mỗi phase sau khi hoàn thành đều có thể test được một phần flow thật. Phần **agent/tools cho intent, entity extraction và slot validation** sẽ do teammate khác handle. Backend chỉ cần tạo **mock feature + interface ổn định** để frontend và các API còn lại chạy end-to-end.

---

## Phase 0 — Project setup & skeleton

Thiết lập FastAPI project, folder structure, router rỗng, service layer rỗng, file JSON mẫu trong `data/`.

### Deliverables

- FastAPI app chạy được.
- Router chính: `auth`, `sessions`, `chat`, `trip`.
- File mẫu: `users.json`, `chat_sessions.json`, `mock_trips.json`.
- `GET /health`.

### Test

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

1. Login username mới → `is_new_user = true`.
2. Login lại username đó → `is_new_user = false`.
3. Check `users.json` chỉ có một user cho username đó.
4. Password bất kỳ vẫn login được.

---

## Phase 2 — Chat session persistence

Implement session theo user: một user có thể tạo nhiều chat session, xem danh sách session, mở lại session cũ.

### Deliverables

- `POST /users/{user_id}/sessions`
- `GET /users/{user_id}/sessions`
- `GET /sessions/{session_id}`
- Lưu session vào `chat_sessions.json`.

### Test nên tạo

1. Tạo 2 sessions cho cùng một user.
2. List sessions → thấy đủ 2 sessions.
3. Tạo session cho user khác → không bị lẫn session.
4. Mở session theo `session_id` → trả đúng messages và metadata.

---

## Phase 3 — Chat message storage

Implement API nhận message và lưu vào session. Phase này chưa cần AI thật, chỉ cần assistant response mock.

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

## Phase 4 — Mock AI parsing interface

Phần intent/entity/tool/agent chính sẽ do teammate khác làm. Backend chỉ implement **mock parser** để giữ contract API ổn định.

### Deliverables

- Tạo `ai_parser_service` hoặc adapter tương đương.
- Input: user message + session state.
- Output mock theo format thống nhất: intent, slots, confidence, missing slots.
- Có vài rule đơn giản cho demo: nhận biết “Sài Gòn”, “Đà Nẵng”, “tàu hỏa”, “máy bay”, “10/6”, “2 vé”.
- Sau này teammate có thể thay mock parser bằng agent thật mà không đổi API bên ngoài.

### Test nên tạo

1. Message đầy đủ → mock trả đủ slots.
2. Message thiếu điểm đi → mock trả missing `departure`.
3. Message thiếu phương tiện → mock trả missing `transport`.
4. Message không liên quan travel → intent `unknown` hoặc `faq`.

---

## Phase 5 — Mock validation & response decision

Slot validation thật/agent decision có thể do teammate xử lý. Backend chỉ cần mock logic cơ bản để demo frontend flow.

### Deliverables

- Nếu đủ required slots → trả `trip_widget`.
- Nếu thiếu slots → trả `slot_filling`.
- Nếu mock confidence thấp → trả `confirm_low_confidence`.
- Response type thống nhất để frontend render.
- Quick options cho missing slots.

### Test nên tạo

1. Đủ slot → response type `trip_widget`.
2. Thiếu slot → response type `slot_filling`.
3. Missing slot có question và options.
4. `current_trip_state` vẫn được lưu đúng sau mỗi message.

---

## Phase 6 — Correction flow

Implement API update slot khi user sửa field sai hoặc chọn quick option.

### Deliverables

- `PATCH /sessions/{session_id}/trip-state`
- Update một hoặc nhiều slots.
- Re-run mock validation.
- Trả widget mới.

### Test nên tạo

1. Update `transport` từ `flight` sang `train`.
2. Update `date` sang ngày mới.
3. Reload session → state mới vẫn được lưu.
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

## Phase 8 — Integration với agent/tools của teammate

Khi teammate hoàn thành agent/tools, thay mock parser và mock validator bằng implementation thật qua cùng interface.

### Deliverables

- Giữ nguyên API public.
- Thay internal mock service bằng real agent service.
- Mapping output agent thật về response type hiện tại.
- Có fallback về mock nếu agent lỗi trong demo.

### Test nên tạo

1. Cùng một user message, API response vẫn đúng format cũ.
2. Agent trả thiếu slot → frontend vẫn render slot filling.
3. Agent trả đủ slot → frontend vẫn render trip widget.
4. Agent lỗi → backend trả fallback response hoặc error message rõ ràng.

---

## Phase 9 — End-to-end demo test

Ghép toàn bộ flow từ login đến search.

### Test nên tạo

Happy path:

1. Login user mới.
2. Tạo chat session.
3. Gửi: “Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6”.
4. Backend trả trip widget.
5. User bấm search.
6. Backend trả trip results.
7. Mở lại session → conversation vẫn còn.

Low-confidence / missing info path:

1. Gửi: “Tìm vé đi Đà Nẵng ngày 10/6”.
2. Backend hỏi thiếu departure và transport.
3. User chọn quick options.
4. Backend update widget.
5. Search ra kết quả.

---

## Thứ tự ưu tiên

P0: Phase 0 → 3 để có auth, session, message persistence.  
P0: Phase 4 → 5 làm mock parser/validator để không block frontend.  
P1: Phase 6 → 7 để demo correction và search.  
P1: Phase 8 để tích hợp agent/tools của teammate.  
P2: Phase 9 để polish end-to-end demo.
