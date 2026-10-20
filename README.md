# Sổ tay 20 tháng 10

Website kỷ niệm Ngày Phụ nữ Việt Nam, gồm 6 trang với hiệu ứng lật sổ, nhạc nền và tường lời chúc.

## Chạy trên máy

Đây là web HTML/CSS/JavaScript thuần, không cần cài thư viện hoặc build.

```powershell
cd C:\Users\steal\20-10-scrapbook
python -m http.server 8000
```

Mở http://localhost:8000 trong trình duyệt.

## Website

https://casluminous.github.io/20-10-scrapbook/

GitHub Pages được cấu hình xuất bản từ nhánh `main`, thư mục gốc `/`.

## Cập nhật website

Sau khi chỉnh sửa và kiểm tra trên máy:

```powershell
cd C:\Users\steal\20-10-scrapbook
git add index.html styles.css script.js audio
git commit -m "Update scrapbook"
git push origin main
```

GitHub Pages sẽ tự xuất bản phiên bản mới sau khi push.

## Nhạc và lời chúc

- Nhạc nền: `audio/nhac-nen.m4a`. Trình duyệt có thể yêu cầu người xem nhấn nút nhạc hoặc tương tác với trang trước khi phát.
- Lời chúc lưu trong `localStorage` của từng trình duyệt, giữ 5 lời mới nhất. Chúng chưa được chia sẻ giữa những người truy cập.
- Font chữ được tải từ Google Fonts.
- `_mobile-test.html` là file thử trên máy và không được đưa lên website.
