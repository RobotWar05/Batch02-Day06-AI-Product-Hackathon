Dưới đây là phần **Phase 4 — Mock AI parsing interface** được viết rõ hơn theo hướng có thể chuyển trực tiếp thành test cases.

## Phase 4 — Mock AI parsing interface

Phần intent/entity/tool/agent chính sẽ do teammate khác làm. Backend chỉ implement **mock parser** để giữ contract API ổn định. Mục tiêu của phase này không phải parse thông minh, mà là đảm bảo backend luôn trả output đúng format để các phase sau như slot validation, widget, correction flow và frontend có thể tích hợp.

---

## Output contract cần cố định

Mock parser nên luôn trả một object có format tương tự:

```json
{
  "intent": "search_trip",
  "slots": {
    "departure": "TP.HCM",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "transport": "train",
    "passengers": 2
  },
  "confidence": 0.9,
  "missing_slots": [],
  "raw_message": "Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6"
}
```

Các field nên luôn tồn tại:

```text
intent
slots
confidence
missing_slots
raw_message
```

Trong `slots`, nếu field không tìm được thì có thể để `null`, nhưng key vẫn nên tồn tại để frontend/backend dễ xử lý:

```json
{
  "departure": null,
  "destination": "Đà Nẵng",
  "date": "2026-06-10",
  "transport": null,
  "passengers": 1
}
```

---

# Edge cases cần test

## 1. Happy path — đầy đủ thông tin

### Case 1.1 — Full Vietnamese train query

Input:

```text
Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6
```

Expected:

```text
intent = search_trip
departure = TP.HCM
destination = Đà Nẵng
date = 2026-06-10
transport = train
passengers = 2
missing_slots = []
confidence high
```

---

### Case 1.2 — Full flight query

Input:

```text
Tìm vé máy bay từ Hà Nội đi Phú Quốc ngày 15/6 cho 3 người
```

Expected:

```text
intent = search_trip
departure = Hà Nội
destination = Phú Quốc
date = 2026-06-15
transport = flight
passengers = 3
missing_slots = []
```

---

## 2. Missing slot cases

### Case 2.1 — Thiếu departure

Input:

```text
Tìm vé đi Đà Nẵng ngày 10/6
```

Expected:

```text
intent = search_trip
departure = null
destination = Đà Nẵng
date = 2026-06-10
transport = null hoặc giữ null nếu không detect được
passengers = 1
missing_slots includes departure
missing_slots includes transport nếu không có phương tiện
```

---

### Case 2.2 — Thiếu transport

Input:

```text
Tìm 2 vé từ Sài Gòn đi Đà Nẵng ngày 10/6
```

Expected:

```text
intent = search_trip
departure = TP.HCM
destination = Đà Nẵng
date = 2026-06-10
transport = null
passengers = 2
missing_slots includes transport
```

---

### Case 2.3 — Thiếu date

Input:

```text
Tìm vé tàu hỏa từ Sài Gòn đi Đà Nẵng
```

Expected:

```text
intent = search_trip
departure = TP.HCM
destination = Đà Nẵng
date = null
transport = train
passengers = 1
missing_slots includes date
```

---

### Case 2.4 — Thiếu passengers, dùng default

Input:

```text
Tìm vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6
```

Expected:

```text
passengers = 1
passengers không nằm trong missing_slots
```

Vì passengers không bắt buộc, có thể default là 1.

---

## 3. Intent detection cases

### Case 3.1 — Travel search intent

Input:

```text
Tìm vé từ Hà Nội đi Đà Nẵng
```

Expected:

```text
intent = search_trip
```

---

### Case 3.2 — FAQ / non-search message

Input:

```text
Trip.com có hỗ trợ hoàn tiền không?
```

Expected:

```text
intent = faq hoặc unknown
slots all null/default
missing_slots = []
```

Không nên cố parse thành search trip.

---

### Case 3.3 — Completely irrelevant message

Input:

```text
Hôm nay thời tiết thế nào?
```

Expected:

```text
intent = unknown
slots all null/default
missing_slots = []
```

---

## 4. Normalization cases

### Case 4.1 — Sài Gòn normalize thành TP.HCM

Input:

```text
Tìm vé từ Sài Gòn đi Đà Nẵng
```

Expected:

```text
departure = TP.HCM
```

---

### Case 4.2 — Hồ Chí Minh normalize thành TP.HCM

Input:

```text
Tìm vé từ Hồ Chí Minh đi Đà Nẵng
```

Expected:

```text
departure = TP.HCM
```

---

### Case 4.3 — TP HCM / TPHCM / TP.HCM đều normalize giống nhau

Inputs:

```text
Tìm vé từ TP HCM đi Đà Nẵng
Tìm vé từ TPHCM đi Đà Nẵng
Tìm vé từ TP.HCM đi Đà Nẵng
```

Expected:

```text
departure = TP.HCM
```

---

### Case 4.4 — Transport normalization

Inputs:

```text
tàu hỏa
tàu hoả
xe lửa
máy bay
flight
bus
xe khách
```

Expected mapping:

```text
tàu hỏa / tàu hoả / xe lửa → train
máy bay / flight → flight
xe khách / bus → bus
```

---

## 5. Date parsing cases

Vì mock parser không cần quá thông minh, chỉ cần cover vài format demo.

### Case 5.1 — Date dạng `10/6`

Input:

```text
Tìm vé từ Sài Gòn đi Đà Nẵng ngày 10/6
```

Expected:

```text
date = 2026-06-10
```

---

### Case 5.2 — Date dạng `10-6`

Input:

```text
Tìm vé từ Sài Gòn đi Đà Nẵng ngày 10-6
```

Expected:

```text
date = 2026-06-10
```

---

### Case 5.3 — Date dạng full ISO

Input:

```text
Tìm vé từ Sài Gòn đi Đà Nẵng ngày 2026-06-10
```

Expected:

```text
date = 2026-06-10
```

---

### Case 5.4 — Không có date

Input:

```text
Tìm vé từ Sài Gòn đi Đà Nẵng bằng tàu hỏa
```

Expected:

```text
date = null
missing_slots includes date
```

---

## 6. Passenger parsing cases

### Case 6.1 — `2 vé`

Input:

```text
Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng
```

Expected:

```text
passengers = 2
```

---

### Case 6.2 — `cho 3 người`

Input:

```text
Tìm vé máy bay từ Hà Nội đi Phú Quốc cho 3 người
```

Expected:

```text
passengers = 3
```

---

### Case 6.3 — Không nói số lượng

Input:

```text
Tìm vé máy bay từ Hà Nội đi Đà Nẵng
```

Expected:

```text
passengers = 1
```

---

### Case 6.4 — Số lượng không hợp lệ

Input:

```text
Tìm 0 vé từ Hà Nội đi Đà Nẵng
```

Expected:

```text
passengers = 1 hoặc null
confidence thấp hơn
```

Mock parser có thể chưa reject hẳn, nhưng nên không trả `passengers = 0`.

---

## 7. Session state context cases

Phase 4 có input là `user message + session state`, nên cần test parser có thể dùng state cũ.

### Case 7.1 — User bổ sung departure sau khi trước đó thiếu

Previous state:

```json
{
  "slots": {
    "departure": null,
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "transport": "train",
    "passengers": 1
  }
}
```

Input:

```text
Từ Sài Gòn
```

Expected:

```text
departure = TP.HCM
destination vẫn giữ Đà Nẵng
date vẫn giữ 2026-06-10
transport vẫn giữ train
missing_slots = []
```

---

### Case 7.2 — User sửa transport

Previous state:

```json
{
  "slots": {
    "departure": "Hà Nội",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "transport": "flight",
    "passengers": 1
  }
}
```

Input:

```text
Không, tôi muốn đi tàu hỏa
```

Expected:

```text
transport = train
departure/date/destination giữ nguyên
```

---

### Case 7.3 — User sửa date

Previous state:

```json
{
  "slots": {
    "departure": "Hà Nội",
    "destination": "Đà Nẵng",
    "date": "2026-06-10",
    "transport": "train",
    "passengers": 1
  }
}
```

Input:

```text
Đổi sang ngày 11/6
```

Expected:

```text
date = 2026-06-11
các slot khác giữ nguyên
```

---

## 8. Ambiguous / conflict cases

### Case 8.1 — Có hai destination

Input:

```text
Tìm vé từ Sài Gòn đi Đà Nẵng rồi ra Hà Nội
```

Expected cho mock:

```text
destination = Đà Nẵng
confidence lower
```

Không cần xử lý hoàn hảo, nhưng nên có confidence thấp hơn để Phase 5 có thể confirm.

---

### Case 8.2 — Có hai phương tiện

Input:

```text
Tìm vé máy bay hoặc tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6
```

Expected:

```text
transport = null hoặc transport = flight
confidence thấp
missing_slots includes transport nếu chọn null
```

Tốt nhất mock nên set `transport = null` để frontend hỏi lại.

---

### Case 8.3 — Departure và destination giống nhau

Input:

```text
Tìm vé từ Đà Nẵng đi Đà Nẵng ngày 10/6
```

Expected:

```text
departure = Đà Nẵng
destination = Đà Nẵng
confidence thấp
```

Phase 4 chỉ parse, chưa cần validate business rule sâu. Nhưng nên hạ confidence để Phase 5 xử lý.

---

## 9. Language / spelling cases

### Case 9.1 — Không dấu

Input:

```text
Tim ve tau hoa tu Sai Gon di Da Nang ngay 10/6
```

Expected:

```text
intent = search_trip
departure = TP.HCM
destination = Đà Nẵng
transport = train
date = 2026-06-10
```

---

### Case 9.2 — Mixed English Vietnamese

Input:

```text
Find 2 train tickets from Sai Gon to Da Nang on 10/6
```

Expected:

```text
intent = search_trip
departure = TP.HCM
destination = Đà Nẵng
transport = train
passengers = 2
date = 2026-06-10
```

---

### Case 9.3 — Typo nhẹ

Input:

```text
Tìm vé tàu hoa từ Sai Gon đi Da Nang ngày 10/6
```

Expected:

```text
transport = train nếu mock support typo
hoặc transport = null nếu không support
```

Với mock parser, typo support là nice-to-have, không bắt buộc.

---
