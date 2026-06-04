# Data README - AI Đi Không

Thư mục này chứa **mock data nội bộ** cho demo chatbot AI Đi Không. Data đóng vai trò giống dữ liệu có sẵn của một nền tảng travel như Trip.com, dùng để frontend/backend demo luồng tìm chuyến, so sánh phương tiện và gợi ý lựa chọn phù hợp.

Không scrape web, không gọi API thật, không tự đặt vé thật.

---

## 1. File data

| File | Mục đích |
|---|---|
| `locations.json` | Chuẩn hóa tên địa điểm và alias người dùng có thể nhập |
| `trips.json` | File tổng hợp legacy, giữ lại để frontend/backend cũ chưa bị gãy |
| `trips/trips_manifest.json` | Manifest mô tả các file data đã tách |
| `trips/flights/*.json` | Data chuyến bay tách theo từng hãng |
| `trips/trains/*.json` | Data tàu tách theo nhà vận hành |
| `search_test_cases.json` | Case test cho parser/search/backend |

Khuyến nghị backend mới nên đọc theo `trips/trips_manifest.json`, sau đó load từng file theo nhu cầu. `trips.json` chỉ nên coi là file tương thích tạm thời.

---

## 1.1. Cấu trúc thư mục split

```text
Data/
  locations.json
  search_test_cases.json
  trips.json
  trips/
    trips_manifest.json
    flights/
      bamboo_airways.json
      sun_phuquoc_airways.json
      vietnam_airlines.json
      vietjet_air.json
      vietravel_airlines.json
    trains/
      vietnam_railways.json
```

Ý nghĩa:

- `flights/vietnam_airlines.json`: chỉ chứa chuyến bay Vietnam Airlines.
- `flights/vietjet_air.json`: chỉ chứa chuyến bay Vietjet Air.
- `flights/bamboo_airways.json`: chỉ chứa chuyến bay Bamboo Airways.
- `flights/vietravel_airlines.json`: chỉ chứa chuyến bay Vietravel Airlines.
- `flights/sun_phuquoc_airways.json`: chỉ chứa chuyến bay Sun PhuQuoc Airways.
- `trains/vietnam_railways.json`: chỉ chứa chuyến tàu Vietnam Railways.

---

## 2. Phạm vi route

Data hiện phủ 3 tuyến chính, đủ 2 chiều:

| Route | Flight | Train |
|---|---:|---:|
| Hà Nội -> TP.HCM | 5 | 2 |
| TP.HCM -> Hà Nội | 5 | 2 |
| Hà Nội -> Đà Nẵng | 5 | 2 |
| Đà Nẵng -> Hà Nội | 5 | 2 |
| Hà Nội -> Nha Trang | 5 | 2 |
| Nha Trang -> Hà Nội | 5 | 2 |

Tổng cộng:

```text
42 records
- 30 flight records
- 12 train records
```

---

## 3. Cách hiển thị đề xuất

Backend/frontend nên ưu tiên hiển thị:

```text
Flight: 3 chuyến rẻ nhất trước
Train: 2 chuyến tàu trước
```

Nếu người dùng bấm `Xem thêm`, hiển thị các chuyến còn lại để tham khảo thêm hãng khác.

Nếu người dùng chỉ định hãng bay, ví dụ:

```text
Tìm Vietnam Airlines từ Hà Nội đi Đà Nẵng
```

thì backend nên đưa chuyến của hãng đó lên đầu. Nếu vẫn có chuyến rẻ hơn của hãng khác, chatbot có thể hỏi:

```text
Tôi đã ưu tiên Vietnam Airlines theo yêu cầu của bạn.
Có chuyến rẻ hơn của Vietjet Air. Bạn muốn xem chuyến rẻ hơn không?
```

---

## 4. Schema chính trong `trips.json`

Mỗi record có dạng:

```json
{
  "id": "flight_han_sgn_vj_0720_20260606",
  "provider": "Vietjet Air",
  "code": "VJ-HANSGN-0720",
  "transport_mode": "flight",
  "trip_type_supported": ["one_way", "round_trip"],
  "origin": "Hà Nội",
  "destination": "TP.HCM",
  "date": "2026-06-06",
  "return_date": "2026-06-08",
  "departure_time": "07:20",
  "arrival_time": "09:30",
  "duration_minutes": 130,
  "duration_label": "2h10m",
  "is_direct": true,
  "one_way_price_vnd": 1813000,
  "round_trip_price_vnd": 3626000,
  "price_label_one_way": "1.813.000đ",
  "price_label_round_trip": "3.626.000đ",
  "available_seats": 14,
  "pickup_location": "Sân bay Nội Bài",
  "dropoff_location": "Sân bay Tân Sơn Nhất",
  "baggage_policy": "Hành lý xách tay cơ bản",
  "refund_policy": "Đổi/hủy tùy điều kiện vé",
  "comfort_score": 7,
  "reliability_score": 8,
  "time_score": 10,
  "price_score": 8,
  "best_for": "Người muốn đến TP.HCM trong buổi sáng",
  "pros": ["Bay thẳng", "Giờ bay sáng", "Thời gian ngắn"],
  "cons": ["Phải ra sân bay sớm", "Giá có thể tăng khi đặt sát ngày"],
  "recommendation_reason": "Phù hợp nếu bạn cần có mặt ở TP.HCM trước trưa nhưng vẫn muốn giữ giá hợp lý.",
  "display_group": "flight_options",
  "directness_label": "Đi thẳng",
  "provider_preference_tags": ["vietjet_air", "cheap"],
  "display_rank": 2,
  "default_visible": true,
  "reveal_group": "default",
  "data_source_type": "mock"
}
```

---

## 5. Ý nghĩa field quan trọng

| Field | Ý nghĩa |
|---|---|
| `transport_mode` | `flight` hoặc `train` |
| `trip_type_supported` | Hỗ trợ `one_way`, `round_trip` |
| `one_way_price_vnd` | Giá một chiều dùng cho sort/filter |
| `round_trip_price_vnd` | Giá khứ hồi dùng cho sort/filter |
| `is_direct` | Chỉ lấy chuyến đi thẳng trong demo |
| `display_rank` | Thứ tự hiển thị trong cùng route/mode, tính theo giá |
| `default_visible` | `true` nếu nên hiện mặc định |
| `reveal_group` | `default` hoặc `see_more` |
| `provider_preference_tags` | Dùng để ưu tiên hãng nếu user nói rõ hãng |
| `recommendation_reason` | Câu giải thích cho chatbot |

---

## 6. Search rule gợi ý

Backend nên filter theo:

```text
origin exact match
destination exact match
date exact match
transport_mode optional
is_direct == true
available_seats >= passengers
```

Nếu `transport_mode` rỗng, trả cả flight và train để chatbot so sánh.

Sort mặc định:

```text
display_rank ASC
```

Hoặc tính điểm:

```text
recommended_score =
  price_score * 0.30
+ time_score * 0.30
+ comfort_score * 0.20
+ reliability_score * 0.20
```

---

## 7. Test cần có

- Một chiều: dùng `one_way_price_vnd`.
- Khứ hồi: dùng `round_trip_price_vnd`.
- User không nói hãng: hiện 3 chuyến bay rẻ nhất.
- User nói hãng: ưu tiên hãng đó lên đầu.
- User bấm xem thêm: hiện các hãng/chuyến còn lại.
- User so sánh tàu và máy bay: trả 2 khung riêng.
- Route ngoài phạm vi: trả `no_results`.

---

## 8. Lưu ý

- Đây là mock data, không phải dữ liệu realtime.
- Không ghi nguồn ảnh vào record vì demo giả định hệ thống có sẵn data nội bộ.
- Không dùng nối chuyến trong v1.
- Không tự động đặt vé; nút đặt vé chỉ là link-out/demo action.
