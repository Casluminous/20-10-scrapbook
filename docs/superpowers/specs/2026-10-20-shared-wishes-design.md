# Tường lời chúc chung

Phương án được người dùng đồng ý ngày 20/10/2026: giữ website GitHub Pages, dùng Supabase Free để lưu lời nhắn và cho mọi người cùng đọc.

## Hành vi

- Giữ nguyên giao diện cuốn sổ, các trang và phần nhạc.
- Khi người xem ghim lời nhắn, lưu người nhận, nội dung và thời gian gửi trong Supabase.
- Chỉ thông báo đã gửi khi máy chủ xác nhận lưu thành công. Khi lỗi, giữ nội dung để gửi lại.
- Hiển thị tối đa 9 lời nhắn mỗi lượt theo bố cục hiện có; có điều khiển xem lời mới hơn hoặc cũ hơn.
- Lưu toàn bộ lời nhắn, không xóa khi vượt 5 lời như bộ nhớ trình duyệt cũ.
- Người dùng quản lý dữ liệu qua tài khoản Supabase của chính mình.
- Dòng thông báo dưới biểu mẫu nói rõ lời nhắn được lưu trực tuyến và hiển thị công khai.
- Lời nhắn cũ chỉ tồn tại trong trình duyệt không tự động được công khai; người viết có thể gửi lại chủ động.

## Dữ liệu và quyền

Bảng `wishes`: `id` UUID, `name` tối đa 24 ký tự, `text` tối đa 140 ký tự, `created_at` do máy chủ tạo. Bật RLS. Khách được đọc và tạo lời nhắn hợp lệ, không được sửa hoặc xóa. Chỉ khóa công khai được đưa vào frontend. Không đưa mật khẩu, khóa bí mật hoặc khóa quản trị lên GitHub.

## Kết nối và lỗi

Frontend gọi Supabase qua HTTPS, có giới hạn thời gian chờ. Khóa nút gửi trong lúc lưu, giữ mã yêu cầu khi thử lại để tránh lưu trùng sau sự cố mạng. Có trạng thái tải, lỗi và thử lại rõ ràng. Tường có thể lấy lời mới khi mở lại trang hoặc làm mới danh sách.

## Xác minh

Kiểm tra bằng hai phiên trình duyệt độc lập: gửi ở phiên A, đọc ở phiên B, tải lại vẫn còn. Kiểm tra lỗi mạng không làm mất nội dung; dữ liệu vượt giới hạn bị máy chủ từ chối; khách không sửa/xóa được lời nhắn. Kiểm tra phân trang, chữ tiếng Việt, màn hình nhỏ và nhạc.

## Phụ thuộc

Chủ website đăng nhập Supabase, tạo dự án thuộc gói Free và cung cấp kết nối qua trang quản lý. Gói Free có 500 MB cơ sở dữ liệu và có thể tạm dừng sau một tuần ít hoạt động. Chỉ xuất bản thay đổi frontend khi backend đã được thiết lập và kiểm tra.
