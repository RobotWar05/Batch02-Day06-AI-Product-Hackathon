# Frontend Demo - AI Đi Không

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
- Result cards hard-code trong JavaScript, gồm dữ liệu demo cho tàu hỏa và máy bay

## Flow đã hỗ trợ

| Path | Cách test |
|---|---|
| Happy | Nhập: `Tìm 2 vé tàu hỏa từ Sài Gòn đi Đà Nẵng ngày 10/6` |
| Happy flight | Nhập: `Tìm vé máy bay từ Hà Nội đi Đà Nẵng ngày 10/6` |
| Low-confidence | Nhập: `Tìm vé đi Đà Nẵng ngày 10/6` |
| Low-confidence thiếu ngày | Nhập: `Tìm vé đi Đà Nẵng` rồi chọn ngày bằng quick button |
| Failure | Bấm scenario `Failure` hoặc nhập: `Tìm vé từ Hà Nội đi Đà Nẵng bằng tàu hỏa` |
| Correction | Bấm nút sửa trong widget, chọn lại phương tiện rồi cập nhật |

Khi bấm `Tìm chuyến`, frontend chỉ hiển thị một block kết quả hiện tại. Nếu bấm lại, block kết quả sẽ được refresh chứ không append nhiều lần.

## Giới hạn hiện tại

- Chưa có backend thật.
- Chưa có mock data JSON riêng.
- Chưa có search tool riêng.
- Dữ liệu kết quả đang hard-code để demo frontend nhìn được và bấm thử được trước.
- Result cards hiện là dữ liệu giả, chưa lọc theo route thật.
- Parser demo nhận được cả `10/6` và `10 tháng 6`.

## Bước tiếp theo

1. Tách data hard-code sang `codebase/Data`.
2. Viết search tool đọc mock data.
3. Nối frontend với backend API.
