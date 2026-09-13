# Thiết kế hoàn thiện module Quản lý và Cấp thẻ dị ứng

## Mục tiêu

Tại `/allergy-cards/new`, người dùng tìm và chọn bệnh nhân từ các báo cáo ADR chưa được cấp thẻ của đơn vị mình. Hệ thống tự lấy dữ liệu báo cáo, khóa các trường đã có và chỉ yêu cầu bổ sung phần còn thiếu. Người dùng cùng đơn vị dùng chung quyền quản lý; admin có phạm vi toàn hệ thống.

Mỗi báo cáo chỉ có một thẻ. Thẻ là bản chụp báo cáo tại thời điểm cấp, không tự thay đổi khi báo cáo nguồn được sửa. Khi cần cấp lại, người dùng cùng đơn vị xóa thẻ bằng xác nhận mã thẻ và lý do; audit snapshot vẫn được giữ.

## Dữ liệu và phân quyền

- Thêm `organization_id` liên kết `departments` cho user, báo cáo và thẻ. Tên đơn vị vẫn được giữ làm nhãn hiển thị, nhưng phân quyền chỉ dùng ID.
- Backfill các biến thể tên đã biết; admin Sở Y tế có thể không gắn đơn vị, còn user thường và báo cáo phải ánh xạ được.
- `allergy_cards.report_id` là duy nhất; bổ sung `source_report_updated_at`, `public_token` và nguồn bác sĩ.
- Mỗi dị ứng lưu nguồn `report`, `manual_missing` hoặc `public_update` cùng ID nguồn và tên chuẩn hóa.
- Audit log độc lập lưu tạo, sửa, xóa, xoay QR và duyệt cập nhật. Xóa thẻ không xóa audit.
- Đề nghị bổ sung công khai gồm submission và các item có trạng thái duyệt riêng.
- Các thao tác cấp, xóa và duyệt chạy qua PostgreSQL RPC nguyên tử, chỉ backend service-role được gọi.

## Luồng cấp thẻ

Trang cấp thẻ là một trang mở dần: tìm bệnh nhân, xem dữ liệu nguồn, bổ sung trường thiếu, xem trước và xác nhận. Kết quả tìm kiếm luôn giới hạn theo đơn vị và loại báo cáo đã có thẻ. Mỗi lựa chọn hiển thị tên, mã/ngày báo cáo, thuốc nghi ngờ, trạng thái duyệt và đơn vị để phân biệt người trùng tên.

Quy tắc ánh xạ:

- Họ tên, giới tính, tuổi tại thời điểm ADR và đơn vị lấy từ báo cáo.
- Tất cả thuốc nghi ngờ trở thành các dòng dị ứng.
- Quan hệ nhân quả `certain` thành `confirmed`; các giá trị khác thành `suspected`.
- `death` và `life_threatening` thành `life_threatening`; `hospitalization`, `permanent_disability` và `birth_defect` thành `severe`; `not_serious` không tự gán mức nhẹ/vừa.
- Mô tả ADR dùng làm biểu hiện lâm sàng.
- Chỉ lấy người báo cáo làm bác sĩ xác nhận khi nghề nghiệp là `Bác sĩ`; trường hợp khác bắt buộc nhập bác sĩ.
- Báo cáo không có thuốc hoặc có tên thuốc trống phải được bổ sung dị nguyên trước khi cấp.

Client chỉ gửi `report_id`, `report_updated_at` và phần bổ sung. Server đọc lại báo cáo, từ chối ghi đè trường đã có, kiểm tra phiên bản nguồn và tạo thẻ trong một giao dịch. Ngày cấp lấy theo ngày server tại `Asia/Ho_Chi_Minh`; hạn dùng là tùy chọn nhưng không được trước ngày cấp. Google Drive không còn thuộc luồng QR.

## Quản lý, QR và bổ sung

- Dashboard thẻ có KPI tổng, hiệu lực, sắp hết hạn, hết hạn và đề nghị chờ duyệt; hỗ trợ tìm bệnh nhân, mã thẻ, mã báo cáo hoặc dị nguyên.
- Dữ liệu nguồn chỉ đọc. Chỉ thông tin card-specific được sửa. Báo cáo nguồn thay đổi sẽ tạo cảnh báo để xóa và cấp lại khi cần.
- QR chứa URL HTTPS với token ngẫu nhiên và quét được bằng mọi ứng dụng QR. Nút chia sẻ dùng URL public, không dùng URL nội bộ.
- Trang public chỉ hiện dữ liệu cấp cứu: bệnh nhân, dị ứng, đơn vị/bác sĩ liên hệ, ngày cấp và hạn thẻ; không trả CCCD, ghi chú nội bộ, audit hoặc thông tin tài khoản.
- Người có QR có thể gửi đề nghị bổ sung không cần tài khoản. Submission bắt buộc CAPTCHA, giới hạn tần suất và chỉ mục đã duyệt mới cập nhật thẻ.
- Người dùng cùng đơn vị duyệt từng mục, có thể gộp dị nguyên trùng hoặc từ chối kèm lý do. Đề nghị mới tạo thông báo trong ứng dụng cho đơn vị cấp thẻ.

## Bảo mật và vận hành

- API nội bộ luôn đọc role và `organization_id` từ database; không tin dữ liệu quyền của client.
- Xóa vĩnh viễn yêu cầu mã thẻ và lý do; audit được ghi trước khi cascade.
- Token QR không dùng ID thẻ, có thể xoay vòng và không tiết lộ sự tồn tại của token cũ.
- Public response dùng `noindex`, `no-store` và `Referrer-Policy: no-referrer`; template in escape mọi dữ liệu động.
- Public submission dùng Cloudflare Turnstile với xác minh server-side và fail-closed khi thiếu cấu hình. Giới hạn mặc định là 5 submission/thẻ/IP/giờ và 20/IP/ngày, chỉ lưu HMAC hash của IP.
- Feature flag `ALLERGY_PUBLIC_UPDATES_ENABLED` cho phép tắt ghi public mà vẫn giữ khả năng xem QR.

## Nghiệm thu

- Unit test ánh xạ báo cáo, trường thiếu, trạng thái hiệu lực, chuẩn hóa dị nguyên, redaction public và phạm vi đơn vị.
- API test user/admin, truy cập chéo đơn vị, nguồn thay đổi, cấp trùng đồng thời, rollback và xóa–cấp lại.
- E2E cho báo cáo không thuốc, tên thuốc trống, nhiều thuốc, người báo cáo không phải bác sĩ, QR không đăng nhập, submission → duyệt từng mục và xoay token.
- Kiểm tra template Phụ lục VII, XSS, QR trên bản in, responsive, keyboard và trạng thái loading/empty/error.
- Chạy Vitest, TypeScript, lint và production build trước khi bàn giao.

## Mặc định đã chốt

- Mọi báo cáo chưa cấp đều đủ điều kiện, không phụ thuộc trạng thái duyệt.
- Mỗi báo cáo có tối đa một thẻ tại một thời điểm; xóa thẻ cho phép cấp lại.
- Không có hạn dùng mặc định.
- Không tự đồng bộ báo cáo sau khi cấp.
- Mọi user cùng đơn vị được quản lý và xóa thẻ của đơn vị.
- Ai có QR cũng xem và gửi đề nghị bổ sung được; đề nghị luôn phải duyệt từng mục.
