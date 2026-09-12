# Thiết kế duyệt đồng thời nhiều báo cáo ADR

## Bối cảnh

Trang `/reports` hiện cho phép admin duyệt từng báo cáo qua `PUT /api/reports/[id]/approve`. Danh sách được phân trang theo đơn vị và hiển thị dưới ba biến thể: bảng theo đơn vị trên desktop, thẻ trên desktop và thẻ trên mobile. Việc phải xác nhận từng báo cáo làm chậm quá trình xử lý khi có nhiều báo cáo chờ duyệt.

Tính năng mới cho phép admin chọn thủ công nhiều báo cáo đang hiển thị trên trang hiện tại và duyệt chúng bằng một thao tác. Bản đầu chỉ hỗ trợ duyệt; không bổ sung thao tác từ chối hoặc chuyển về chưa duyệt hàng loạt.

## Mục tiêu

- Giảm số thao tác cần thiết khi admin duyệt nhiều báo cáo.
- Chỉ cho phép chọn báo cáo có trạng thái `pending` để không ghi đè quyết định đã có.
- Hỗ trợ nhất quán trên bảng desktop, thẻ desktop và thẻ mobile.
- Chịu được trường hợp dữ liệu trên màn hình đã cũ do báo cáo được xử lý ở tab, thiết bị hoặc phiên admin khác.
- Giữ nguyên luồng duyệt từng báo cáo và không thay đổi schema hiện tại.

## Ngoài phạm vi

- Chọn toàn bộ kết quả tìm kiếm hoặc bộ lọc qua nhiều trang.
- Từ chối hoặc chuyển về chưa duyệt hàng loạt.
- Ghi chú duyệt hàng loạt.
- Lịch sử duyệt riêng, thông báo email hoặc workflow duyệt nhiều cấp.
- Thay đổi cách phân trang danh sách báo cáo.

## Quyết định kỹ thuật

Sử dụng endpoint bulk riêng `PUT /api/reports/bulk-approve`. Frontend gửi một request chứa các ID được chọn; server xác thực admin và thực hiện một câu lệnh cập nhật Supabase có điều kiện `approval_status = 'pending'`.

Phương án này được chọn thay cho việc gọi endpoint duyệt đơn nhiều lần vì giảm số request, tổng hợp kết quả chính xác hơn và tránh trạng thái khó hiểu khi một chuỗi request bị lỗi giữa chừng. PostgreSQL RPC chưa cần thiết vì bản đầu không có workflow nhiều cấp hoặc yêu cầu audit mới.

## Kiến trúc thành phần

### `ReportList`

`ReportList` là nguồn dữ liệu duy nhất cho lựa chọn hàng loạt:

- Giữ `selectedReportIds` dưới dạng `Set<string>`.
- Chỉ thêm ID của report có `approval_status === 'pending'`.
- Cung cấp trạng thái và callback chọn/bỏ chọn cho `ReportTable` và `ReportCard`.
- Hiển thị thanh thao tác hàng loạt và hộp xác nhận.
- Gọi bulk API, diễn giải kết quả, làm mới trang hiện tại và quản lý trạng thái đang xử lý.
- Xóa lựa chọn khi admin tìm kiếm, đổi bộ lọc, chuyển trang hoặc danh sách được tải lại thành công.

Việc đặt trạng thái ở `ReportList` bảo đảm lựa chọn không bị chia cắt giữa các biến thể hiển thị.

### `ReportTable`

- Thêm cột checkbox chỉ dành cho admin.
- Checkbox từng dòng chỉ khả dụng với report `pending`.
- Checkbox ở header chọn hoặc bỏ chọn toàn bộ report `pending` trên trang hiện tại, trong giới hạn tối đa 100 report mỗi lần.
- Trạng thái chọn tất cả hỗ trợ ba trạng thái: chưa chọn, chọn một phần và chọn hết phạm vi cho phép. Nếu trang có hơn 100 report `pending`, trạng thái được coi là chọn hết khi đã chọn đủ 100 report đầu tiên theo thứ tự dữ liệu hiện tại.
- Việc một nhóm đơn vị đang thu gọn không thay đổi phạm vi chọn; checkbox cấp trang dựa trên dữ liệu đã tải, không chỉ các dòng đang mở.
- Các nút duyệt từng report hiện tại tiếp tục hoạt động.

### `ReportCard`

- Hiển thị checkbox cho admin ở phần đầu thẻ nếu report đang `pending`.
- Nhận trạng thái chọn và callback từ `ReportList` để dùng chung cho chế độ thẻ desktop và mobile.
- Các hành động hiện tại trên thẻ không thay đổi.

### Thanh thao tác và hộp xác nhận

Khi có ít nhất một report được chọn, thanh thao tác hiển thị:

- Số lượng đã chọn.
- Nút **Bỏ chọn tất cả**.
- Nút chính **Duyệt X báo cáo**.

Trên mobile, thanh thao tác bám phía dưới màn hình nhưng không che nội dung cuối danh sách. Trên desktop, thanh nằm phía trên nội dung báo cáo.

Khi admin bấm duyệt, hệ thống dùng dialog của ứng dụng thay cho `window.confirm`. Dialog hiển thị tổng số báo cáo, tối đa 10 mã báo cáo đầu tiên, số lượng còn lại nếu có, và lưu ý rằng các report không còn ở trạng thái `Chưa duyệt` sẽ bị bỏ qua. Admin có thể hủy hoặc xác nhận.

Trong lúc request đang chạy, checkbox, nút chọn tất cả, nút bỏ chọn và nút duyệt đều bị khóa. Nhãn nút đổi thành **Đang duyệt…** để ngăn gửi lặp.

## Hợp đồng API

### Request

`PUT /api/reports/bulk-approve`

```json
{
  "report_ids": ["uuid-1", "uuid-2"]
}
```

Quy tắc đầu vào:

- `report_ids` phải là một mảng không rỗng.
- Mỗi phần tử phải là chuỗi UUID hợp lệ.
- Server loại ID trùng trước khi xử lý.
- Tối đa 100 ID duy nhất trong một request.

### Xác thực và phân quyền

Endpoint gọi `getServerSession(authOptions)` trước khi tạo hoặc sử dụng client có service role:

- Không có session: HTTP 401.
- Có session nhưng role không phải `admin`: HTTP 403.
- Service role key chỉ được sử dụng phía server và không xuất hiện trong response hoặc log.

### Cập nhật dữ liệu

Server dùng một câu lệnh cập nhật `adr_reports` với cả hai điều kiện:

- `id` nằm trong danh sách ID duy nhất đã gửi.
- `approval_status = 'pending'` tại thời điểm câu lệnh thực thi.

Các trường được ghi cho mọi report phù hợp:

- `approval_status = 'approved'`.
- `approved_by = session.user.id`.
- `approved_at` dùng cùng một timestamp cho toàn bộ batch.
- `updated_at` dùng cùng timestamp với `approved_at`.
- `approval_note = null`, nhất quán với thao tác duyệt từ danh sách hiện tại.

Điều kiện trạng thái nằm ngay trong câu lệnh cập nhật, vì vậy report được xử lý ở nơi khác sau khi trang được tải sẽ không bị ghi đè.

### Response thành công

API trả HTTP 200 cho cả thành công toàn bộ và thành công một phần:

```json
{
  "requested_count": 3,
  "approved_count": 2,
  "skipped_count": 1,
  "approved_ids": ["uuid-1", "uuid-2"],
  "skipped_ids": ["uuid-3"]
}
```

`requested_count` là số ID duy nhất hợp lệ sau khi loại trùng. `skipped_ids` gồm các ID không được cập nhật vì không tồn tại hoặc không còn `pending`. Response không chứa tên bệnh nhân hay dữ liệu lâm sàng.

### Response lỗi

- HTTP 400: body sai cấu trúc, UUID không hợp lệ, mảng rỗng hoặc vượt giới hạn 100 ID duy nhất.
- HTTP 401: chưa đăng nhập.
- HTTP 403: không phải admin.
- HTTP 500: lỗi truy vấn hoặc cập nhật database.

Nếu câu lệnh cập nhật database lỗi, không report nào trong câu lệnh được cập nhật. API trả thông báo lỗi chung cho client và ghi chi tiết kỹ thuật ở log server mà không log dữ liệu bệnh nhân.

## Luồng dữ liệu

1. Admin chọn từng report `pending` hoặc dùng checkbox chọn tất cả report `pending` trên trang hiện tại.
2. `ReportList` cập nhật `selectedReportIds` và hiển thị thanh thao tác.
3. Admin mở dialog, kiểm tra số lượng/mã báo cáo rồi xác nhận.
4. Frontend gửi một request tới bulk endpoint và khóa các điều khiển liên quan.
5. Server xác thực admin, chuẩn hóa ID và thực hiện cập nhật có điều kiện.
6. Server so sánh ID yêu cầu với các dòng được trả về từ câu lệnh cập nhật để tạo `approved_ids` và `skipped_ids`.
7. Nếu API trả HTTP 200, frontend thông báo kết quả, xóa lựa chọn rồi tải lại trang hiện tại. Nếu API trả lỗi, frontend không tải lại danh sách.
8. Nếu API lỗi, frontend giữ lựa chọn để admin có thể thử lại.

## Phản hồi giao diện

- Thành công toàn bộ: **Đã duyệt X báo cáo**.
- Thành công một phần: **Đã duyệt X/Y báo cáo; bỏ qua Z báo cáo do trạng thái đã thay đổi hoặc không còn tồn tại**.
- Không cập nhật được report nào nhưng request hợp lệ: **Không có báo cáo nào được duyệt; danh sách có thể đã thay đổi**. Frontend vẫn tải lại dữ liệu.
- Lỗi request hoặc server: hiển thị thông báo lỗi, đóng trạng thái loading và giữ nguyên lựa chọn.

Sau response HTTP 200, frontend chỉ xóa lựa chọn sau khi bắt đầu làm mới dữ liệu. Nếu việc tải lại thất bại, thông báo thêm lỗi tải danh sách; trạng thái duyệt trên server vẫn được xem là thành công và không tự gửi lại request bulk.

## Giới hạn lựa chọn

Frontend không cho chọn quá 100 report. Khi đã chọn đủ giới hạn, các checkbox `pending` chưa chọn còn lại bị khóa và giao diện hiển thị **Chỉ có thể duyệt tối đa 100 báo cáo mỗi lần**. Checkbox chọn tất cả chọn tối đa 100 report theo thứ tự đang có trong dữ liệu trang.

## Khả năng truy cập và responsive

- Mỗi checkbox có nhãn truy cập chứa mã báo cáo.
- Checkbox header có nhãn mô tả rõ phạm vi là trang hiện tại.
- Dialog giữ focus, hỗ trợ đóng bằng Escape và trả focus về nút đã mở dialog.
- Thanh mobile có khoảng đệm an toàn phía dưới; danh sách có padding tương ứng để không bị che.
- Trạng thái chọn, khóa và loading không chỉ biểu đạt bằng màu sắc.

## Kiểm thử

### API

- Trả 401 khi không có session.
- Trả 403 khi user không phải admin.
- Trả 400 với body không phải object, `report_ids` không phải mảng, mảng rỗng, UUID sai hoặc quá 100 ID duy nhất.
- Loại ID trùng và báo đúng `requested_count`.
- Duyệt toàn bộ khi tất cả report đều `pending`.
- Chỉ duyệt phần còn `pending` khi danh sách gồm nhiều trạng thái.
- Bỏ qua ID không tồn tại mà không làm hỏng các ID hợp lệ.
- Ghi cùng `approved_by`, `approved_at`, `updated_at` và đặt `approval_note = null`.
- Không cập nhật dòng nào và trả 500 khi database update lỗi.

### Logic lựa chọn

- User thường không thấy hoặc không sử dụng được điều khiển chọn hàng loạt.
- Admin chỉ chọn được report `pending`.
- Chọn tất cả chỉ chọn report `pending` trên trang hiện tại và không vượt 100.
- Checkbox header thể hiện đúng trạng thái chưa chọn, chọn một phần và chọn hết phạm vi cho phép, kể cả khi trang có hơn 100 report `pending`.
- Tìm kiếm, đổi bộ lọc, chuyển trang và tải lại thành công đều xóa lựa chọn.
- Lỗi bulk giữ nguyên lựa chọn và không tự tải lại; tải lại thất bại sau bulk thành công không gửi lại thao tác duyệt.

### Giao diện

- Thanh bulk chỉ xuất hiện khi có lựa chọn và hiển thị đúng số lượng.
- Dialog hiển thị đúng mã, số lượng và phần mã bị rút gọn.
- Không thể gửi hai request khi đang duyệt.
- Thông báo đúng cho thành công toàn bộ, thành công một phần, không cập nhật được dòng nào và lỗi toàn bộ.
- Bảng desktop, thẻ desktop và thẻ mobile dùng cùng trạng thái lựa chọn.

### Hồi quy

- Duyệt từng report tiếp tục hoạt động.
- Từ chối từng report tiếp tục hoạt động.
- Xem, sửa, in và xóa report không bị ảnh hưởng.
- Tìm kiếm, lọc, phân trang và thu gọn/mở rộng nhóm đơn vị hoạt động như trước.

## Tiêu chí nghiệm thu

- Admin có thể chọn thủ công nhiều report `Chưa duyệt` trên trang hiện tại ở mọi chế độ hiển thị.
- Một lần xác nhận tạo đúng một request HTTP từ client.
- Report đã được xử lý ở nơi khác không bị ghi đè và được tính vào số bỏ qua.
- Kết quả trên giao diện phản ánh đúng số report đã duyệt và bỏ qua.
- User không phải admin không nhìn thấy điều khiển bulk và không thể gọi endpoint thành công.
- Không cần migration database và không làm thay đổi hành vi của endpoint duyệt đơn.
