# Frontend Demo - AI Di Khong
Day 06 AI Product Hackathon frontend prototype.
## Cach chay
Mo truc tiep file:
```text
index.html
```
Frontend hien chua can backend va chua can cai package. Project dang dung:
- Tailwind CDN
- Material Symbols
- Mock parser trong `assets/js/parser.js`
- Mock data trong `assets/js/mock-data.js`
- UI/render/event handling trong `assets/js/app.js`
## Cau truc thu muc
```text
Frontend/
  index.html
  README.md
  assets/
    css/
      base.css
    js/
      tailwind.config.js
      mock-data.js
      parser.js
      app.js
```
## Flow da ho tro
| Path | Cach test |
|---|---|
| Happy | Nhap: `Tim 2 ve tau hoa tu Sai Gon di Da Nang ngay 10/6` |
| Happy flight | Nhap: `Tim ve may bay tu Ha Noi di Da Nang ngay 10/6` |
| Low-confidence | Nhap: `Tim ve di Da Nang ngay 10/6` |
| Low-confidence thieu ngay | Nhap: `Tim ve di Da Nang` roi chon ngay bang quick button |
| Failure | Bam scenario `Failure` hoac nhap: `Tim ve tu Ha Noi di Da Nang bang tau hoa` |
| Correction | Bam nut sua trong widget, chon lai phuong tien roi cap nhat |
Khi bam `Tim chuyen`, frontend chi hien thi mot block ket qua hien tai. Neu bam lai, block ket qua se duoc refresh, khong append nhieu lan.
## Gioi han hien tai
- Chua co backend that.
- Chua doc data tu API hoac file JSON.
- Du lieu ket qua van la mock data de demo frontend.
- Result cards chua loc theo route that.
- Parser demo nhan duoc ca `10/6` va `10 thang 6`.
## Huong tich hop tiep theo
1. Doi `assets/js/mock-data.js` sang nguon data that hoac API response tu backend.
2. Tach service goi API rieng, vi du `assets/js/api-client.js`.
3. Giu `parser.js` la fallback/local demo hoac thay bang response NLP tu backend.
4. Chuan hoa contract slot/result voi backend truoc khi bo mock.
