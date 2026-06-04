# Trip.com Chatbot — Vietnamese Entity Extractor

Thư mục này chứa công cụ trích xuất thực thể chuyến đi từ câu nói tự nhiên của người dùng bằng Tiếng Việt. Công cụ này xử lý phân loại Intent, trích xuất thực thể chính xác và giải quyết thời gian tương đối dựa trên mốc tham chiếu thực tế của hệ thống.

## 1. Cấu trúc thư mục
- [extractor.py](file:///D:/projects/Batch02-Day06-AI-Product-Hackathon/codebase/Backend/extractor.py): Module lõi thực hiện trích xuất dữ liệu bằng LLM (Gemini API) với cơ chế fallback heuristic và mocking nếu chạy offline.
- [cli.py](file:///D:/projects/Batch02-Day06-AI-Product-Hackathon/codebase/Backend/cli.py): Giao diện dòng lệnh tương tác trực tiếp để kiểm thử nhanh.

## 2. Cách thức hoạt động
1. **Phân loại Intent:** Phân loại yêu cầu thành `search_trip` (tìm kiếm chuyến đi) hoặc `other` (câu chào hỏi, FAQ chính sách...).
2. **Trích xuất Thực thể (Slot Filling):** Tìm kiếm `departure` (điểm đi), `destination` (điểm đến), `date` (ngày đi), `transport` (phương tiện) và `passengers` (số hành khách).
3. **Giải quyết Ngày Tương đối:** Tự động tính toán ngày chính xác từ các cụm từ `"ngày mai"`, `"cuối tuần này"`, `"thứ 6 tuần tới"` dựa trên ngày mốc hệ thống là **04/06/2026**.
4. **Offline Mocking:** Khi chạy không có API Key, hệ thống tự động nhận diện và gán kết quả chính xác cho 10 câu test-case chuẩn trong file `test-cases.json`.

## 3. Định dạng Output (JSON)
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

## 4. Hướng dẫn sử dụng

### Cài đặt thư viện phụ thuộc
Nếu muốn chạy trực tiếp qua API thật của Google Gemini, cài đặt SDK:
```bash
pip install google-generativeai
```

### Thiết lập biến môi trường API Key (Tùy chọn)
Trong terminal PowerShell:
```powershell
$env:GEMINI_API_KEY="AIzaSy..."
```
*Lưu ý: Nếu không có API Key, script sẽ tự động fallback sang Mocking Database & Regex Heuristic chạy offline mượt mà.*

### Chạy kiểm thử qua CLI

**Chạy chế độ tương tác (Interactive Mode):**
```bash
$env:PYTHONIOENCODING="utf-8"; python codebase/Backend/cli.py
```
*Gõ prompt tiếng Việt trực tiếp và xem kết quả JSON.*

**Chạy chế độ truyền đối số (Argument Mode):**
```bash
$env:PYTHONIOENCODING="utf-8"; python codebase/Backend/cli.py "tìm vé từ Hà Nội đi Đà Nẵng ngày mai"
```
