# Để trống mã số báo cáo do Trung tâm quốc gia quản lý

Ngày: 2026-09-14

## Mục tiêu

Trong mẫu in báo cáo ADR, chỉ ô `Mã số báo cáo của đơn vị` hiển thị mã báo cáo của hệ thống. Ô `Mã số báo cáo (do Trung tâm quốc gia quản lý)` luôn để trống để Trung tâm quốc gia hoặc Trung tâm khu vực tự điền.

## Thiết kế

- Giữ nguyên nhãn và bố cục của cả hai ô trong mẫu in.
- Tiếp tục gán `report.report_code` cho ô `Mã số báo cáo của đơn vị`.
- Gán giá trị rỗng rõ ràng (`value=""`) cho ô `Mã số báo cáo (do Trung tâm quốc gia quản lý)`.
- Chỉ sửa template dùng chung; không thay đổi dữ liệu báo cáo, quy tắc sinh mã hoặc giao diện nhập liệu.

Template này được dùng cho bản xem trước khi in, bản in trực tiếp và PDF đính kèm email, nên cả ba đầu ra sẽ có cùng hành vi.

## Kiểm thử

- Sinh HTML từ một báo cáo có `report_code` xác định.
- Xác nhận ô mã số của đơn vị chứa `report_code`.
- Xác nhận ô mã số do Trung tâm quốc gia quản lý có giá trị rỗng.
- Chạy kiểm thử liên quan và kiểm tra TypeScript để tránh ảnh hưởng ngoài ý muốn.

## Tiêu chí hoàn thành

- Mã báo cáo chỉ xuất hiện trong ô `Mã số báo cáo của đơn vị`.
- Ô `Mã số báo cáo (do Trung tâm quốc gia quản lý)` còn nguyên nhưng để trống.
- Bản xem trước, bản in và PDF gửi email có kết quả thống nhất.
- Không thay đổi mã báo cáo đã lưu trong cơ sở dữ liệu hoặc các nơi hiển thị ngoài mẫu in.
