# Thiết kế giao diện desktop full-width

## Mục tiêu

Mở rộng giao diện nghiệp vụ trên desktop để sử dụng toàn bộ chiều rộng viewport, đồng thời giữ nguyên trải nghiệm responsive hiện tại trên tablet và mobile.

## Phạm vi

- Áp dụng cho toàn bộ các trang nghiệp vụ đang sử dụng `MainLayout`.
- Không thay đổi bố cục riêng của trang đăng nhập, trang công khai và các màn hình không sử dụng `MainLayout`.
- Không thay đổi dữ liệu, API, phân quyền hoặc luồng nghiệp vụ.

## Thiết kế khung giao diện

- Từ breakpoint `lg` (1024px), header và vùng nội dung sử dụng toàn bộ chiều rộng viewport, không còn bị giới hạn bởi `max-w-7xl`.
- Sidebar nằm bên trái và giữ chiều rộng hiện tại: 288px ở desktop, 320px ở breakpoint `xl`.
- Vùng nội dung dùng `flex: 1`, chiếm toàn bộ phần chiều rộng còn lại sau sidebar.
- Vùng nội dung giữ padding responsive hiện tại trên mobile và dùng khoảng đệm 24–32px trên desktop để nội dung không sát mép.
- Khung trang có chiều cao tối thiểu bằng viewport. Header, thân trang và footer không tạo cuộn ngang ngoài ý muốn.
- Header full-width và các thành phần bên trong thẳng hàng với khung nội dung desktop.

## Cách nội dung sử dụng không gian

- Dashboard, danh sách, bảng và biểu đồ được phép giãn theo toàn bộ vùng nội dung khả dụng.
- Các grid hiện có tiếp tục dùng breakpoint responsive và tỷ lệ cột hiện tại; không thêm chiều rộng cố định làm giảm khả năng co giãn.
- Form nhập liệu, đoạn văn dài và nội dung cần giới hạn độ dài dòng có thể giữ `max-width` cục bộ bên trong trang. Giới hạn này không được đặt lại trên khung `MainLayout`.
- Các bảng hoặc biểu đồ rộng phải cuộn trong container của chúng khi cần, thay vì làm toàn bộ trang tràn ngang.
- Footer trải theo khung trang và không làm thay đổi chiều rộng của vùng nội dung.

## Responsive

- Các quy tắc mới chỉ tác động từ breakpoint `lg` trở lên.
- Tablet và mobile giữ nguyên menu, khoảng cách, cách xếp cột và hành vi hiện tại.
- Mobile menu tiếp tục thay thế sidebar dưới breakpoint `lg`.

## Thành phần cần điều chỉnh

- `components/layout/MainLayout.tsx`: loại bỏ giới hạn chiều rộng desktop khỏi content wrapper và bảo đảm flex item có thể co giãn an toàn.
- `components/layout/Header.tsx`: loại bỏ giới hạn chiều rộng desktop khỏi header wrapper.
- Chỉ bổ sung thay đổi ở component con nếu kiểm thử phát hiện phần tử gây tràn ngang; không thực hiện refactor ngoài phạm vi.

## Xử lý lỗi hiển thị

- Dùng `min-w-0` tại các flex container cần thiết để nội dung rộng không ép layout vượt viewport.
- Bảng và vùng dữ liệu rộng dùng overflow cục bộ.
- Không che mất nội dung hoặc vô hiệu hóa cuộn dọc của trang.

## Kiểm thử và tiêu chí hoàn thành

- Ở 1024px, 1440px và 1920px, header và content sử dụng toàn bộ chiều rộng viewport còn lại sau sidebar.
- Sidebar hiển thị đúng chiều rộng, không chồng lên content.
- Không xuất hiện khoảng trống do `max-w-7xl` ở hai bên nội dung desktop.
- Không có thanh cuộn ngang ở cấp trang trong các màn hình nghiệp vụ chính.
- Ở 768px và 390px, bố cục và điều hướng responsive hiện tại không thay đổi.
- Type-check, test và build liên quan vượt qua, trừ lỗi tồn tại sẵn được ghi nhận rõ ràng.

