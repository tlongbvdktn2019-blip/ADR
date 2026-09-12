# Thiết kế tính tuổi bệnh nhân tại thời điểm xảy ra ADR

## Bối cảnh

Phần A của biểu mẫu báo cáo ADR yêu cầu ngày sinh và tự động điền trường Tuổi. Mã hiện tại lấy ngày mở biểu mẫu (`new Date()`) làm ngày tham chiếu, trong khi hướng dẫn nghiệp vụ yêu cầu tuổi của bệnh nhân tại thời điểm xảy ra ADR. Cách tính hiện tại làm sai tuổi đối với báo cáo được nhập muộn và có thể tự thay đổi tuổi khi chỉnh sửa báo cáo cũ.

Ngoài ra, API đang xem `patient_age = 0` là thiếu vì kiểm tra giá trị theo truthiness. Do đó, báo cáo của trẻ dưới một tuổi có thể bị từ chối. Trường số nguyên hiện tại cũng không đủ để trình bày tháng tuổi hoặc ngày tuổi theo hướng dẫn.

## Mục tiêu

- Tính tuổi từ `patient_birth_date` và `adr_occurrence_date`.
- Bảo đảm giao diện và máy chủ cho cùng một kết quả.
- Không tin giá trị tuổi do client gửi lên.
- Hiển thị tuổi theo năm, tháng hoặc ngày phù hợp với bệnh nhi dưới một tuổi.
- Giữ tương thích với cơ sở dữ liệu, biểu đồ và các chức năng đang dùng `patient_age` theo số năm.
- Sửa dữ liệu lịch sử có thể tính lại một cách xác định từ hai ngày gốc.

## Ngoài phạm vi

- Không thay đổi cách tính tuổi của thẻ dị ứng độc lập nếu thẻ không lấy dữ liệu từ một báo cáo ADR.
- Không cho phép nhập tuổi thủ công vì ngày sinh là bắt buộc.
- Không thêm cột tuổi theo tháng hoặc ngày vào cơ sở dữ liệu.
- Không thay đổi các nhóm tuổi hiện tại trên biểu đồ.

## Quyết định thiết kế

### Nguồn dữ liệu chuẩn

Hai trường ngày là nguồn dữ liệu chuẩn:

- `patient_birth_date`: ngày sinh của bệnh nhân.
- `adr_occurrence_date`: ngày xảy ra ADR và là ngày tham chiếu để tính tuổi.

`patient_age` tiếp tục được lưu dưới dạng số năm tròn tại ngày xảy ra ADR. Đây là giá trị dẫn xuất để tương thích với các truy vấn, biểu đồ và tích hợp hiện có; nó không phải dữ liệu do client quyết định.

### Hàm nghiệp vụ dùng chung

Tạo `lib/patient-age.ts` với hàm thuần dùng chung:

```ts
calculatePatientAgeAtDate(birthDate, referenceDate)
```

Hàm nhận hai chuỗi ngày `YYYY-MM-DD`, xử lý chúng như ngày thuần túy, không phụ thuộc múi giờ máy chủ hoặc trình duyệt. Kết quả có cấu trúc cố định:

```ts
{
  years: 0,
  displayValue: 8,
  displayUnit: 'month'
}
```

Quy tắc:

- Từ đủ một tuổi trở lên: hiển thị số năm tròn.
- Từ đủ một tháng đến dưới một tuổi: hiển thị số tháng tròn.
- Dưới một tháng: hiển thị số ngày.
- ADR xảy ra đúng ngày sinh: hiển thị `0 ngày tuổi` và lưu `patient_age = 0`.

`displayUnit` chỉ nhận `year`, `month` hoặc `day`. Hàm `formatPatientAge` trong cùng module chuyển kết quả thành nhãn tiếng Việt.

Việc tính năm và tháng sử dụng đơn vị lịch tròn, không chia số ngày cho 365 hoặc 30. Nếu ngày kỷ niệm không tồn tại trong tháng tham chiếu, nó được chốt về ngày cuối cùng của tháng đó. Theo quy ước này, ngày 28/02 là ngày đủ tuổi trong năm không nhuận đối với người sinh ngày 29/02; từ 31/01 đến ngày cuối tháng 02 được tính là đủ một tháng.

Hàm ném lỗi nghiệp vụ có mã ổn định cho ngày sai định dạng, ngày không tồn tại, ngày sinh sau ngày tham chiếu và tuổi vượt quá 150. Kiểm tra ngày ADR trong tương lai là một hàm riêng nhận ngày hiện tại dưới dạng tham số, giúp kiểm thử không phụ thuộc đồng hồ hệ thống. “Ngày hiện tại” trong nghiệp vụ là ngày lịch tại múi giờ `Asia/Ho_Chi_Minh`, không phải ngày UTC của máy chủ triển khai.

## Luồng giao diện

### Tạo báo cáo

Phần A tiếp tục yêu cầu ngày sinh. Vì ngày xảy ra ADR được nhập ở Phần B, ô Tuổi tại Phần A hiển thị trạng thái “Tuổi sẽ được tính sau khi nhập ngày xảy ra ADR” cho đến khi có đủ hai ngày.

Khi người dùng nhập ngày xảy ra ADR, giao diện tính và hiển thị ngay tuổi tương ứng. Khi quay lại Phần A hoặc đến phần xem lại, người dùng thấy cùng một nhãn tuổi đã tính. Tuổi là trường chỉ đọc và không có đường nhập thủ công.

Giá trị tuổi trên client là dữ liệu dẫn xuất từ trạng thái biểu mẫu, không được duy trì bằng một `useEffect` chỉ theo dõi ngày sinh. Cách này tránh vòng lặp cập nhật và tránh việc component Phần A bị tháo khỏi cây giao diện khi người dùng đang ở Phần B.

### Chỉnh sửa báo cáo

Khi ngày sinh hoặc ngày xảy ra ADR thay đổi, bản xem trước tuổi thay đổi ngay. Khi lưu, máy chủ tính lại tuổi từ hai ngày trong request. Việc chỉ mở màn hình chỉnh sửa không làm tuổi tăng theo ngày hiện tại.

### Các nơi hiển thị

Danh sách báo cáo, chi tiết, phần xem lại, email và bản in sử dụng cùng hàm định dạng từ hai ngày gốc. Ví dụ:

- `25 tuổi`
- `8 tháng tuổi`
- `12 ngày tuổi`

Biểu đồ phân bố tuổi tiếp tục dùng `patient_age` theo số năm tròn; trẻ dưới một tuổi có giá trị 0 và thuộc nhóm `0-18` hiện tại.

Đối với bản ghi lịch sử có quan hệ ngày không hợp lệ, các màn hình đọc không được lỗi toàn trang. Chúng hiển thị “Không xác định — dữ liệu ngày không hợp lệ” và bản ghi được đưa vào danh sách cần xử lý thủ công. Chế độ tạo và chỉnh sửa vẫn chặn lưu cho đến khi ngày được sửa hợp lệ.

## Luồng API và lưu trữ

Các API tạo báo cáo nội bộ, tạo báo cáo công khai và cập nhật báo cáo thực hiện cùng một quy trình:

1. Xác thực hai trường ngày bắt buộc.
2. Kiểm tra quan hệ giữa hai ngày.
3. Gọi hàm tính tuổi dùng chung ở phía máy chủ.
4. Bỏ qua `patient_age` do client cung cấp, nếu có.
5. Lưu `result.years` vào `patient_age`.

`patient_age` được bỏ khỏi danh sách trường đầu vào bắt buộc của API. Giá trị 0 là hợp lệ và không bị kiểm tra bằng biểu thức `!value`.

API trả mã 400 cùng thông báo cụ thể khi:

- Ngày sinh hoặc ngày xảy ra ADR không đúng định dạng hay không tồn tại.
- Ngày sinh nằm sau ngày xảy ra ADR.
- Ngày xảy ra ADR nằm trong tương lai.
- Tuổi tại ngày xảy ra ADR vượt quá 150.

## Dữ liệu lịch sử

Thêm một migration dữ liệu có thể chạy lặp an toàn. Migration tính lại số năm tròn của mọi báo cáo có hai ngày hợp lệ và cập nhật `patient_age` khi giá trị hiện tại khác kết quả.

Các bản ghi có quan hệ ngày không hợp lệ không được tự động sửa. Migration phải cung cấp truy vấn kiểm tra hoặc kết quả thống kê để nhận diện các bản ghi này cho việc xử lý thủ công.

Việc triển khai theo thứ tự:

1. Triển khai hàm dùng chung, API và các nơi hiển thị.
2. Chạy migration tính lại dữ liệu lịch sử.
3. Kiểm tra số bản ghi đã cập nhật và danh sách bản ghi bị bỏ qua.

Thứ tự này bảo đảm dữ liệu mới không tiếp tục được ghi theo công thức cũ trong lúc migration chạy.

## Tính nhất quán và lỗi

- Tất cả phép tính dùng chuỗi ngày thuần túy để tránh lệch ngày do UTC hoặc múi giờ Việt Nam.
- Client cung cấp phản hồi sớm, nhưng API là lớp quyết định cuối cùng.
- Giao diện hiển thị lỗi ngay cạnh trường ngày liên quan và không cho gửi khi hai ngày mâu thuẫn.
- Nếu client bị sửa để gửi một `patient_age` khác, API vẫn lưu kết quả tự tính.
- Nếu không thể tính tuổi, API không tạo hoặc cập nhật một phần báo cáo.

## Kiểm thử

Thêm Vitest làm công cụ kiểm thử đơn vị và một script `npm test`; các kiểm thử API có thể gọi trực tiếp handler với các phụ thuộc được cô lập. Kiểm thử không được phụ thuộc cơ sở dữ liệu production hoặc đồng hồ thật.

### Kiểm thử đơn vị cho hàm tính tuổi

- Trước, đúng và sau ngày sinh nhật trong năm tham chiếu.
- Sinh ngày 29/02 trong năm nhuận và tham chiếu ở năm không nhuận.
- Ngày cuối tháng.
- Đủ một tháng, ngay dưới một tháng, đủ một tuổi và ngay dưới một tuổi.
- ADR xảy ra đúng ngày sinh.
- Ngày sinh sau ngày ADR.
- Ngày không tồn tại hoặc sai định dạng.
- ADR trong tương lai.
- Tuổi bằng 150 và lớn hơn 150.
- Kết quả không thay đổi theo múi giờ chạy kiểm thử.

### Kiểm thử API

- Tạo báo cáo nội bộ lưu đúng số năm tròn.
- Tạo báo cáo công khai lưu đúng số năm tròn.
- Cập nhật một trong hai ngày làm tuổi được tính lại.
- Request cho trẻ dưới một tuổi được chấp nhận dù không gửi `patient_age`; API tự tính và lưu giá trị 0.
- `patient_age` giả từ client bị bỏ qua.
- Các quan hệ ngày không hợp lệ trả mã 400 và không ghi dữ liệu.

### Kiểm thử giao diện và đầu ra

- Phần A hiển thị trạng thái chờ khi chưa có ngày ADR.
- Sau khi nhập ngày ADR, Phần A và phần xem lại hiển thị cùng kết quả.
- Danh sách, chi tiết, email và bản in dùng đúng năm/tháng/ngày.
- Chỉnh sửa báo cáo không lấy ngày hiện tại để thay đổi tuổi.
- Biểu đồ vẫn phân nhóm theo số năm tròn.

### Kiểm thử migration

- Dữ liệu có tuổi cũ sai được tính lại.
- Bản ghi có ngày không hợp lệ được liệt kê và không bị sửa.
- Chạy migration lần hai không tạo thêm thay đổi.

## Tiêu chí nghiệm thu

- Tuổi luôn được tính tại ngày xảy ra ADR, không dựa vào ngày hiện tại hoặc ngày lập báo cáo.
- Giao diện và API trả cùng một kết quả cho cùng hai ngày.
- Client không thể ép API lưu tuổi sai.
- Trẻ dưới một tuổi gửi báo cáo thành công và được hiển thị theo tháng hoặc ngày.
- Dữ liệu lịch sử hợp lệ được tính lại chính xác.
- Tất cả nơi hiển thị báo cáo sử dụng cùng quy tắc định dạng.
- Các biểu đồ hiện có tiếp tục hoạt động mà không cần thay đổi nhóm tuổi.
