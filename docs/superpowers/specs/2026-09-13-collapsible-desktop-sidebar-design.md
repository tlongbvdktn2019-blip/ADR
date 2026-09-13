# Thiết kế sidebar desktop có thể thu gọn

## Mục tiêu

Bổ sung nút thu gọn cho sidebar desktop để tăng diện tích hiển thị nội dung, đồng thời giữ điều hướng dễ nhận biết và không thay đổi giao diện tablet/mobile.

## Phạm vi

- Áp dụng cho `components/layout/Sidebar.tsx` trong các trang dùng `MainLayout`.
- Chỉ hoạt động từ breakpoint `lg` (1024px) trở lên.
- Không thay đổi `MobileMenu`, phân quyền, route hoặc dữ liệu nghiệp vụ.
- Không lưu trạng thái thu gọn; mỗi lần component được khởi tạo hoặc trang được tải lại, sidebar ở trạng thái mở rộng.

## Bố cục và tương tác

- Sidebar mở rộng giữ chiều rộng hiện tại: 288px ở desktop và 320px từ breakpoint `xl`.
- Sidebar thu gọn có chiều rộng cố định 72px.
- Nút mũi tên nằm ở góc phải khu vực logo và chuyển hướng để thể hiện thao tác thu gọn hoặc mở rộng.
- Khi thu gọn, sidebar chỉ hiển thị logo, icon điều hướng và nút mở rộng. Nhãn chữ và mô tả hệ thống được ẩn.
- Vùng nội dung chính tự chiếm phần chiều rộng được giải phóng nhờ cấu trúc flex hiện có trong `MainLayout`.
- Thay đổi chiều rộng và vị trí có hiệu ứng chuyển động khoảng 200ms; hiệu ứng không làm nội dung tràn ngang.

## Điều hướng và khả năng tiếp cận

- Mỗi mục điều hướng giữ nguyên icon, route và trạng thái active.
- Ở chế độ thu gọn, mỗi icon có tooltip văn bản khi rê chuột hoặc focus bằng bàn phím.
- Nút thu gọn/mở rộng là `button`, có `aria-label`, `title` và trạng thái `aria-expanded` phù hợp.
- Các mục điều hướng tiếp tục dùng liên kết có thể focus bằng bàn phím; focus ring phải nhìn thấy rõ.
- Vùng bấm icon có kích thước đủ lớn và được căn giữa trong thanh 72px.

## Nhóm quản trị

- Khi sidebar mở rộng, nhóm “Quản lý” giữ hành vi xổ xuống hiện tại.
- Khi sidebar thu gọn, bấm icon “Quản lý” mở menu nổi ở bên phải sidebar.
- Menu nổi hiển thị đầy đủ nhãn và icon của các mục quản trị mà người dùng có quyền truy cập.
- Menu nổi tự đóng khi người dùng chọn một mục, khi sidebar được mở rộng lại hoặc khi bấm ra ngoài menu.
- Route quản trị đang active tiếp tục làm nổi bật icon “Quản lý” và mục tương ứng trong menu.
- Người dùng không có vai trò admin không nhìn thấy icon hoặc menu quản trị.

## Trạng thái

- `isCollapsed` là state nội bộ của `Sidebar`, khởi tạo bằng `false`.
- `managementOpen` tiếp tục điều khiển nhóm quản trị ở chế độ mở rộng và menu nổi ở chế độ thu gọn.
- Chuyển sang trạng thái mở rộng sẽ đóng menu quản trị nổi để tránh trạng thái giao diện không nhất quán.
- Không đọc hoặc ghi `localStorage`, cookie hay state toàn cục.

## Xử lý biên

- Tooltip và menu nổi dùng lớp `z-index` đủ cao để không bị content che khuất.
- Sidebar không dùng overflow theo cách cắt mất menu nổi; riêng danh sách điều hướng vẫn được phép cuộn dọc khi chiều cao viewport nhỏ.
- Nhãn dài chỉ xuất hiện trong tooltip hoặc menu nổi và không làm thay đổi chiều rộng thanh thu gọn.
- Không tạo thanh cuộn ngang ở cấp trang khi chuyển trạng thái.

## Thành phần cần điều chỉnh

- `components/layout/Sidebar.tsx`: thêm state thu gọn, nút điều khiển, kiểu hiển thị icon rail, tooltip và menu quản trị nổi.
- Chỉ điều chỉnh `MainLayout` nếu kiểm thử cho thấy flex container không co giãn đúng; không thực hiện refactor ngoài phạm vi.

## Kiểm thử và tiêu chí hoàn thành

- Sidebar mở rộng mặc định ở mỗi lần tải lại trang.
- Có thể chuyển đổi mở rộng và thu gọn nhiều lần mà không lệch layout.
- Ở trạng thái thu gọn, sidebar rộng 72px và content sử dụng phần không gian còn lại.
- Tất cả icon điều hướng có tooltip, focus rõ ràng và điều hướng đúng route.
- Menu quản trị nổi mở, đóng và đánh dấu route active đúng; không hiển thị cho user thường.
- Không có cuộn ngang ở 1024px, 1440px và 1920px.
- Giao diện và điều hướng tại 768px và 390px không thay đổi.
- Type-check, test và production build vượt qua, trừ lỗi tồn tại sẵn được ghi nhận rõ ràng.

