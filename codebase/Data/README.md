# Data README - Travel Mock Data

Thu muc nay chua mock data cho demo tim chuyen di. Data chi tap trung vao hai phuong tien: may bay va tau hoa. Khong scrape web, khong goi API that, khong tu dat ve that.

## Pham vi hien tai

- May bay: Ha Noi, TP.HCM, Da Nang, Nha Trang, Phu Quoc, Da Lat.
- Tau hoa: Ha Noi, TP.HCM, Da Nang, Nha Trang, Lao Cai.
- Sa Pa co trong metadata de nhan dien intent, nhung khong co chuyen bay hoac tau thang. Neu can di Sa Pa bang tau, du lieu hop ly la Ha Noi - Lao Cai.

## Chinh sach ngay di

Day la mock data nen khong khoa theo ngay co dinh. Moi trip record dung:

```json
{
  "availability_type": "mock_any_date",
  "price_policy": "static_mock_price"
}
```

Backend co the nhan ngay nguoi dung nhap de hien thi lai, nhung khong filter data theo ngay.

## Cau truc file

```text
Data/
  trips.json
  metadata/
    locations.json
    provider_profiles.json
  trips/
    trips_manifest.json
    flight/
      bamboo_airways.json
      sun_phuquoc_airways.json
      vietnam_airlines.json
      vietjet_air.json
      vietravel_airlines.json
    train/
      vietnam_railways.json
  rules/
    fallback_rules.json
    ranking_rules.json
  schemas/
    query_schema.json
    response_schema.json
  tests/
    search_test_cases.json
```

## Hanh vi mong muon

- Neu co du lieu dung route va dung phuong tien, tra ket qua.
- Neu user hoi phuong tien khong co that trong data, tra no-results thay vi tao gia.
- Vi du: Ha Noi di Phu Quoc bang tau phai bao khong co du lieu tau.
- Vi du: Ha Noi di Sa Pa bang may bay phai bao khong co du lieu bay thang.
- Vi du: Ha Noi di Lao Cai bang tau thi co du lieu, co the dung de ho tro hanh trinh di Sa Pa neu backend co resolver.

