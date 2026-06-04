# Frontend Test

Ban test rieng trong `Frontend/frontend-test`.

## Nguyen tac mock data

- Khong sua thu muc `Data` goc.
- Mock data trong ban test da bo truong ngay co dinh.
- User hoi ngay nao thi UI van hien ngay do, nhung gia/chuyen khong thay doi theo ngay.

## Cau truc

```text
frontend-test/
  index.html
  data/
    mock/
      trips.mock.json
  assets/
    styles/
      base.css
    scripts/
      config/
        tailwind.config.js
      core/
        message-parser.js
      data/
        trip-catalog.mock.js
      services/
        trip-search-service.js
      ui/
        chat-app.js
```

## Cach test

Mo truc tiep:

```text
index.html
```

Nhap thu:

- `Tim ve may bay tu Ha Noi di Da Nang ngay 6/6`
- `Tim ve may bay tu Ha Noi di Da Nang ngay 20/12`
- `Tim 2 ve tau hoa tu Ha Noi di TP.HCM ngay 15/8`
- `Tim Vietnam Airlines tu Ha Noi di Da Nang ngay 1/1`

Cac ngay khac nhau se ra cung bo gia/chuyen vi day la mock data.
