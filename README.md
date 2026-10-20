# Sổ tay 20 tháng 10

Website kỷ niệm Ngày Phụ nữ Việt Nam, gồm 7 trang với hiệu ứng lật sổ, nhạc nền, tường lời chúc và phòng chat chung.

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
git add index.html styles.css script.js music-player.js chat-api.js chat.js wishes-api.js wishes-config.js wishes-session.js wishes-admin-api.js wishes-admin.js wishes-admin.css so-rieng-*.html audio
git commit -m "Update scrapbook"
git push origin main
```

GitHub Pages sẽ tự xuất bản phiên bản mới sau khi push.

## Nhạc và lời chúc

- Nhạc nền: `audio/nhac-nen.m4a`. Trình duyệt có thể yêu cầu người xem nhấn nút nhạc hoặc tương tác với trang trước khi phát.
- Âm lượng mặc định 22%. Nút chỉnh cạnh nút nhạc mở thanh 0–100%; lựa chọn được ghi nhớ trong trình duyệt. Chỉnh khi đang tạm dừng không tự phát nhạc. Web Audio GainNode điều khiển mức nghe khi được hỗ trợ; môi trường còn lại dùng thuộc tính volume của audio.
- Lời chúc được lưu trong bảng `public.wishes` của Supabase và hiển thị công khai cho mọi người. Mỗi lượt hiển thị tối đa 9 lời, có nút xem lời cũ; không tự xóa khi có lời mới.
- Font chữ được tải từ Google Fonts.
- `_mobile-test.html` là file thử trên máy và không được đưa lên website.

## Quản lý và lưu bản sao lời chúc

Mở https://supabase.com/dashboard/project/lzqjxlfyxczbikcsyzbn/editor/17726?schema=public bằng tài khoản chủ dự án để vào bảng `wishes`. Mỗi dòng gồm người nhận (`name`), lời nhắn (`text`) và thời gian gửi (`created_at`). Có thể lọc, xem toàn bộ và xuất dữ liệu CSV trong Table Editor.

Khách truy cập chỉ có quyền đọc và thêm. Chủ dự án có thể quản lý lời nhắn trong Supabase. Cấu hình frontend ở `wishes-config.js` chỉ chứa Project URL và publishable key; không đưa database password, secret key hoặc service role key lên GitHub.

## Trang quản trị và yêu thích

Trang quản trị riêng được gửi trực tiếp trong chat, không đặt liên kết trên website công khai và có chỉ thị không lập chỉ mục. Việc bảo vệ thao tác được thực hiện bằng Supabase Auth và RLS, không dựa vào việc giấu đường dẫn.

Đăng nhập bằng tài khoản website đã tạo trong Authentication, không dùng mật khẩu database. Chỉ UID được chủ dự án cấp trong `wish_admins` mới có quyền quản trị. Phiên quản trị chỉ ở bộ nhớ tab; tải lại trang cần đăng nhập lại. Trang hỗ trợ tìm kiếm người nhận/nội dung, xem lời mới hoặc nhiều yêu thích, thả tim, chuyển vào thùng rác và khôi phục. Không có thao tác xóa vĩnh viễn. Lời trong thùng rác không còn đọc được qua API công khai.

Khách thả tim ngay trên các thẻ ở trang Gửi gắm. Supabase tạo danh tính khách ẩn danh khi bấm tim lần đầu và trình duyệt ghi nhớ phiên này. Mỗi danh tính có một lượt cho mỗi lời chúc, bấm lại để bỏ thích. Xóa dữ liệu trình duyệt hoặc dùng thiết bị khác sẽ là danh tính khác. Trạng thái được gửi theo giá trị mong muốn để thử lại không tăng trùng lượt. Tổng lượt được tính ở database; frontend không có quyền tự tăng số.

Migration `supabase/20261020-moderation-favorites.sql` đã được áp dụng sau schema ban đầu, giữ lại toàn bộ lời chúc. Chủ dự án đã bật anonymous sign-ins và cấp UID quản trị trong database. Khi dựng một dự án mới, cần tạo tài khoản chủ và tự cấp UID đó; không cấp quyền qua email nhập ở frontend hoặc metadata người dùng.

`supabase/verify-moderation-favorites.sql` kiểm tra phân quyền, yêu thích, thùng rác và khôi phục trong giao dịch tự hoàn tác, không thay đổi lời chúc thật.

## Phòng chat chung — trang 7

Mở https://casluminous.github.io/20-10-scrapbook/#trang-7. Mọi người nhập tên (tối đa 24 ký tự), gửi tin (tối đa 500 ký tự), đọc 50 tin mới nhất và bấm Xem tin trước để đọc lịch sử. Tên hiển thị được ghi nhớ trên trình duyệt. Tin nhắn là văn bản thuần và được lưu trong Supabase, không tự biến mất khi đóng trang.

Phòng chat kiểm tra tin mới khoảng 5 giây khi đang mở trang 7 và tab đang hiển thị. Rời trang hoặc chuyển tab sẽ dừng việc lấy tin. Tin mới không tự kéo người đang đọc lịch sử xuống cuối. Nút Làm mới mở lại 50 tin mới nhất.

Dùng lại phiên khách ẩn danh của tính năng yêu thích, không yêu cầu người xem đăng ký. RPC gửi tin đặt tác giả và thời gian tại máy chủ, giới hạn một tin mỗi 3 giây theo danh tính khách và nhận diện lần gửi bằng UUID. Khi mạng lỗi, giữ bản nhập và dùng lại UUID để tránh lưu trùng lúc thử lại. Giới hạn theo danh tính không thay thế hệ thống chống spam toàn diện.

Trong trang quản trị, chọn Trò chuyện để tìm, đưa tin vào thùng rác hoặc khôi phục. Khách không được sửa/xóa tin, đọc mã tác giả hoặc giả mạo thời gian qua API. UID quản trị hiện có tiếp tục được sử dụng.

Trong mục Lời chúc của trang quản trị, mở “Theo dõi từ” để đếm số lời chúc có chứa từ/cụm từ và đọc kết quả (20 lời mỗi trang). Chỉ tìm nội dung lời chúc đang trên tường, không tính tên người nhận hay thùng rác. Không phân biệt hoa/thường, giữ dấu, tìm chuỗi con theo đúng ký tự; mỗi lời tính một lần. Tổng số được đếm tại máy chủ trên toàn bộ kết quả bằng `count=exact`, không phụ thuộc trang đang xem. Sau khi xóa/khôi phục, kết quả theo dõi được làm mới. Công cụ dùng phiên quản trị hiện có, không thêm quyền hay thay đổi cơ sở dữ liệu.

Trang 5 cũng có “Tìm trong lời chúc” cho mọi người sử dụng không cần đăng nhập, cùng quy tắc đếm/tìm và 9 kết quả mỗi trang. Nội dung khớp được tô sáng; bấm “Xem tất cả” để trở lại tường có lời ghim đầu. Khi gửi một lời chúc mới thành công, bộ lọc được xóa để xem lại tường chung. Không tạo thêm quyền truy cập hay hiển thị nội dung đã đưa vào thùng rác.

`supabase/20261020-chat.sql` đã tạo bảng/RPC và phân quyền. `supabase/verify-chat.sql` kiểm tra gửi tin, xác thực, giới hạn, chống trùng, mã tác giả và thùng rác bằng giao dịch hoàn tác.

`supabase/schema.sql` ghi lại cấu trúc và chính sách của bảng đã tạo, dùng cho dự án mới. Không chạy lại các lệnh tạo policy trên cùng dự án nếu policy đã tồn tại.

Nếu mất mạng khi gửi, biểu mẫu giữ nguyên nội dung để thử lại. Cùng một lần gửi được nhận diện bằng UUID để tránh lưu trùng nếu máy chủ đã lưu nhưng trình duyệt mất phản hồi.

Những lời nhắn của phiên bản cũ chỉ nằm trong localStorage của từng người, không tự được đưa lên công khai. Muốn chia sẻ một lời cũ, người viết cần chủ động gửi lại.

Supabase Free có giới hạn 500 MB database, 5 GB egress và có thể tạm dừng sau một tuần ít hoạt động. Gói Free không có sao lưu tự động; nên chủ động xuất CSV để giữ bản sao. Xem https://supabase.com/pricing.
