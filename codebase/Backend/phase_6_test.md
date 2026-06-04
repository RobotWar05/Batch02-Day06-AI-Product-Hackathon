
## Phase 6 — Correction flow

Mục tiêu phase này là cho user sửa thông tin AI hiểu sai hoặc bổ sung thông tin còn thiếu. Backend nhận update, merge vào `current_trip_state`, validate lại bằng mock validator, rồi trả response mới cho frontend.

Endpoint chính:

```http
PATCH /sessions/{session_id}/trip-state
```

Nên dùng request format:

```json
{
  "updates": {
    "transport": "train"
  }
}
```

## Test cases cần có

| #  | Test case                      | Input / Context                                             | Expected                                                                      |
| -- | ------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1  | Update transport               | State cũ có `transport = flight`, patch `transport = train` | State mới có `transport = train`, các slot khác giữ nguyên                    |
| 2  | Update date                    | Patch `date = 2026-06-11`                                   | Date đổi đúng, state persist sau reload                                       |
| 3  | Update nhiều slots             | Patch `departure = TP.HCM`, `transport = train`             | Cả hai field được update                                                      |
| 4  | Update quick option tiếng Việt | Patch `transport = "Tàu hỏa"`                               | Normalize thành `train`                                                       |
| 5  | Update quick option location   | Patch `departure = "Sài Gòn"`                               | Normalize thành `TP.HCM`                                                      |
| 6  | Sau update vẫn thiếu slot      | State thiếu `departure`, `transport`; chỉ patch `departure` | Response vẫn là `slot_filling`, missing còn `transport`                       |
| 7  | Sau update đủ slot             | State thiếu `departure`; patch `departure = TP.HCM`         | Response là `trip_widget`, `next_action = ready_to_search` hoặc `show_widget` |
| 8  | Invalid transport              | Patch `transport = spaceship`                               | Không lưu `spaceship`, trả error hoặc `slot_filling` cho transport            |
| 9  | Invalid date                   | Patch `date = abc`                                          | Không lưu date sai, yêu cầu chọn lại ngày                                     |
| 10 | Invalid passengers             | Patch `passengers = 0`                                      | Không lưu `0`; fallback `1` hoặc trả lỗi                                      |
| 11 | Unknown field                  | Patch `{ "hotel": "abc" }`                                  | Trả `400/422`, state không đổi                                                |
| 12 | Empty update                   | Patch `{ "updates": {} }`                                   | Trả `400/422`, state không đổi                                                |
| 13 | Session không tồn tại          | Patch fake session id                                       | Trả `404`                                                                     |
| 14 | Session chưa có trip state     | Patch vào session mới chưa chat travel                      | Trả `400`, báo không có active trip state                                     |
| 15 | Persistence sau correction     | Patch xong rồi `GET /sessions/{id}`                         | State mới vẫn được lưu                                                        |
| 16 | Multiple corrections liên tiếp | Patch transport, rồi date, rồi passengers                   | State cuối giữ đủ tất cả thay đổi, không mất slot cũ                          |
