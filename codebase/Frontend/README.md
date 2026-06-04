# Frontend Demo - Trip Assistant

Đây là frontend v1 cho Day 06 AI Product Hackathon.

## Cách chạy

Mở trực tiếp file:

```text
index.html
```

Không cần backend, không cần cài package. Frontend đang dùng:

- Tailwind CDN
- Material Symbols
- Mock parser hard-code trong JavaScript
- Result cards hard-code trong JavaScript

## Flow đã hỗ trợ

| Path | Cách test |
|---|---|
| Happy | Nhập: `Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6` |
| Happy flight | Nhập: `Tìm vé máy bay từ Hà Nội đi Đà Nẵng ngày 10/6` |
| Low-confidence | Nhập: `Tìm vé đi Đà Nẵng ngày 10/6` |
| Failure | Bấm scenario `Failure` hoặc nhập: `Tìm vé từ Hà Nội đi Đà Nẵng bằng tàu hỏa` |
| Correction | Bấm nút sửa trong widget, chọn lại phương tiện rồi cập nhật |

## Giới hạn hiện tại

- Chưa có backend thật.
- Chưa có mock data JSON riêng.
- Chưa có search tool riêng.
- Dữ liệu kết quả đang hard-code để demo frontend nhìn được và bấm thử được trước.

## Bước tiếp theo

1. Tách data hard-code sang `codebase/Data`.
2. Viết search tool đọc mock data.
3. Nối frontend với backend API.
