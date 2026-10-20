# Quản trị riêng và yêu thích lời chúc

Người dùng đã đồng ý phương án ngày 20/10/2026: trang riêng đăng nhập email/mật khẩu, xóa có thể khôi phục, trái tim công khai cho khách.

## Phạm vi

- Không tạo thêm tường lời chúc công khai riêng. Tiếp tục dùng trang Gửi gắm.
- Thêm trang quản trị không được liên kết từ website công khai, phong cách giấy cũ, ưu tiên đọc nội dung và thao tác rõ ràng trên cả điện thoại.
- Supabase Auth xác thực tài khoản quản trị. Danh sách UID quản trị được giữ trong database; đường dẫn riêng không thay thế kiểm tra quyền.
- Quản trị xem, tìm kiếm lời chúc, sắp xếp mới nhất hoặc nhiều yêu thích, chuyển lời vào thùng rác và khôi phục. Không có chức năng xóa vĩnh viễn.
- Khách bấm trái tim để thích/bỏ thích, thấy tổng lượt. Mỗi tài khoản khách ẩn danh có một lượt mỗi lời. Trình duyệt lưu phiên khách để ghi nhớ; xóa dữ liệu trình duyệt/đổi thiết bị sẽ tạo danh tính khác.

## Dữ liệu và bảo vệ

- Thêm `deleted_at` và `favorite_count` vào `wishes`. Công khai chỉ đọc lời chưa bị xóa.
- Bảng `wish_admins` chỉ do chủ dự án cấp UID, khách không được ghi hay đọc danh sách.
- Bảng `wish_favorites` khóa chính `(wish_id,user_id)`, mỗi khách chỉ được thêm/xóa/đọc lượt của mình. Trigger cập nhật số lượt tại máy chủ; frontend không được tự ghi số lượt.
- Chỉ UID quản trị được cập nhật `deleted_at`. Không cho khách sửa/xóa lời nhắn hoặc tự cấp quyền.
- Mật khẩu quản trị được nhập trên Supabase và trang đăng nhập. Không ghi mật khẩu, khóa quản trị hoặc session quản trị vào mã nguồn; session quản trị chỉ ở bộ nhớ tab.

## Hành vi lỗi và kiểm tra

- Mỗi nút có trạng thái chờ, thất bại không hiển thị thành công. Đánh dấu thích theo trạng thái mong muốn để thử lại không bị đảo trạng thái hai lần.
- Kiểm tra SQL trong giao dịch hoàn tác: khách không có quyền quản trị, không tự tăng count, thích trùng bị chặn, thùng rác không công khai, chủ có thể khôi phục.
- Kiểm tra UI với dữ liệu thử riêng: đăng nhập/đăng xuất, tài khoản thường bị từ chối, tìm kiếm, phân trang, xóa/khôi phục, yêu thích/bỏ thích, lỗi mạng, bàn phím và màn hình nhỏ.
- Backend được thiết lập trước, giữ tương thích frontend cũ. Kiểm tra rồi xuất bản lên GitHub Pages hiện có.
