# Backend API Doc - AI Đi Không

Tài liệu này mô tả API backend cần có để nối với frontend demo **AI Đi Không**.

Mục tiêu backend v1:

- Nhận câu người dùng nhập trong chat.
- Nhận diện intent.
- Trích xuất thông tin chuyến đi.
- Báo thiếu thông tin nếu input chưa đủ.
- Tìm kết quả từ mock data tàu hỏa/máy bay.
- Cho phép user sửa slot và search lại.

Backend chưa cần đặt vé thật, chưa cần gọi API Trip.com/Traveloka/Vietnam Airlines. Tất cả dữ liệu kết quả ở v1 nên lấy từ mock data.

---

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

---

## 2. Data model chính

### 2.1. Trip slots

Đây là object trung tâm frontend/backend cùng dùng.

```json
{
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
}
```

Field:

| Field | Type | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `intent` | string | yes | `search_trip`, `booking`, `cancel`, `order_check`, `faq` |
| `origin` | string/null | no | Điểm đi |
| `destination` | string/null | no | Điểm đến |
| `date` | string/null | no | Ngày chuẩn ISO `YYYY-MM-DD` |
| `date_label` | string/null | no | Ngày hiển thị cho user |
| `transport_mode` | string/null | no | `train` hoặc `flight` |
| `passengers` | number | yes | Số hành khách, default `1` |
| `confidence` | number | yes | Độ chắc chắn từ `0` đến `1` |
| `missing_fields` | string[] | yes | Danh sách field còn thiếu |
| `warning` | string | no | Cảnh báo nếu AI có thể hiểu sai |

### 2.2. Transport mode

Chỉ hỗ trợ 2 loại trong demo v1:

```text
train
flight
```

Không dùng `bus` trong v1 để giữ scope nhỏ.

### 2.3. Trip result

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

---

## 3. API endpoints

### 3.1. `POST /api/parse`

### Mục đích

Nhận câu tự nhiên của user và trả về intent + slots.

### Request

```json
{
  "message": "Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6",
  "conversation_id": "demo-session-001"
}
```

### Response - happy path

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

### Response - low-confidence / thiếu slot

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

### Response - failure demo

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

### Parse rule v1

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

### 3.2. `POST /api/search`

### Mục đích

Tìm chuyến phù hợp từ mock data sau khi user đã xác nhận widget.

### Request

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

### Response - có kết quả

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

### Response - không có kết quả

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

### Search rule v1

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

### 3.3. `POST /api/update-slot`

### Mục đích

Cập nhật slot khi user sửa thông tin trên widget hoặc bấm quick reply.

### Request

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

### Response

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

Rule:

- Merge `patch` vào `slots`.
- Tính lại `missing_fields`.
- Nếu user sửa thủ công thì tăng `confidence` lên khoảng `0.9 - 0.95`.
- Xóa `warning` nếu field sai đã được sửa.

---

## 4. Error format

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

## 5. Test cases backend

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

## 6. Gợi ý thứ tự implement

1. Tạo mock data trong `codebase/Data`.
2. Implement parser rule-based cho `/api/parse`.
3. Implement validator tính `missing_fields`.
4. Implement `/api/update-slot`.
5. Implement search tool cho `/api/search`.
6. Nối frontend từ hard-code JS sang API thật.
7. Test 4 paths trước demo:
   - Happy
   - Low-confidence
   - Failure
   - Correction

---

## 7. Mock data tối thiểu

Để frontend demo có dữ liệu đủ nhìn và backend search được, mock data nên có tối thiểu:

| Nhóm data | Số record | Mục đích |
|---|---:|---|
| `TP.HCM -> Đà Nẵng`, `train`, `2026-06-10` | 3 | Happy path tàu hỏa |
| `Hà Nội -> Đà Nẵng`, `flight`, `2026-06-10` | 3 | Happy path máy bay |
| `Hà Nội -> Đà Nẵng`, `train`, `2026-06-10` | 2 | Correction từ máy bay sang tàu |
| Route/date không có data | 1-2 case | Test `no_results` |

Các record nên dùng đúng schema ở mục `Trip result`. Nếu chưa có backend search, frontend có thể hard-code trước nhưng field nên giữ cùng tên để dễ tách sang `Data` sau.

---

## 8. Nguyên tắc quan trọng

- Backend không được tự đặt vé thật.
- Không scrape web đặt vé.
- Không gọi API thương mại nếu chưa có key/partner access.
- Với demo Day 06, mock data là đủ.
- Tất cả response phải giải thích rõ khi dữ liệu là mock.
- Khi thiếu hoặc mơ hồ, backend phải hỏi lại, không đoán bừa.
