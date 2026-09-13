# Thiết kế báo cáo hợp lệ ngay khi nộp

## Mục tiêu

Đơn giản hóa quy trình báo cáo ADR: người dùng chỉ cần hoàn tất và nộp báo cáo. Báo cáo được công nhận là hợp lệ ngay lập tức, không cần admin duyệt. Toàn bộ báo cáo đã tồn tại, gồm báo cáo `pending`, `rejected` hoặc chưa có trạng thái, cũng được chuyển thành hợp lệ.

Thiết kế này chỉ áp dụng cho việc duyệt báo cáo ADR. Quy trình duyệt từng đề nghị cập nhật thẻ dị ứng là nghiệp vụ riêng và tiếp tục hoạt động như hiện tại.

## Phương án được chọn

Giữ các cột duyệt hiện có trong database để đảm bảo tương thích với dữ liệu, mã triển khai cũ và các tích hợp có thể đang đọc chúng. Hệ thống không còn sử dụng các cột này như một bước kiểm soát nghiệp vụ:

- Mọi báo cáo cũ được chuẩn hóa về `approval_status = 'approved'`.
- Mặc định database của `approval_status` được đổi thành `approved`.
- Các API tạo báo cáo vẫn ghi rõ `approval_status = 'approved'` để hành vi không phụ thuộc riêng vào mặc định database.
- `approved_by`, `approved_at` và `approval_note` được giữ lại cho mục đích tương thích. Migration không gán giả một admin cho dữ liệu được chuẩn hóa và xóa ghi chú từ chối không còn hiệu lực.

## Luồng dữ liệu

### Báo cáo mới

1. Người dùng đăng nhập hoặc người dùng biểu mẫu công khai gửi báo cáo.
2. Server thực hiện các kiểm tra dữ liệu hiện có.
3. Báo cáo được tạo với `approval_status = 'approved'`.
4. Thuốc nghi ngờ và thuốc dùng đồng thời được lưu theo luồng hiện tại.
5. Hệ thống trả kết quả nộp thành công và báo cáo có thể được sử dụng ngay trong danh sách, dashboard và luồng cấp thẻ dị ứng.

Không có bước chuyển tiếp qua `pending`, không có thông báo yêu cầu admin phê duyệt và không có thao tác từ chối báo cáo.

### Báo cáo hiện có

Một migration có thể chạy lặp lại an toàn sẽ:

- Cập nhật mọi bản ghi có `approval_status` khác `approved` hoặc là `NULL` thành `approved`.
- Đặt `approved_by = NULL` vì đây là chuyển đổi chính sách, không phải hành động phê duyệt của một cá nhân.
- Đặt `approved_at` theo thời điểm migration để ghi nhận thời điểm chính sách mới có hiệu lực.
- Đặt `approval_note = NULL` để ghi chú từ chối cũ không còn mâu thuẫn với trạng thái hợp lệ.
- Đổi giá trị mặc định của cột `approval_status` thành `approved` và giữ ràng buộc trạng thái hiện tại để tương thích.

## Thay đổi thành phần

### API và nghiệp vụ server

- API tạo báo cáo có đăng nhập và API công khai cùng ghi trạng thái `approved`.
- Xóa endpoint duyệt một báo cáo và endpoint duyệt hàng loạt khỏi ứng dụng.
- Xóa module tiện ích và kiểm thử chỉ phục vụ duyệt hàng loạt.
- Không cho phép client thay đổi trạng thái duyệt qua API cập nhật báo cáo.
- Các API đọc không lọc hoặc chặn báo cáo dựa trên trạng thái duyệt.

### Danh sách và chi tiết báo cáo

- Xóa nhãn “Chưa duyệt”, “Đã duyệt”, “Từ chối”.
- Xóa checkbox chọn báo cáo chờ duyệt, thanh thao tác duyệt hàng loạt và hộp xác nhận liên quan.
- Xóa nút duyệt/từ chối ở bảng, thẻ báo cáo và trang chi tiết.
- Giữ nguyên quyền xem, sửa, in, gửi email và xóa hiện tại; thay đổi này không mở rộng các quyền đó.

### Dashboard

- Xóa bộ lọc trạng thái duyệt.
- Thay KPI “Chưa duyệt” bằng một chỉ số hữu ích không phụ thuộc quy trình duyệt: “Thiếu thông tin”, đếm báo cáo có ít nhất một mục A–F chưa hoàn thiện.
- Giữ “Hàng chờ xử lý” nhưng đổi nội dung thành danh sách cần bổ sung thông tin. Trạng thái duyệt không còn là lý do hoặc tiêu chí ưu tiên.
- Xóa cột và huy hiệu duyệt khỏi bảng chi tiết và dòng thời gian báo cáo.
- API dashboard không còn nhận hoặc áp dụng bộ lọc `approvalStatus`; tham số cũ nếu được gửi lên sẽ bị bỏ qua để các liên kết cũ không gây lỗi.

### Cấp thẻ dị ứng

- Danh sách báo cáo đủ điều kiện cấp thẻ không phụ thuộc `approval_status`.
- Nếu API hiện chỉ trả trạng thái để hiển thị, trường này được loại khỏi response và type liên quan.
- Quy trình duyệt đề nghị cập nhật nội dung thẻ dị ứng không thay đổi.

### Kiểu dữ liệu và tài liệu

- Loại bỏ trường duyệt khỏi kiểu dữ liệu nghiệp vụ `ADRReport` và các view-model đang sử dụng trực tiếp trong giao diện.
- Giữ các trường trong kiểu database sinh từ Supabase vì cột vẫn tồn tại.
- Đánh dấu tài liệu hướng dẫn duyệt báo cáo cũ là không còn áp dụng hoặc thay bằng ghi chú về quy trình nộp trực tiếp, tránh hướng dẫn sai cho admin.

## Xử lý lỗi và khả năng tương thích

- Nếu migration chưa được áp dụng, API tạo báo cáo vẫn ghi `approved`, nên báo cáo mới không bị đưa vào trạng thái chờ duyệt.
- Migration dùng câu lệnh cập nhật theo điều kiện và có thể chạy lại mà không làm thay đổi các báo cáo đã chuẩn hóa.
- Việc giữ cột database giúp các bản ứng dụng cũ vẫn đọc được dữ liệu; tất cả bản ghi sẽ chỉ thấy trạng thái `approved` sau migration.
- Endpoint duyệt cũ bị xóa nên client cũ gọi vào sẽ nhận `404`, thể hiện rõ thao tác không còn được hỗ trợ.

## Kiểm thử và xác minh

- Kiểm thử API tạo báo cáo có đăng nhập: bản ghi mới có trạng thái `approved`.
- Kiểm thử API tạo báo cáo công khai: bản ghi mới có trạng thái `approved` và phản hồi thành công không nói “chờ duyệt”.
- Kiểm tra migration trên tập dữ liệu gồm `pending`, `rejected`, `approved` và `NULL`: tất cả chuyển thành `approved`, không có `approved_by` giả và ghi chú cũ được xóa.
- Kiểm thử dashboard: không còn bộ lọc/KPI duyệt; chỉ số thiếu thông tin và hàng chờ bổ sung được tính từ độ hoàn thiện A–F.
- Kiểm thử giao diện danh sách và chi tiết: không còn thao tác hoặc trạng thái duyệt ở cả tài khoản admin và tài khoản thường.
- Kiểm thử hồi quy luồng cấp thẻ dị ứng: mọi báo cáo đáp ứng dữ liệu chuyên môn đều có thể được chọn, bất kể trạng thái duyệt cũ.
- Chạy kiểm tra type, lint, unit test và build của dự án.

## Tiêu chí hoàn thành

- Người dùng nộp báo cáo một lần và báo cáo dùng được ngay.
- Không còn nơi nào trong giao diện yêu cầu admin duyệt hoặc từ chối báo cáo ADR.
- Không còn API ứng dụng cho phép thay đổi trạng thái duyệt báo cáo.
- Tất cả báo cáo cũ được công nhận hợp lệ sau migration.
- Dashboard không hiển thị hoặc ưu tiên theo trạng thái duyệt.
- Quy trình duyệt đề nghị cập nhật thẻ dị ứng vẫn hoạt động như trước.
