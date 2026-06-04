# Codebase

Đây là nơi nhóm nộp toàn bộ phần code của prototype. Mục tiêu là để giảng viên và các nhóm khác nhìn được sản phẩm chạy như thế nào, và mỗi thành viên đã đóng góp ra sao.

## Cấu trúc Prototype hiện tại
- **[codebase/Backend/](Backend/)**: Chứa lõi xử lý NLP trích xuất thực thể từ prompt Tiếng Việt.
  - [extractor.py](Backend/extractor.py): AI Engine kết nối Gemini API (hoặc fallback offline) để bóc tách thông tin chuyến đi & chuẩn hóa dữ liệu.
  - [cli.py](Backend/cli.py): Công cụ chạy kiểm thử qua dòng lệnh CLI.
- **[codebase/Data/](Data/)**: Chứa bộ dữ liệu kiểm thử.
  - [test-cases.json](Data/test-cases.json): 10 mẫu test-case đại diện cho Happy Path, Low-confidence Path, Failure Path và FAQ.

## Cách chạy thử nhanh công cụ trích xuất
1. Đảm bảo bạn đã cài đặt Python 3.
2. Di chuyển vào thư mục dự án và chạy dòng lệnh CLI tương tác:
   ```bash
   $env:PYTHONIOENCODING="utf-8"
   python codebase/Backend/cli.py
   ```
3. Nhập một câu lệnh bất kỳ (ví dụ: *"Đặt cho anh vé máy bay từ Hà Nội đi Phú Quốc cuối tuần này"* hoặc *"tìm vé đi Đà Nẵng ngày 10/6"*) để xem cấu trúc dữ liệu JSON được trích xuất tự động.

## Công cụ và API đã dùng
- **Model AI:** Google Gemini (thông qua thư viện `google-generativeai`).
- **Framework & Ngôn ngữ:** Python 3, JSON.

