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
git add index.html styles.css script.js wishes-api.js wishes-config.js audio
git commit -m "Update scrapbook"
git push origin main
```

GitHub Pages sẽ tự xuất bản phiên bản mới sau khi push.

## Nhạc và lời chúc

- Nhạc nền: `audio/nhac-nen.m4a`. Trình duyệt có thể yêu cầu người xem nhấn nút nhạc hoặc tương tác với trang trước khi phát.
- Lời chúc được lưu trong bảng `public.wishes` của Supabase và hiển thị công khai cho mọi người. Mỗi lượt hiển thị tối đa 9 lời, có nút xem lời cũ; không tự xóa khi có lời mới.
- Font chữ được tải từ Google Fonts.
- `_mobile-test.html` là file thử trên máy và không được đưa lên website.

## Quản lý và lưu bản sao lời chúc

Mở https://supabase.com/dashboard/project/lzqjxlfyxczbikcsyzbn/editor/17726?schema=public bằng tài khoản chủ dự án để vào bảng `wishes`. Mỗi dòng gồm người nhận (`name`), lời nhắn (`text`) và thời gian gửi (`created_at`). Có thể lọc, xem toàn bộ và xuất dữ liệu CSV trong Table Editor.

Khách truy cập chỉ có quyền đọc và thêm. Chủ dự án có thể quản lý lời nhắn trong Supabase. Cấu hình frontend ở `wishes-config.js` chỉ chứa Project URL và publishable key; không đưa database password, secret key hoặc service role key lên GitHub.

`supabase/schema.sql` ghi lại cấu trúc và chính sách của bảng đã tạo, dùng cho dự án mới. Không chạy lại các lệnh tạo policy trên cùng dự án nếu policy đã tồn tại.

Nếu mất mạng khi gửi, biểu mẫu giữ nguyên nội dung để thử lại. Cùng một lần gửi được nhận diện bằng UUID để tránh lưu trùng nếu máy chủ đã lưu nhưng trình duyệt mất phản hồi.

Những lời nhắn của phiên bản cũ chỉ nằm trong localStorage của từng người, không tự được đưa lên công khai. Muốn chia sẻ một lời cũ, người viết cần chủ động gửi lại.

Supabase Free có giới hạn 500 MB database, 5 GB egress và có thể tạm dừng sau một tuần ít hoạt động. Gói Free không có sao lưu tự động; nên chủ động xuất CSV để giữ bản sao. Xem https://supabase.com/pricing.
