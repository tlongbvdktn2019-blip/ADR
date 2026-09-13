# Thông báo ngừng quy trình duyệt báo cáo ADR

Từ ngày 13/09/2026, admin không còn phải duyệt báo cáo ADR. Mọi báo cáo hợp lệ ngay sau khi người dùng nộp thành công, bao gồm báo cáo gửi từ biểu mẫu công khai.

Các nút **Duyệt**, **Từ chối**, thao tác duyệt hàng loạt, bộ lọc và KPI trạng thái duyệt đã được loại bỏ. Báo cáo cũ ở trạng thái chờ duyệt hoặc từ chối sẽ được chuyển thành hợp lệ khi áp dụng migration `20260913020000_make_all_reports_valid.sql`.

Lưu ý: việc duyệt đề nghị cập nhật thẻ dị ứng vẫn giữ nguyên vì đây là quy trình khác.
