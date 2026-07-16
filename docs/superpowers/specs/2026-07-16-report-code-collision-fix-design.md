# Thiết kế sửa lỗi trùng mã báo cáo

## Mục tiêu

Sửa lỗi `duplicate key value violates unique constraint "adr-reports-report-code-key"` cho cả luồng gửi báo cáo công khai và luồng tạo báo cáo sau khi đăng nhập.

Giải pháp phải:

- Giữ nguyên toàn bộ bảng, cột, constraint và dữ liệu hiện có.
- Không yêu cầu chạy migration Supabase.
- Giữ nguyên định dạng mã `{department_code}-{sequence}-{year}`.
- Không làm mất dữ liệu hoặc thay đổi mã của các báo cáo đã tồn tại.
- Hoạt động đúng khi nhiều yêu cầu tạo báo cáo gần như đồng thời.

## Nguyên nhân

Các API tạo mã hiện dùng số lượng báo cáo trong năm cộng một. Mã được cấp trước trên giao diện nhưng không được giữ chỗ trong cơ sở dữ liệu. Vì vậy, nhiều người có thể nhận cùng một mã.

Ngoài ra, giao diện công khai đọc `data.report.report_code`, trong khi API công khai trả mã ở `data.data.report_code`. Sau khi hiển thị toast thành công, việc truy cập sai cấu trúc phản hồi có thể phát sinh lỗi và khiến biểu mẫu chưa được chuyển trang hoặc làm mới.

## Kiến trúc đề xuất

### Bộ sinh mã dùng chung

Tạo một module phía server chịu trách nhiệm:

1. Tìm đơn vị theo tên `organization` và lấy `department.code`.
2. Đọc các mã hiện có khớp với mã đơn vị và năm hiện tại.
3. Phân tích phần số thứ tự hợp lệ.
4. Chọn số lớn nhất cộng một và tạo mã mới.

Việc dùng số lớn nhất thay cho số lượng tránh tái sử dụng mã khi một báo cáo cũ đã bị xóa.

Hai endpoint xem trước mã, công khai và có xác thực, sẽ gọi chung module này. Mã hiển thị trên biểu mẫu chỉ là mã dự kiến; mã chính thức là mã server trả về sau khi lưu thành công.

### Tạo báo cáo có xử lý va chạm

Hai API tạo báo cáo sẽ không tin cậy `report_code` do trình duyệt gửi lên. Server tự tạo mã ngay trước khi insert.

Quy trình insert:

1. Sinh mã ứng viên từ dữ liệu hiện có.
2. Insert báo cáo với mã ứng viên.
3. Nếu insert thành công, tiếp tục lưu thuốc và trả mã chính thức.
4. Nếu PostgreSQL trả lỗi `23505` cho constraint duy nhất của `report_code`, sinh mã lại và thử lại.
5. Giới hạn số lần thử để tránh vòng lặp vô hạn; nếu vẫn thất bại, trả thông báo tiếng Việt rõ ràng.
6. Các lỗi duy nhất không liên quan đến `report_code` và các lỗi cơ sở dữ liệu khác không được retry.

Constraint `UNIQUE` hiện có tiếp tục là lớp bảo vệ cuối cùng. Trong trường hợp hai yêu cầu cùng chọn một mã, một yêu cầu thành công; yêu cầu còn lại nhận `23505`, nhìn thấy mã vừa được lưu rồi chọn số tiếp theo.

## Tương thích phản hồi API

API công khai tiếp tục giữ các trường hiện có và bổ sung alias `report`:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "report_code": "DV-001-2026",
    "approval_status": "pending"
  },
  "report": {
    "id": "...",
    "report_code": "DV-001-2026",
    "approval_status": "pending"
  }
}
```

Cách này sửa được giao diện hiện tại mà không làm hỏng consumer đang dùng `data`.

Giao diện sẽ ưu tiên đọc `data.data.report_code`, sau đó fallback sang `data.report.report_code` để tương thích.

API đã đăng nhập tiếp tục trả `report` như hiện tại.

## Chống gửi lặp trên giao diện

Cả hai biểu mẫu công khai và biểu mẫu đã đăng nhập sẽ có khóa đồng bộ bằng `useRef`:

- Yêu cầu thứ hai bị bỏ qua ngay lập tức, trước khi React hoàn tất cập nhật state `loading`.
- Nút gửi vẫn bị disable và hiển thị trạng thái đang gửi.
- Khóa được mở lại nếu yêu cầu thất bại.
- Sau khi thành công, giao diện chuyển trang hoặc làm mới như hành vi hiện tại.

Đây là lớp bảo vệ trải nghiệm người dùng; tính duy nhất vẫn do server và constraint cơ sở dữ liệu bảo đảm.

## Giữ nguyên dữ liệu và xử lý lỗi phụ

- Không cập nhật các hàng trong `adr_reports`.
- Không đổi constraint `report_code`.
- Không tạo trigger, sequence, bảng hoặc cột mới.
- Không thay đổi quan hệ với `suspected_drugs` và `concurrent_drugs`.
- Luồng đã đăng nhập vẫn xóa báo cáo chính nếu lưu thuốc nghi ngờ thất bại, như hành vi hiện tại.
- Luồng công khai sẽ được đồng bộ hành vi cleanup để tránh báo cáo chính bị lưu thiếu thuốc bắt buộc.
- Lỗi gửi thông báo sau khi báo cáo đã được lưu không được biến thành lỗi tạo báo cáo. Việc gửi thông báo sẽ được bọc riêng và chỉ ghi log nếu thất bại.

## Kiểm thử

### Kiểm tra tĩnh

- Chạy TypeScript/Next.js build.
- Chạy lint nếu cấu hình hiện tại cho phép.

### Trường hợp chức năng

1. Tạo báo cáo công khai và xác nhận chỉ có một hàng mới.
2. Tạo báo cáo đã đăng nhập và xác nhận chỉ có một hàng mới.
3. Gửi hai yêu cầu gần đồng thời cho cùng đơn vị; cả hai phải thành công với hai mã khác nhau.
4. Nhấp nút gửi nhanh nhiều lần; chỉ một request được phát từ mỗi biểu mẫu.
5. Xóa một báo cáo không phải mã cuối rồi tạo mới; mã cũ không bị tái sử dụng.
6. Xác nhận mã hiển thị trong thông báo thành công là mã chính thức do server trả về.
7. Xác nhận dữ liệu và mã của các báo cáo cũ không thay đổi.

## Ngoài phạm vi

- Không thay đổi định dạng mã báo cáo.
- Không chuyển toàn bộ thao tác tạo báo cáo và thuốc thành PostgreSQL transaction/RPC.
- Không thêm idempotency key lưu trong cơ sở dữ liệu.
- Không tái cấu trúc các biểu mẫu ngoài phần gửi báo cáo và đọc phản hồi.
