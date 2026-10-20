## 2026-10-20
- Đã làm: giảm bộ lọc SVG/noise, blur, hiệu ứng 3D và số hạt trên thiết bị cảm ứng; chuyển trang 300 ms, dọn lớp chuyển động sau khi kết thúc.
- Đã kiểm tra: WebKit giả lập iPhone qua 7 trang, cuộn chat, điều chỉnh nhạc, không lỗi JavaScript; Edge desktop giữ bộ lọc và 11 cánh hoa.
- Đang dở: chưa đo FPS trên iPhone thật.
- Việc tiếp theo: người dùng thử lại Safari sau khi xuất bản.
- Quyết định: giữ nguyên chức năng và hiệu ứng desktop; đổi phiên bản CSS/JS để tránh cache cũ.

## 2026-10-20 — chuyển trang điện thoại
- Đã làm: thay mờ dần bằng trượt ngang 24/18 px theo hướng chuyển trang, kết hợp mờ dần trong 260 ms.
- Đã kiểm tra: WebKit iPhone, hai chiều CSS, 7 trang, chat/nhạc và reduced motion; desktop giữ hiệu ứng cũ.
- Đang dở: chưa thử trên iPhone thật. Tiếp theo: người dùng thử Safari.
- Quyết định: chỉ sửa CSS thiết bị cảm ứng, đổi phiên bản stylesheet tránh cache.

## 2026-10-20 — chỉnh tốc độ
- Đã làm: theo yêu cầu người dùng, tăng transition điện thoại lên 450 ms, khóa chuyển trang 500 ms; đổi cache CSS/JS.
- Đã kiểm tra: WebKit iPhone qua 7 trang, reduced motion, chat/nhạc; desktop giữ nguyên. Chưa thử máy thật; tiếp theo người dùng thử Safari.

## 2026-10-20 — ghim lời hướng dẫn
- Đã làm: ghim lời “Mẫu” ID 1aa06aa9-8fd6-49f5-b649-d2de4f61c913 ở đầu trang đầu tường lời chúc qua cấu hình pinnedWishId; giữ ngày gửi và nội dung gốc.
- Đã kiểm tra: đọc dữ liệu thật xác nhận đúng lời; phân trang không trùng/sót với pin hiện, pin bị xóa, tường rỗng. Quyết định: ghim một lời theo yêu cầu, không thêm chức năng quản trị mới.
- Đang dở: không. Tiếp theo: người dùng xem tường lời chúc sau xuất bản.
