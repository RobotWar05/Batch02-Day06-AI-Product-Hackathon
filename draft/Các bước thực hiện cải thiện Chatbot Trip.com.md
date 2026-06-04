## Các bước thực hiện cải thiện Chatbot Trip.com

### Bước 1: Phân tích tin nhắn người dùng và nhận diện Intent

Khi người dùng nhập câu tự nhiên như:

> "Tôi muốn tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6"

Hệ thống AI sẽ thực hiện bước đầu tiên là phân loại ý định (Intent Classification):

* Tìm chuyến đi
* Đặt vé
* Hủy vé
* Kiểm tra đơn hàng
* Câu hỏi FAQ thông thường

Nếu phát hiện đây là intent **Tìm chuyến đi**, chatbot sẽ chuyển sang luồng Task-Oriented thay vì trả về FAQ như hiện tại.

---

### Bước 2: Trích xuất thông tin chuyến đi (Entity Extraction)

AI sử dụng LLM để phân tích câu nói và trích xuất các thông tin quan trọng:

| Trường dữ liệu | Giá trị    |
| -------------- | ---------- |
| Điểm đi        | Sài Gòn    |
| Điểm đến       | Đà Nẵng    |
| Ngày đi        | 10/06/2026 |
| Phương tiện    | Tàu hỏa    |
| Hành khách     | 2          |

Ví dụ output:

```json
{
  "intent": "search_trip",
  "departure": "TP.HCM",
  "destination": "Đà Nẵng",
  "date": "2026-06-10",
  "transport": "train",
  "passengers": 2,
  "confidence": 0.96
}
```

Mục tiêu là giảm việc người dùng phải nhập lại các thông tin đã nói trong hội thoại.

---

### Bước 3: Kiểm tra độ đầy đủ và độ tin cậy

Sau khi trích xuất, hệ thống đánh giá:

* Đã đủ dữ liệu chưa?
* AI có chắc chắn không?

Ví dụ:

| Trường hợp                    | Kết quả              |
| ----------------------------- | -------------------- |
| Đủ thông tin + confidence cao | Chuyển sang tìm kiếm |
| Thiếu thông tin               | Hỏi lại              |
| Confidence thấp               | Yêu cầu xác nhận     |

---

### Bước 4: Slot Filling khi thiếu dữ liệu

Nếu người dùng nhập:

> "Tìm vé đi Đà Nẵng ngày 10/6"

Hệ thống nhận thấy còn thiếu:

* Điểm đi
* Phương tiện

Chatbot sẽ hỏi lại bằng các câu ngắn gọn:

```text
Bạn muốn khởi hành từ đâu?
```

và hiển thị các lựa chọn:

```text
[Máy bay]
[Tàu hỏa]
[Xe khách]
```

Sau khi người dùng trả lời, AI tiếp tục cập nhật dữ liệu còn thiếu.

---

### Bước 5: Sinh Widget tìm kiếm trực quan trong chat

Thay vì trả về đoạn FAQ dài, chatbot tạo một mini-widget ngay trong cửa sổ chat:

```text
────────────────────────
TÌM CHUYẾN ĐI

Điểm đi: TP.HCM
Điểm đến: Đà Nẵng
Ngày đi: 10/06/2026
Phương tiện: Tàu hỏa
Hành khách: 2

[Chỉnh sửa]
[Tìm chuyến]
────────────────────────
```

Lợi ích:

* Người dùng nhìn thấy ngay thông tin AI hiểu được.
* Giảm rủi ro hiểu sai.
* Không cần chuyển sang màn hình khác để nhập lại.

---

### Bước 6: Human-in-the-loop xác nhận thông tin

Trước khi tìm kiếm thực tế, người dùng được quyền kiểm tra.

Ví dụ:

AI hiểu:

```text
Phương tiện: Máy bay
```

Trong khi người dùng muốn:

```text
Phương tiện: Tàu hỏa
```

Người dùng chỉ cần bấm vào trường đó để chỉnh sửa thay vì nhập lại toàn bộ yêu cầu.

---

### Bước 7: Hiển thị danh sách kết quả phù hợp

Sau khi xác nhận, chatbot hiển thị danh sách chuyến đi dưới dạng card:

```text
SE1
TP.HCM → Đà Nẵng
08:00 - 23:15
1.250.000đ

[Chọn vé]
```

```text
SE3
TP.HCM → Đà Nẵng
13:00 - 04:30
1.150.000đ

[Chọn vé]
```

Người dùng có thể tiếp tục thao tác ngay trong hội thoại.

---

### Bước 8: Xử lý lỗi và cập nhật kết quả

Nếu phát hiện thông tin sai:

> "Không, tôi muốn đi ngày 11/6"

hoặc

> "Tôi muốn đi máy bay"

AI sẽ:

1. Cập nhật slot tương ứng.
2. Refresh widget.
3. Tìm kiếm lại kết quả.

Không cần bắt đầu lại toàn bộ quy trình.

---

## Kiến trúc Prototype đề xuất

```text
User Message
      │
      ▼
Intent Classifier
      │
      ▼
Entity Extractor (LLM)
      │
      ▼
Slot Validation
      │
 ┌────┴────┐
 │         │
 ▼         ▼
Đủ      Thiếu/Mơ hồ
 │         │
 ▼         ▼
Search   Slot Filling
 │         │
 └────┬────┘
      ▼
Trip Widget
      │
      ▼
User Review
      │
 ┌────┴─────┐
 │          │
 ▼          ▼
Confirm   Edit
 │          │
 ▼          │
Results ◄───┘
```

### Kết quả cải thiện mong muốn

**Hiện tại (As-Is)**

```text
User → "Hà Nội đi Phú Quốc cuối tuần này"

Bot →
"Vui lòng nhấn Đặt vé máy bay..."
```

**Sau cải tiến (To-Be)**

```text
User → "Hà Nội đi Phú Quốc cuối tuần này"

AI →
✓ Điểm đi: Hà Nội
✓ Điểm đến: Phú Quốc
✓ Ngày đi: Thứ 7, 06/06/2026
✓ Phương tiện: Máy bay

[Chỉnh sửa] [Tìm chuyến]
```

Nhờ đó chatbot được chuyển từ mô hình **FAQ-based Assistant** sang **Task-Oriented Travel Assistant**, tập trung giải quyết đúng pain point lớn nhất mà nhóm đã tìm thấy từ evidence thực tế.
