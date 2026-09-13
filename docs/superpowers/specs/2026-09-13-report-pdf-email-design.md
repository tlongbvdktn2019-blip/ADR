# Gửi báo cáo ADR dạng PDF qua email

Ngày: 2026-09-13

## Mục tiêu

Trên trang chi tiết báo cáo, người dùng bấm `Gửi PDF`, xác nhận thao tác và hệ thống gửi báo cáo theo đúng mẫu in hiện tại tới địa chỉ cố định `di.pvcenter@gmail.com`.

Admin được gửi mọi báo cáo. User chỉ được gửi báo cáo thuộc `organization_id` của mình theo lớp phân quyền báo cáo hiện có.

## Thiết kế

- Tách HTML mẫu in thành template dùng chung cho màn hình in và PDF.
- Tạo PDF A4 phía server bằng Puppeteer Core và Chromium dành cho serverless.
- PDF được giữ trong bộ nhớ và truyền trực tiếp cho Nodemailer dưới dạng attachment, không lưu vào database hoặc ổ đĩa.
- API không nhận địa chỉ email từ client; recipient luôn là `di.pvcenter@gmail.com`.
- Email chỉ chứa phần tóm tắt gồm mã báo cáo, đơn vị, mức độ nghiêm trọng và thời điểm gửi; dữ liệu đầy đủ nằm trong PDF.
- Cho phép gửi lại và không lưu lịch sử gửi trong phiên bản này.

## Giao diện

Thay menu Email hiện tại bằng nút `Gửi PDF`. Khi bấm, hiển thị hộp thoại xác nhận có mã báo cáo và địa chỉ nhận. Trong lúc xử lý, khóa thao tác để tránh gửi hai lần. Thành công đóng hộp thoại và hiện thông báo; thất bại giữ hộp thoại để thử lại.

## API và lỗi

`POST /api/reports/[id]/send-email` không yêu cầu request body. Trường `email` từ client cũ nếu có sẽ bị bỏ qua.

- `401`: chưa đăng nhập.
- `404`: không có quyền theo đơn vị hoặc không tìm thấy báo cáo.
- `500`: không tạo được PDF hoặc SMTP gửi thất bại.

Response thành công chứa recipient cố định, message ID và tên attachment; không trả nội dung PDF.

## Bảo mật và vận hành

- Escape toàn bộ dữ liệu động trước khi đưa vào HTML.
- Tắt JavaScript khi Chromium dựng PDF và không tải tài nguyên mạng ngoài.
- Luôn đóng browser trong `finally`.
- Route chạy Node.js với thời lượng tối đa 60 giây; các API khác giữ giới hạn hiện tại.
- Log chỉ chứa bước lỗi, report ID/code và user ID; không ghi thông tin bệnh nhân hoặc nội dung báo cáo.

## Kiểm thử

- Template: tiếng Việt đúng, dữ liệu được escape, chế độ PDF không có script/nút thao tác.
- PDF service: đúng A4, trả buffer và đóng browser ở cả nhánh thành công/lỗi.
- Email: recipient cố định, attachment đúng tên/MIME và client không thể đổi địa chỉ nhận.
- Route: kiểm tra các nhánh xác thực, phân quyền, lỗi PDF, lỗi SMTP và gửi lại.
- UI: xác nhận, loading, chống double-click, thành công, thất bại và thử lại.
- Render các fixture PDF tối thiểu, đầy đủ và nội dung dài sang PNG để kiểm tra không cắt/chồng chữ hoặc lỗi font.

## Tiêu chí hoàn thành

- Gmail đích nhận được email tóm tắt và file PDF mở được.
- PDF có cùng nội dung/bố cục với mẫu in hiện tại.
- User không thể gửi báo cáo của đơn vị khác hoặc thay đổi recipient.
- Không phát sinh migration hay dữ liệu tạm tồn tại lâu dài.
- Test, TypeScript và production build đạt.
