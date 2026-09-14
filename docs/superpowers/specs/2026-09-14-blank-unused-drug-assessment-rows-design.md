# Để trống đánh giá phản ứng ở các dòng thuốc không sử dụng

Ngày: 2026-09-14

## Mục tiêu

Trong mẫu in báo cáo ADR, phần câu 14 và 15 vẫn có đủ bốn dòng `i–iv`. Chỉ các dòng tương ứng với thuốc nghi ngờ thực tế mới hiển thị lựa chọn đã lưu; dòng không có thuốc phải để trống toàn bộ checkbox.

## Thiết kế

- Giữ nguyên bố cục cố định bốn dòng `i–iv` của mẫu in.
- Với dòng có thuốc, đọc `reaction_improved_after_stopping` và `reaction_reoccurred_after_rechallenge` rồi đánh dấu đúng lựa chọn hiện có, bao gồm lựa chọn `Không có thông tin`.
- Với dòng không có thuốc, không gán giá trị mặc định `no_information`; tất cả lựa chọn của câu 14 và 15 đều không được đánh dấu.
- Chỉ thay đổi cách dựng HTML mẫu in. Không thay đổi dữ liệu đã lưu, giá trị mặc định của biểu mẫu nhập liệu hoặc cấu trúc cơ sở dữ liệu.

Template dùng chung cho xem trước, in trực tiếp và PDF email, nên ba đầu ra sẽ có cùng hành vi.

## Trường hợp dữ liệu

- Có thuốc và giá trị là `yes`, `no`, `not_stopped` hoặc `not_rechallenged`: đánh dấu lựa chọn tương ứng.
- Có thuốc và giá trị là `no_information`: đánh dấu `Không có thông tin`.
- Không có thuốc tại vị trí của dòng: không đánh dấu lựa chọn nào.

## Kiểm thử

- Sinh HTML cho báo cáo chỉ có một thuốc và có lựa chọn cụ thể ở câu 14–15.
- Xác nhận dòng `i` đánh dấu đúng lựa chọn của thuốc.
- Xác nhận các dòng `ii–iv` không có thuộc tính `checked`.
- Xác nhận thuốc thực sự có giá trị `no_information` vẫn đánh dấu `Không có thông tin`.
- Chạy toàn bộ kiểm thử và kiểm tra TypeScript.

## Tiêu chí hoàn thành

- Mẫu vẫn hiển thị đủ bốn dòng `i–iv`.
- Dòng có thuốc phản ánh đúng dữ liệu đã lưu.
- Dòng không có thuốc để trống toàn bộ câu 14 và 15.
- Bản xem trước, bản in và PDF email hiển thị nhất quán.
- Không phát sinh migration hoặc thay đổi dữ liệu báo cáo.
