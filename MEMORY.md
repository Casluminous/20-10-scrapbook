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
