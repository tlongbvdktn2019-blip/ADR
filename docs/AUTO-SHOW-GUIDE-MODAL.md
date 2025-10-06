# Tính năng Modal Hướng dẫn Tự động

## Mô tả
Modal hướng dẫn báo cáo ADR sẽ tự động xuất hiện khi người dùng truy cập vào trang chủ hoặc trang báo cáo công khai lần đầu tiên.

## Tính năng
- ✅ Tự động hiển thị modal khi vào trang chủ (lần đầu)
- ✅ Animation mượt mà từ trên xuống
- ✅ Checkbox "Không hiển thị lại" để tắt vĩnh viễn
- ✅ Lưu trạng thái vào localStorage
- ✅ Người dùng có thể mở lại bất cứ lúc nào bằng nút "Hướng dẫn báo cáo"

## Các trang áp dụng
1. **Trang chủ** (`/` - sử dụng `PublicReportForm` component)
2. **Trang báo cáo công khai** (`/public-report`)

## Cách hoạt động

### Lần đầu truy cập
1. Người dùng vào trang chủ hoặc trang báo cáo công khai
2. Sau 500ms, modal tự động xuất hiện với animation từ trên xuống
3. Modal hiển thị toàn bộ nội dung hướng dẫn từ `huongdanbaocao.html`

### Lần sau
- Nếu người dùng **KHÔNG** chọn "Không hiển thị lại": Modal vẫn sẽ hiện mỗi lần vào trang
- Nếu người dùng **ĐÃ CHỌN** "Không hiển thị lại": Modal không tự động hiện nữa

### Mở lại bằng tay
Người dùng luôn có thể mở modal bất cứ lúc nào bằng cách:
- Click vào nút "Hướng dẫn báo cáo" (icon sách) trên thanh tiến trình
- Nút này có trên mọi trang báo cáo (tạo mới, chỉnh sửa, công khai)

## localStorage Key
```javascript
hasSeenADRGuide: 'true'
```

## Reset để test lại (Developer)

### Cách 1: Xóa từ DevTools
1. Mở DevTools (F12)
2. Vào tab **Application** (Chrome) hoặc **Storage** (Firefox)
3. Tìm **Local Storage** > chọn domain của ứng dụng
4. Xóa key `hasSeenADRGuide`
5. Refresh trang

### Cách 2: Dùng Console
Mở Console (F12) và chạy:
```javascript
localStorage.removeItem('hasSeenADRGuide')
```
Sau đó refresh trang.

### Cách 3: Incognito/Private Mode
Mở trang trong chế độ Incognito/Private - modal sẽ luôn hiện vì không có localStorage.

## Files liên quan

### Modal Component
- `components/forms/ReportGuideModal.tsx` - Component modal chính
  - Nhận props: `dontShowAgain`, `setDontShowAgain`
  - Hiển thị checkbox "Không hiển thị lại"
  - Animation từ trên xuống

### Trang áp dụng
- `components/public/PublicReportForm.tsx` - Form báo cáo công khai (dùng cho trang chủ)
- `app/public-report/page.tsx` - Trang báo cáo công khai độc lập

### Các trang có nút "Hướng dẫn báo cáo"
- `app/reports/new/page.tsx` - Tạo báo cáo mới
- `app/reports/[id]/edit/page.tsx` - Chỉnh sửa báo cáo
- `app/public-report/page.tsx` - Báo cáo công khai
- `components/public/PublicReportForm.tsx` - Component form công khai

## Customization

### Thay đổi delay hiển thị
Sửa timeout trong useEffect:
```javascript
const timer = setTimeout(() => {
  setShowGuideModal(true)
}, 500) // Đổi số này (ms)
```

### Thay đổi animation
Sửa trong `ReportGuideModal.tsx`:
```jsx
<Transition.Child
  enter="ease-out duration-500 transform"
  enterFrom="opacity-0 scale-95 -translate-y-8"
  enterTo="opacity-100 scale-100 translate-y-0"
  // ... customize tại đây
>
```

### Tắt tính năng tự động hiển thị
Comment hoặc xóa phần `useEffect` trong:
- `components/public/PublicReportForm.tsx`
- `app/public-report/page.tsx`

