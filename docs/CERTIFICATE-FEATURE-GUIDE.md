# Hướng dẫn Tính năng Cấp Chứng nhận

## Tổng quan

Tính năng cấp chứng nhận cho phép người tham gia cuộc thi tải về chứng nhận hoàn thành sau khi đạt điểm yêu cầu (≥ 60%).

## Yêu cầu nhận chứng nhận

- **Điểm tối thiểu**: 60% (6/10 câu đúng)
- **Hoàn thành bài thi**: Phải nộp bài và có kết quả
- **Thành tích xuất sắc**: ≥ 80% sẽ có huy hiệu đặc biệt

## Nội dung Chứng nhận

Chứng nhận bao gồm các thông tin sau:

1. **Thông tin cá nhân**
   - Họ và tên người tham gia
   - Đơn vị
   - Khoa/Phòng

2. **Thông tin cuộc thi**
   - Tên cuộc thi
   - Điểm số: X/Y điểm (Z%)
   - Thời gian hoàn thành: MM:SS

3. **Thông tin xác thực**
   - Ngày cấp (ngày hoàn thành bài thi)
   - Ban Giám Đốc (đã ký)

4. **Huy hiệu thành tích** (nếu đạt ≥ 80%)
   - ✨ THÀNH TÍCH XUẤT SẮC ✨

## Cách sử dụng

### 1. Hoàn thành bài thi

Người tham gia cần:
- Đăng ký tham gia cuộc thi
- Hoàn thành tất cả câu hỏi
- Nộp bài thi

### 2. Xem kết quả

Sau khi nộp bài, hệ thống sẽ hiển thị:
- Điểm số và phần trăm chính xác
- Thời gian hoàn thành
- Số câu đúng/sai

### 3. Tải chứng nhận

Nếu đạt ≥ 60%:
- Nút **"🎓 Tải chứng nhận"** sẽ xuất hiện
- Click vào nút để mở cửa sổ chứng nhận
- Chọn một trong các tùy chọn:
  - **In ngay**: Sử dụng nút "🖨️ In chứng nhận"
  - **Lưu PDF**: Print → chọn "Save as PDF"
  - **Đóng**: Nút "✖️ Đóng" để quay lại

### 4. In hoặc lưu PDF

**Cách lưu thành PDF:**
1. Click "🖨️ In chứng nhận"
2. Trong hộp thoại in:
   - Windows: Ctrl + P → chọn "Microsoft Print to PDF"
   - Mac: Cmd + P → chọn "Save as PDF"
   - Chrome: chọn "Save as PDF" trong Destination
3. Chọn vị trí lưu file
4. Click "Save"

**Mẹo in đẹp:**
- Orientation: Landscape (ngang)
- Paper size: A4
- Margins: Default
- Scale: 100%

## Thiết kế Chứng nhận

### Giao diện

- **Khung viền**: Vàng kim cao cấp (double border)
- **Màu chủ đạo**: Gradient tím-xanh (#667eea → #764ba2)
- **Typography**: Font Segoe UI, kích thước tối ưu cho 1 trang
- **Icon**: Trophy emoji 🏆, thành tích ⭐
- **Layout**: Căn giữa, cân đối, **vừa đúng 1 trang A4 landscape**

### Kích thước Tối ưu (Single Page)

- **Paper Size**: A4 Landscape (297mm x 210mm)
- **Border**: 10px vàng kim (giảm từ 12px)
- **Padding**: 30px 50px (giảm từ 60px 80px)
- **Font Sizes** (đã tối ưu):
  - Title: 48px (giảm từ 64px)
  - Name: 38px (giảm từ 56px)
  - Contest: 24px (giảm từ 32px)
  - Details: 16px (giảm từ 20px)
- **Spacing**: Margins và gaps đã giảm thiểu
- **Print Settings**: @page với size A4 landscape + page-break controls

### Responsive

- Desktop: Full size (1000px max-width)
- Mobile: Tự động điều chỉnh (grid 1 column)
- Print: **CHỈ 1 TRANG A4 landscape duy nhất**

## Cấu trúc Code

### 1. Component Certificate

**File**: `components/contest/CertificateTemplate.tsx`
- Component React hiển thị chứng nhận
- Props: CertificateData
- Có thể dùng cho preview hoặc print

### 2. API Endpoint

**File**: `app/api/contest/certificate/route.ts`
- Endpoint: `POST /api/contest/certificate`
- Body: `{ submission_id: string }`
- Response: HTML chứng nhận hoàn chỉnh

**Logic:**
1. Validate submission_id
2. Fetch submission + participant + contest data
3. Kiểm tra điểm ≥ 60%
4. Format dữ liệu
5. Generate HTML template
6. Return HTML response

### 3. Type Definitions

**File**: `types/contest.ts`

```typescript
export interface CertificateData {
  fullName: string;
  department: string;
  unit: string;
  contestTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completionTime: string;
  completionDate: string;
}
```

### 4. Result Page Integration

**File**: `app/contest/result/page.tsx`

**Thêm function:**
```typescript
const handleDownloadCertificate = async () => {
  // Gọi API /api/contest/certificate
  // Mở window mới với HTML response
}
```

**Thêm UI:**
```tsx
{percentage >= 60 && (
  <button onClick={handleDownloadCertificate}>
    🎓 Tải chứng nhận
  </button>
)}
```

## API Usage

### Request

```javascript
POST /api/contest/certificate
Content-Type: application/json

{
  "submission_id": "uuid-submission-id"
}
```

### Success Response (200)

```html
<!DOCTYPE html>
<html>
  <!-- Full certificate HTML -->
</html>
```

### Error Responses

**400 - Thiếu submission_id**
```json
{
  "success": false,
  "error": "Thiếu submission_id"
}
```

**400 - Điểm chưa đạt**
```json
{
  "success": false,
  "error": "Điểm chưa đạt yêu cầu để nhận chứng nhận (tối thiểu 60%)"
}
```

**404 - Không tìm thấy**
```json
{
  "success": false,
  "error": "Không tìm thấy bài thi"
}
```

## Customization

### Thay đổi thiết kế

Chỉnh sửa function `generateCertificateHTML()` trong:
`app/api/contest/certificate/route.ts`

**Màu sắc:**
- Border vàng: `#FFD700`, `#FFC107`
- Gradient chính: `#667eea`, `#764ba2`
- Achievement badge: `#FFD700`, `#FFA500`

**Layout:**
- Container: `.certificate-container`
- Header: `.header`
- Body: `.body`
- Footer: `.footer`

### Thay đổi điều kiện

**Điểm tối thiểu:**

Trong `route.ts`:
```typescript
if (percentage < 60) { // Đổi 60 thành điểm khác
  return NextResponse.json({
    error: 'Điểm chưa đạt...'
  })
}
```

Trong `page.tsx`:
```tsx
{percentage >= 60 && ( // Đổi 60 tương ứng
  <button>Tải chứng nhận</button>
)}
```

**Điều kiện xuất sắc:**

```typescript
const achievementBadge = percentage >= 80 // Đổi 80
```

### Thêm logo/hình ảnh

Trong HTML template:

```html
<div class="header">
  <img src="/Logo.jpg" alt="Logo" style="width: 100px;" />
  <!-- rest of header -->
</div>
```

### Thêm chữ ký số

```html
<div class="footer-item">
  <div class="footer-label">Ban Giám Đốc</div>
  <img src="/signature.png" alt="Signature" style="width: 150px;" />
  <div class="footer-value">Nguyễn Văn A</div>
</div>
```

## Troubleshooting

### Không thấy nút "Tải chứng nhận"

**Nguyên nhân:**
- Điểm < 60%
- Chưa hoàn thành bài thi

**Giải pháp:**
- Kiểm tra `percentage >= 60`
- Kiểm tra `resultData.submission.status === 'completed'`

### Popup bị chặn

**Nguyên nhân:**
- Browser block popup

**Giải pháp:**
- Cho phép popup từ localhost/domain
- Dùng download link thay vì window.open

### PDF không đẹp khi in

**Giải pháp:**
- Chọn Landscape orientation
- Scale 100%
- Uncheck headers/footers
- Chọn paper size = A4

### Thiếu dữ liệu

**Nguyên nhân:**
- Department/Unit null trong database

**Giải pháp:**
- Thêm fallback: `|| 'Chưa xác định'`
- Validate dữ liệu khi đăng ký

## Best Practices

### 1. Security

- ✅ Validate submission_id
- ✅ Check submission ownership (nếu cần auth)
- ✅ Sanitize user input (prevent XSS)

### 2. Performance

- ✅ Dùng sessionStorage cho result data
- ✅ Cache API response nếu có thể
- ✅ Optimize HTML size

### 3. UX

- ✅ Clear messaging (đạt/chưa đạt)
- ✅ Loading states
- ✅ Error handling với user-friendly messages
- ✅ Print instructions

### 4. Accessibility

- ✅ Semantic HTML
- ✅ Proper heading hierarchy
- ✅ Alt text cho images
- ✅ Good contrast ratios

## Future Enhancements

### Planned Features

1. **QR Code verification**
   - Thêm QR code vào chứng nhận
   - Scan để verify tính hợp lệ

2. **Email delivery**
   - Gửi PDF qua email tự động
   - Template email đẹp

3. **Certificate gallery**
   - Lưu lịch sử chứng nhận
   - Xem lại các chứng nhận đã nhận

4. **Social sharing**
   - Share image của certificate
   - LinkedIn integration

5. **Multilingual**
   - English certificate option
   - Internationalization support

6. **Custom templates**
   - Admin có thể customize template
   - Multiple certificate designs

## Support

Nếu có vấn đề hoặc câu hỏi:
1. Kiểm tra console logs
2. Xem network requests
3. Liên hệ dev team

---

**Version**: 1.0  
**Last Updated**: October 2025  
**Author**: CODEX ADR Team

