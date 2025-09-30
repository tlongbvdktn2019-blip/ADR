# Hướng Dẫn Quét QR Thẻ Dị Ứng Bằng Zalo

## 🎯 Tính Năng Mới

Bây giờ bạn có thể quét mã QR trên thẻ dị ứng bằng **bất kỳ ứng dụng nào**:
- ✅ **Zalo** (Quét QR trong Zalo)
- ✅ **Camera điện thoại** (iPhone, Android)
- ✅ **Bất kỳ app quét QR nào** (QR Scanner, etc.)
- ✅ **App nội bộ** (Vẫn hoạt động bình thường)
- ✅ **Import ảnh QR** (Tải ảnh QR có sẵn từ máy - MỚI!) 🆕

## 🔄 Những Gì Đã Thay Đổi

### Trước Đây
```
QR Code chứa: {"cardCode":"AC-2024-123456","patientName":"Nguyễn Văn A",...}
❌ Chỉ app nội bộ đọc được
❌ Zalo/Camera hiển thị JSON khó đọc
```

### Bây Giờ
```
QR Code chứa: https://yourdomain.com/allergy-cards/view/AC-2024-123456
✅ Mọi app QR đều mở được
✅ Hiển thị giao diện đẹp, đầy đủ thông tin
✅ Không cần đăng nhập
✅ Truy cập công khai an toàn
```

## 📱 Cách Sử Dụng

### 1. Quét Bằng Zalo

1. Mở **Zalo**
2. Chọn icon **Quét QR** (góc trên bên phải)
3. Hướng camera vào mã QR trên thẻ dị ứng
4. Zalo sẽ tự động mở link và hiển thị thông tin thẻ

### 2. Quét Bằng Camera iPhone

1. Mở app **Camera**
2. Hướng camera vào mã QR
3. Nhấn vào thông báo "Mở trong Safari"
4. Xem thông tin thẻ dị ứng

### 3. Quét Bằng Camera Android

1. Mở app **Camera** hoặc **Google Lens**
2. Hướng camera vào mã QR
3. Nhấn vào link hiển thị
4. Xem thông tin thẻ dị ứng

### 4. Quét Bằng App Nội Bộ

1. Đăng nhập hệ thống
2. Vào **Thẻ Dị Ứng** → **Quét QR**
3. Quét như bình thường
4. Vẫn hoạt động như trước

### 5. Import Ảnh QR Từ Máy 🆕

**Tính năng mới**: Bạn có thể tải lên ảnh QR có sẵn thay vì quét trực tiếp!

#### Trường Hợp Sử Dụng
- 📸 Đã chụp ảnh QR trước đó
- 💾 Có file ảnh QR được gửi qua email/Zalo
- 📱 Ảnh chụp màn hình QR code
- 🖼️ Ảnh QR được lưu trong thư viện ảnh

#### Cách Sử Dụng

**Trên Điện Thoại:**
1. Đăng nhập hệ thống
2. Vào **Thẻ Dị Ứng** → **Quét QR**
3. Nhấn nút **"Tải ảnh QR lên"** 🖼️
4. Chọn ảnh QR từ thư viện ảnh
5. Hệ thống tự động đọc và hiển thị thông tin

**Trên Máy Tính:**
1. Đăng nhập hệ thống
2. Vào **Thẻ Dị Ứng** → **Quét QR**
3. Nhấn nút **"Tải ảnh QR lên"** 🖼️
4. Chọn file ảnh QR từ máy tính
5. Hệ thống tự động đọc và hiển thị thông tin

#### Định Dạng Ảnh Hỗ Trợ
- ✅ JPEG/JPG
- ✅ PNG
- ✅ WebP
- ✅ GIF
- ✅ BMP

#### Lưu Ý
- 📏 Ảnh QR nên rõ nét, không bị mờ
- 🔆 Độ sáng ảnh phù hợp (không quá tối/quá sáng)
- 📐 QR code nên chiếm ít nhất 30% diện tích ảnh
- 🎯 QR code không bị che khuất hoặc biến dạng

## 🔒 Bảo Mật

### Thông Tin Công Khai
✅ Không cần đăng nhập để xem  
✅ Chỉ hiển thị thông tin cần thiết cho cấp cứu  
✅ Không lộ thông tin nhạy cảm  

### Kiểm Soát Truy Cập
✅ Chỉ thẻ **active** mới hiển thị  
✅ Thẻ hết hạn/vô hiệu → hiển thị lỗi  
✅ Validate mã thẻ đúng format  
✅ API verify có kiểm tra bảo mật  

## 📋 Thông Tin Hiển Thị

Khi quét QR, người xem sẽ thấy:

### 1. Thông Tin Bệnh Nhân
- Họ tên
- Tuổi
- Giới tính
- Bệnh viện điều trị

### 2. Thông Tin Dị Ứng
- Danh sách dị ứng
- Mức độ nghiêm trọng
- Triệu chứng
- Mức độ chắc chắn

### 3. Thuốc Nghi Ngờ (Nếu có)
⚠️ **CẢNH BÁO QUAN TRỌNG**
- Tên thuốc nghi ngờ gây dị ứng
- Tên thương mại
- Dạng bào chế
- Chỉ định
- Phản ứng sau khi ngừng thuốc

### 4. Liên Hệ Khẩn Cấp
- Bác sĩ điều trị
- Số điện thoại (có nút gọi trực tiếp)
- Hướng dẫn xử lý khẩn cấp

## 🛠️ Cấu Hình Hệ Thống

### File Đã Cập Nhật

1. **lib/qr-service.ts**
   - QR code giờ chứa URL thay vì JSON
   - Format: `{baseUrl}/allergy-cards/view/{cardCode}`

2. **app/allergy-cards/view/[code]/page.tsx** (MỚI)
   - Trang public view không cần đăng nhập
   - Hiển thị đầy đủ thông tin thẻ dị ứng
   - Giao diện đẹp, responsive

3. **middleware.ts**
   - Cho phép public access vào `/allergy-cards/view/*`
   - Không cần authentication

4. **app/allergy-cards/scan/page.tsx** (CẬP NHẬT MỚI)
   - Hỗ trợ quét cả URL và JSON
   - Tương thích ngược với QR cũ
   - **TÍNH NĂNG MỚI**: Import ảnh QR từ máy
   - Sử dụng thư viện `jsQR` để decode QR từ hình ảnh
   - Hỗ trợ mọi định dạng ảnh phổ biến

## 🧪 Kiểm Tra Tính Năng

### Bước 1: Tạo Thẻ Dị Ứng Mới
```bash
# Tạo thẻ qua giao diện hoặc API
# QR code sẽ tự động chứa URL
```

### Bước 2: Tải QR Code
```bash
# Tải hình QR từ thẻ vừa tạo
# Hoặc in trực tiếp thẻ dị ứng
```

### Bước 3: Test Quét
1. **Test Zalo**: Mở Zalo → Quét QR → Kiểm tra hiển thị
2. **Test Camera**: Mở Camera → Quét QR → Kiểm tra link
3. **Test App (Camera)**: Đăng nhập → Quét QR bằng camera → Vẫn hoạt động
4. **Test App (Upload)** 🆕: Đăng nhập → Tải ảnh QR lên → Kiểm tra kết quả

### Bước 4: Test Import Ảnh 🆕
1. Lưu ảnh QR vào máy/điện thoại
2. Vào trang Quét QR
3. Nhấn "Tải ảnh QR lên"
4. Chọn file ảnh đã lưu
5. Kiểm tra hiển thị

### Kết Quả Mong Đợi
✅ Mở trình duyệt web  
✅ Hiển thị trang thông tin thẻ  
✅ Đầy đủ thông tin dị ứng  
✅ Có nút gọi điện khẩn cấp  
✅ Cảnh báo rõ ràng nếu có thuốc nghi ngờ  
✅ Upload ảnh QR hoạt động mượt mà 🆕  

## 🌐 URL Format

### URL Pattern
```
https://yourdomain.com/allergy-cards/view/{CARD_CODE}

Ví dụ:
https://yourdomain.com/allergy-cards/view/AC-2024-123456
```

### API Endpoint
```
GET /api/allergy-cards/verify/{CARD_CODE}

Response:
{
  "success": true,
  "data": {
    "cardCode": "AC-2024-123456",
    "patientName": "Nguyễn Văn A",
    "allergies": [...],
    "suspectedDrugs": [...],
    ...
  }
}
```

## 🎨 Giao Diện

### Desktop
- Layout responsive, rộng rãi
- Card info dễ đọc
- Nút gọi điện dễ nhấn

### Mobile
- Tối ưu cho điện thoại
- Nút gọi trực tiếp bằng `tel:`
- Scroll mượt mà

### Màu Sắc
- 🔵 **Xanh dương**: Thông tin bệnh nhân
- 🟠 **Cam**: Thông tin dị ứng
- 🔴 **Đỏ**: Thuốc nghi ngờ (cảnh báo)
- 🟢 **Xanh lá**: Liên hệ khẩn cấp
- 🟡 **Vàng**: Hướng dẫn xử lý

## 📊 Lợi Ích

### 1. Tiện Lợi
✅ Không cần cài app chuyên dụng  
✅ Quét bằng bất kỳ thiết bị nào  
✅ Truy cập nhanh thông tin khẩn cấp  
✅ **Import ảnh QR khi không thể quét trực tiếp** 🆕  

### 2. An Toàn
✅ Thông tin luôn cập nhật từ database  
✅ Validate thẻ còn hiệu lực  
✅ Hiển thị cảnh báo rõ ràng  

### 3. Phổ Biến
✅ Dễ chia sẻ (copy link)  
✅ Mọi người đều dùng được  
✅ Tương thích mọi nền tảng  

### 4. Linh Hoạt 🆕
✅ Quét trực tiếp bằng camera  
✅ Hoặc tải ảnh QR đã chụp sẵn  
✅ Sử dụng ảnh QR nhận qua email/chat  
✅ Làm việc offline với ảnh đã lưu  

## 🔧 Troubleshooting

### Vấn Đề 1: Không Mở Được Link
**Nguyên nhân**: Mã thẻ không hợp lệ hoặc đã hết hạn  
**Giải pháp**: Kiểm tra status thẻ trong database

### Vấn Đề 2: Hiển thị "Không Tìm Thấy Thẻ"
**Nguyên nhân**: Thẻ đã bị xóa hoặc inactive  
**Giải pháp**: Cập nhật status = 'active'

### Vấn Đề 3: QR Cũ Vẫn Chứa JSON
**Nguyên nhân**: QR được tạo trước khi update  
**Giải pháp**: 
1. Vào "Chỉnh sửa thẻ"
2. Lưu lại → QR tự động update

### Vấn Đề 4: Middleware Chặn Truy Cập
**Nguyên nhân**: Route không được config public  
**Giải pháp**: Kiểm tra middleware.ts có `/allergy-cards/view/` không

### Vấn Đề 5: Không Đọc Được QR Từ Ảnh 🆕
**Nguyên nhân**: Ảnh QR không rõ nét hoặc bị mờ  
**Giải pháp**:
1. Chụp lại ảnh QR với độ phân giải cao hơn
2. Đảm bảo ánh sáng đủ khi chụp
3. QR code không bị che khuất
4. Thử zoom vào QR trước khi chụp

### Vấn Đề 6: File Upload Không Hoạt Động 🆕
**Nguyên nhân**: Trình duyệt chặn file upload  
**Giải pháp**:
1. Kiểm tra quyền file access của trình duyệt
2. Thử với trình duyệt khác (Chrome, Safari, Firefox)
3. Kiểm tra định dạng file (phải là ảnh)

### Vấn Đề 7: "Không Tìm Thấy Mã QR Trong Hình Ảnh" 🆕
**Nguyên nhân**: QR quá nhỏ hoặc không rõ trong ảnh  
**Giải pháp**:
1. Crop ảnh để QR chiếm nhiều diện tích hơn
2. Tăng độ sáng/tương phản của ảnh
3. Chụp lại ảnh với góc nhìn thẳng (không nghiêng)
4. Đảm bảo QR không bị biến dạng

### Vấn Đề 8: "Thẻ không tồn tại trong hệ thống" 🔥
**Nguyên nhân**: Thẻ chưa được tạo trong database hoặc đã bị xóa  
**Giải pháp**:
1. Kiểm tra thẻ có trong database không (xem `DEBUG-QR-SCAN.md`)
2. Tạo thẻ dị ứng mới qua giao diện
3. Chạy SQL: `SELECT * FROM allergy_cards WHERE card_code = 'AC-YYYY-XXXXXX'`
4. Đảm bảo thẻ có status = 'active'
5. Xem hướng dẫn chi tiết tại: `DEBUG-QR-SCAN.md`

## 📝 Best Practices

### 1. Khi Tạo Thẻ Mới
- ✅ Luôn link với ADR report nếu có
- ✅ Nhập đầy đủ thông tin liên hệ
- ✅ Kiểm tra số điện thoại bác sĩ

### 2. Khi In Thẻ
- ✅ In QR đủ lớn (tối thiểu 3x3 cm)
- ✅ Đảm bảo QR không bị mờ/nhòe
- ✅ Test quét trước khi phát hành

### 3. Khi Chia Sẻ
- ✅ Copy link từ QR để gửi qua Zalo/SMS
- ✅ Có thể chia sẻ cho nhiều người
- ✅ Link vĩnh viễn (trừ khi xóa thẻ)

## 🚀 Tương Lai

### Có Thể Mở Rộng
- [x] **Import ảnh QR từ máy** ✅ (Đã hoàn thành)
- [ ] Thêm đa ngôn ngữ (EN, VN)
- [ ] Export PDF trực tiếp từ view
- [ ] QR code động theo ngôn ngữ
- [ ] Analytics: theo dõi lượt quét
- [ ] Notification khi thẻ được quét
- [ ] Batch scanning: quét nhiều QR cùng lúc
- [ ] QR enhancement: tự động cải thiện chất lượng ảnh QR

## 📞 Hỗ Trợ

Nếu có vấn đề:
1. Kiểm tra thẻ status = 'active'
2. Kiểm tra middleware config
3. Xem API logs tại `/api/allergy-cards/verify/[code]`
4. Test trên nhiều thiết bị

---

## 📦 Thư Viện Sử Dụng

- **@yudiel/react-qr-scanner**: Quét QR bằng camera
- **jsQR** 🆕: Decode QR từ hình ảnh
- **Next.js**: Framework React
- **TailwindCSS**: Styling

---

**Cập nhật mới nhất**: 
- ✅ Tính năng import ảnh QR đã được thêm vào (30/09/2025)
- ✅ Hỗ trợ quét QR bằng Zalo/Camera/App
- ✅ Tải lên ảnh QR từ máy

**Thẻ cũ**: Cần chỉnh sửa và lưu lại để cập nhật QR code.

🎉 **Giờ đây, bạn có thể:**
- Quét QR thẻ dị ứng bằng Zalo
- Quét bằng camera điện thoại
- **Tải ảnh QR lên từ máy** 🆕
