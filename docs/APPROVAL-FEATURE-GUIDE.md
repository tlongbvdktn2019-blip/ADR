# Quy trình báo cáo ADR hiện hành

> Tài liệu duyệt báo cáo trước đây không còn áp dụng từ ngày 13/09/2026.

Báo cáo ADR được công nhận là hợp lệ ngay sau khi người dùng nộp thành công. Admin không cần và không thể duyệt hoặc từ chối báo cáo.

- Báo cáo mới được lưu với trạng thái tương thích nội bộ `approved`.
- Báo cáo cũ được chuẩn hóa thành hợp lệ bằng migration `20260913020000_make_all_reports_valid.sql`.
- Giao diện và API không còn cung cấp thao tác duyệt báo cáo.
- Quy trình duyệt đề nghị cập nhật thẻ dị ứng là nghiệp vụ riêng và không bị thay đổi.

Xem thiết kế tại [Thiết kế báo cáo hợp lệ ngay khi nộp](./superpowers/specs/2026-09-13-auto-valid-report-submission-design.md).
