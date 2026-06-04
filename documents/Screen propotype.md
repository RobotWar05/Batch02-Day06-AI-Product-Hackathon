**4 màn hình tương ứng với 4 Paths (Happy, Low-confidence, Failure, Correction)** trong SPEC.

## Screen 1 - Happy Path

### User nhập yêu cầu đầy đủ

```
┌──────────────────────────────┐
│ Chatbot Trip.com             │
├──────────────────────────────┤
│ User                         │
│ Tìm 2 vé tàu hỏa từ Sài Gòn  │
│ đi Đà Nẵng ngày 10/6         │
│                              │
│ 🤖 Đang phân tích...         │
└──────────────────────────────┘
```

↓

### AI tạo Widget

```
┌──────────────────────────────┐
│ 🤖 Tôi đã tìm thấy thông tin │
│ chuyến đi của bạn            │
│                              │
│ ┌─────────────────────────┐  │
│ │ 🚆 TÌM CHUYẾN ĐI        │  │
│ │                         │  │
│ │ Điểm đi                 │  │
│ │ TP.HCM                  │  │
│ │                         │  │
│ │ Điểm đến                │  │
│ │ Đà Nẵng                 │  │
│ │                         │  │
│ │ Ngày đi                 │  │
│ │ 10/06/2026             │  │
│ │                         │  │
│ │ Hành khách              │  │
│ │ 2 người                 │  │
│ │                         │  │
│ │ [Tìm chuyến]            │  │
│ └─────────────────────────┘  │
└──────────────────────────────┘
```

↓

### Hiển thị kết quả

```
┌──────────────────────────────┐
│ Kết quả phù hợp              │
│                              │
│ ┌─────────────────────────┐  │
│ │ SE1                     │  │
│ │ 08:00 → 23:15           │  │
│ │ 1.250.000đ              │  │
│ │ [Chọn vé]               │  │
│ └─────────────────────────┘  │
│                              │
│ ┌─────────────────────────┐  │
│ │ SE3                     │  │
│ │ 13:00 → 04:30           │  │
│ │ 1.150.000đ              │  │
│ │ [Chọn vé]               │  │
│ └─────────────────────────┘  │
└──────────────────────────────┘
```

---

# Screen 2 - Low Confidence Path

### User thiếu thông tin

```
User:
Tìm vé đi Đà Nẵng ngày 10/6
```

AI chỉ tìm được:

* Destination
* Date

Thiếu:

* Departure
* Transport

---

### Màn hình hỏi lại

```
┌──────────────────────────────┐
│ 🤖 Tôi cần thêm thông tin    │
│                              │
│ Bạn muốn khởi hành từ đâu?   │
│                              │
│ [Hà Nội]                     │
│ [TP.HCM]                     │
│ [Khác]                       │
│                              │
│ Bạn muốn đi bằng gì?         │
│                              │
│ [✈️ Máy bay]                 │
│ [🚆 Tàu hỏa]                │
└──────────────────────────────┘
```

Điểm UX quan trọng:

❌ Không hỏi bằng text dài

✅ Cho nút chọn nhanh

---

# Screen 3 - Failure Path

Đây là screen cực kỳ quan trọng vì thầy thường hỏi:

> "Nếu AI hiểu sai thì sao?"

---

User nhập:

```
Tìm vé từ Hà Nội đi Đà Nẵng bằng tàu hỏa
```

AI parse sai:

```
Transport = Máy bay
```

Widget hiển thị:

```
┌──────────────────────────────┐
│ 🚨 Kiểm tra thông tin        │
│                              │
│ Điểm đi                      │
│ Hà Nội                       │
│                              │
│ Điểm đến                     │
│ Đà Nẵng                      │
│                              │
│ Phương tiện                  │
│ ✈️ Máy bay      [Sửa]        │
│                              │
│ Ngày đi                      │
│ 10/06/2026                   │
└──────────────────────────────┘
```

---

# Screen 4 - Correction Path

User nhấn vào trường sai

```
[Sửa]
```

↓

Bottom Sheet xuất hiện

```
┌──────────────────────────────┐
│ Chọn phương tiện             │
├──────────────────────────────┤
│ ○ Máy bay                    │
│ ● Tàu hỏa                    │
│ ○ Xe khách                   │
│                              │
│ [Cập nhật]                   │
└──────────────────────────────┘
```

↓

Widget cập nhật

```
┌──────────────────────────────┐
│ 🚆 TÌM CHUYẾN ĐI             │
│                              │
│ Điểm đi                      │
│ Hà Nội                       │
│                              │
│ Điểm đến                     │
│ Đà Nẵng                      │
│                              │
│ Phương tiện                  │
│ 🚆 Tàu hỏa                   │
│                              │
│ [Tìm lại kết quả]            │
└──────────────────────────────┘
```

---

# Flow màn hình

```text
Screen 1
Chat Input
     │
     ▼
Intent Detection
     │
     ▼
Widget Generated
     │
     ▼
Trip Results


Screen 2
Missing Information
     │
     ▼
Ask Follow-up
     │
     ▼
Widget Generated


Screen 3
Wrong Extraction
     │
     ▼
Editable Widget


Screen 4
User Correction
     │
     ▼
Updated Widget
     │
     ▼
New Results
```
1. Current Trip.com (FAQ thất bại)
2. Happy Path
3. Low-confidence Path
4. Failure Path
5. Correction Path

