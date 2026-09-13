# Phân quyền báo cáo theo đơn vị

Ngày: 2026-09-13

## Mục tiêu

Giới hạn dữ liệu trong module `reports` theo đơn vị của người dùng. Tài khoản `admin` được xem và quản lý báo cáo của tất cả đơn vị. Tài khoản `user` chỉ được xem và thao tác với báo cáo có `organization_id` trùng với `organization_id` hiện tại của tài khoản.

## Phạm vi

Thay đổi áp dụng cho các luồng có thể đọc hoặc thao tác dữ liệu báo cáo:

- Danh sách và tìm kiếm báo cáo.
- Xem chi tiết báo cáo bằng trang hoặc API.
- Chỉnh sửa báo cáo.
- In báo cáo.
- Gửi email báo cáo.

Quyền xóa vẫn chỉ dành cho `admin`. Dashboard và các module ngoài `reports` không thuộc phạm vi thay đổi này.

## Nguồn xác định quyền

Mỗi request đã xác thực sẽ dùng `session.user.id` để đọc lại bản ghi `users` bằng Supabase service-role. Quyết định phân quyền dựa trên `users.role` và `users.organization_id` trong cơ sở dữ liệu, không dựa vào organization do client gửi lên hoặc giá trị organization lưu lâu trong JWT.

Quy tắc truy cập:

- Nếu người dùng không tồn tại: từ chối truy cập.
- Nếu `role = admin`: được truy cập mọi báo cáo.
- Nếu `role = user` và có `organization_id`: chỉ được truy cập báo cáo cùng `organization_id`.
- Nếu `role = user` nhưng không có `organization_id`: không được truy cập báo cáo nào.

Tên `organization` tiếp tục dùng để hiển thị. `organization_id` là khóa chuẩn dùng cho phân quyền, tránh sai lệch do khác cách viết tên đơn vị.

## Kiến trúc

Tạo một helper phía server chịu trách nhiệm đọc ngữ cảnh truy cập báo cáo và kiểm tra một báo cáo có thuộc phạm vi của người dùng hay không. Các route và server component trong module báo cáo dùng chung helper này để tránh lặp lại hoặc bỏ sót quy tắc.

Helper chỉ có hai trách nhiệm:

1. Nạp ngữ cảnh `{ role, organizationId }` từ bảng `users` theo user ID.
2. Cho biết admin có quyền toàn cục hay trả về `organization_id` bắt buộc đối với user thường.

## Luồng dữ liệu

### Danh sách báo cáo

API `GET /api/reports` xác thực người dùng, nạp ngữ cảnh quyền, rồi thêm điều kiện `organization_id` vào truy vấn Supabase trước các bước tìm kiếm, lọc mức độ, nhóm đơn vị và phân trang. Vì vậy tổng số báo cáo, số đơn vị và kết quả tìm kiếm đều chỉ phản ánh dữ liệu người dùng được phép xem.

Admin không nhận điều kiện đơn vị và giữ nguyên khả năng xem tất cả.

### Chi tiết và trang báo cáo

API `GET /api/reports/[id]` và server component `/reports/[id]` thêm điều kiện đơn vị vào chính truy vấn lấy báo cáo. Báo cáo không tồn tại và báo cáo ngoài đơn vị đều trả cùng kết quả `404`, không làm lộ sự tồn tại của dữ liệu đơn vị khác.

Metadata của trang dùng cùng truy vấn đã giới hạn quyền nên không làm lộ mã báo cáo hoặc tên bệnh nhân qua tiêu đề HTML.

### Chỉnh sửa

`PUT /api/reports/[id]` kiểm tra phạm vi đơn vị trước khi xử lý nội dung. Điều kiện `organization_id` cũng được giữ trong thao tác cập nhật chính để giảm rủi ro kiểm tra rồi dữ liệu thay đổi giữa hai bước.

User thường không thể thay đổi `organization` hoặc `organization_id` của báo cáo. Các trường này tiếp tục được giữ nguyên khi cập nhật. Admin giữ hành vi cập nhật hiện tại; thay đổi đơn vị báo cáo không được bổ sung trong phạm vi này.

### In và gửi email

Các endpoint in và gửi email áp dụng cùng kiểm tra `organization_id`. User chỉ có thể in hoặc gửi email báo cáo thuộc đơn vị của mình. Admin có thể thao tác với mọi báo cáo.

Endpoint kiểm tra khả năng gửi email dùng cùng quy tắc đơn vị. Nếu báo cáo ngoài phạm vi, endpoint trả `404` thay vì trả thông tin cấu hình hoặc mã báo cáo.

### Xóa

`DELETE /api/reports/[id]` tiếp tục chỉ cho phép admin. Vì user thường luôn bị từ chối trước khi truy cập dữ liệu, không cần bổ sung quyền xóa theo đơn vị.

## Xử lý lỗi

- Chưa đăng nhập: `401`.
- Không tìm thấy tài khoản hiện hành: `404` hoặc lỗi từ chối tương đương của route hiện tại.
- User chưa được gán đơn vị: danh sách rỗng; các truy cập theo ID trả `404`.
- Báo cáo không tồn tại hoặc khác đơn vị: `404`.
- Lỗi truy vấn database: `500` và ghi log phía server, không trả chi tiết nhạy cảm cho client.

## Kiểm thử

Bổ sung test cho helper và các nhánh phân quyền chính:

- Admin có thể truy cập báo cáo của mọi đơn vị.
- User có thể truy cập báo cáo trùng `organization_id`.
- User không thể truy cập báo cáo khác `organization_id` dù biết ID trực tiếp.
- User chưa có `organization_id` không thể truy cập báo cáo.
- Lọc danh sách được áp dụng trước tìm kiếm, nhóm và phân trang.
- Chi tiết, chỉnh sửa, in và gửi email không trả dữ liệu của đơn vị khác.
- Hành vi tạo báo cáo hiện tại vẫn gắn đơn vị từ tài khoản phía server.

Chạy kiểm tra TypeScript, lint và bộ test hiện có sau khi triển khai.

## Tiêu chí hoàn thành

- Không có endpoint hoặc server component thuộc module `reports` cho phép user đọc hay thao tác báo cáo khác đơn vị.
- Client không thể vượt quyền bằng cách sửa query string, request body hoặc URL ID.
- Admin vẫn xem và quản lý được toàn bộ báo cáo.
- Kết quả danh sách và phân trang của user chỉ tính dữ liệu thuộc đơn vị đó.
- Các test và kiểm tra tĩnh liên quan đều đạt.
