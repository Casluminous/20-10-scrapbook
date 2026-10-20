# Âm lượng và phòng chat trang 7

Người dùng đồng ý ngày 20/10/2026: giảm nhạc mặc định từ 32% xuống 22%, thêm thanh chỉnh âm lượng, phòng chat chung trên trang 7 và quản lý tin chat trong trang riêng.

- Giữ nguyên 6 trang hiện có, thêm trang 7 Góc trò chuyện; cập nhật bộ đếm, chấm điều hướng và nhãn truy cập.
- Nút nhạc vẫn bật/tắt. Nút chỉnh âm lượng mở thanh 0–100%, ghi nhớ lựa chọn; điều chỉnh khi tạm dừng không tự phát nhạc. Dùng Web Audio GainNode khi hỗ trợ để điều khiển độ lớn trên thiết bị di động; giữ phương án volume của audio khi không hỗ trợ.
- Khách đặt tên tối đa 24 ký tự và gửi tin tối đa 500 ký tự. Nội dung là văn bản thuần, không diễn giải HTML. Ghi nhớ tên trên trình duyệt.
- Dùng lại phiên khách ẩn danh của chức năng yêu thích. Database tự xác định tác giả/thời gian. RPC gửi tin kiểm tra độ dài, chống gửi trùng theo UUID và giới hạn một tin mỗi 3 giây cho mỗi danh tính.
- Lịch sử lưu trong bảng chat_messages, hiển thị 50 tin mới nhất, có xem tin cũ. Tự cập nhật khoảng 5 giây khi trang 7 và tab đang mở; không kéo người đọc xuống khi họ đang đọc tin cũ.
- Lỗi mạng giữ nguyên bản nhập, chỉ báo thành công sau khi máy chủ xác nhận. Không cần đăng ký tài khoản để chat.
- Trang quản trị hiện có thêm lựa chọn Trò chuyện: tìm kiếm, đưa tin vào thùng rác và khôi phục bằng cùng UID quản trị. Tin ẩn không đọc được qua API công khai. Không thêm đường dẫn quản trị vào website.

Kiểm tra: quyền đọc/gửi và quản trị trong giao dịch hoàn tác; gửi trùng/rate limit; hai phiên UI độc lập; lỗi mạng; đổi trang khi chat/đang nhập; điều khiển âm lượng và ghi nhớ; màn hình nhỏ và bàn phím; bản triển khai GitHub Pages.
