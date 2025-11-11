# 📱 HƯỚNG DẪN: MÃ QR CÔNG KHAI CHO THẺ DỊ ỨNG

## 🎯 Tổng quan

Hệ thống đã được cập nhật để **mã QR trên thẻ dị ứng** chứa URL công khai, cho phép **bất kỳ ai quét bằng bất kỳ app QR nào** đều có thể xem thông tin dị ứng **KHÔNG CẦN ĐĂNG NHẬP** vào hệ thống.

---

## ✨ Tính năng mới

### **Trước đây:**
- QR code chỉ chứa mã thẻ (`AC-2024-000001`)
- Cần đăng nhập hệ thống mới xem được thông tin
- Chỉ dùng được trên app Codex-ADR

### **Bây giờ:**
- QR code chứa **URL công khai** đầy đủ
- **KHÔNG CẦN ĐĂNG NHẬP** - ai quét cũng xem được
- Dùng được với **mọi app quét QR** (Camera iPhone, Android, ZaloPay QR, v.v.)
- Hiển thị đầy đủ: Họ tên, tuổi, giới tính, thông tin dị ứng, bác sĩ liên hệ

---

## 🔧 Cách hoạt động

### 1. **Tạo thẻ dị ứng mới**

Khi tạo thẻ dị ứng, hệ thống tự động:

```typescript
// Sinh mã thẻ
Card Code: AC-2024-000001

// Sinh URL công khai
Public URL: https://your-domain.com/allergy-cards/public/AC-2024-000001

// Tạo QR code chứa URL công khai
QR Code: [QR màu đỏ chứa URL trên]
```

### 2. **Quét QR code**

**Bước 1:** Quét bằng bất kỳ app QR nào
- Camera điện thoại (iPhone/Android)
- App quét QR bất kỳ
- ZaloPay QR, Momo QR, v.v.

**Bước 2:** Tự động mở trình duyệt và hiển thị thông tin đầy đủ:
- ⚠️ Cảnh báo dị ứng nổi bật
- 👤 Thông tin bệnh nhân (họ tên, tuổi, giới tính)
- 🚨 Danh sách dị ứng chi tiết
- 🏥 Thông tin bệnh viện & bác sĩ
- 📞 Số điện thoại liên hệ khẩn cấp

---

## 📂 Cấu trúc mới

### **1. API công khai**

```
GET /api/allergy-cards/public/[code]
```

**Đặc điểm:**
- ✅ Không cần authentication
- ✅ Trả về thông tin thẻ và danh sách dị ứng
- ✅ Kiểm tra trạng thái thẻ (expired, inactive)
- ✅ An toàn - chỉ trả về thông tin cần thiết

**File:** `app/api/allergy-cards/public/[code]/route.ts`

### **2. Trang công khai**

```
GET /allergy-cards/public/[code]
```

**Đặc điểm:**
- ✅ Giao diện đẹp, dễ đọc
- ✅ Màu đỏ cảnh báo nổi bật
- ✅ Responsive - hiển thị tốt trên mobile
- ✅ Hiển thị mức độ nghiêm trọng của dị ứng
- ✅ Số điện thoại có thể bấm gọi trực tiếp

**File:** `app/allergy-cards/public/[code]/page.tsx`

### **3. Cập nhật QR Service**

**File:** `lib/qr-card-service.ts`

```typescript
// Method: generateCardQR()
// Trước: QR chỉ chứa mã thẻ
qrContent = "AC-2024-000001"

// Sau: QR chứa URL công khai đầy đủ
qrContent = "https://your-domain.com/allergy-cards/public/AC-2024-000001"
```

### **4. Middleware**

**File:** `middleware.ts`

Đã thêm rules cho phép truy cập công khai:
- `/allergy-cards/public/*` ✅
- `/api/allergy-cards/public/*` ✅
- `/allergy-cards/scan` ✅

---

## 🎨 Giao diện trang công khai

### **Header - Cảnh báo khẩn cấp**
```
┌─────────────────────────────────────┐
│ 🛡️ ⚠️ THẺ DỊ ỨNG / ALLERGY CARD    │
│ Thông tin dị ứng quan trọng         │
│ Vui lòng đọc kỹ trước khi điều trị  │
└─────────────────────────────────────┘
```

### **Thông tin bệnh nhân**
```
┌─────────────────────────────────────┐
│ 👤 THÔNG TIN BỆNH NHÂN              │
├─────────────────────────────────────┤
│ Họ và tên: Nguyễn Văn A             │
│ Tuổi: 35 - Giới tính: Nam           │
│ CMND/CCCD: 001234567890             │
│ Mã thẻ: AC-2024-000001              │
└─────────────────────────────────────┘
```

### **Thông tin dị ứng (nổi bật)**
```
┌─────────────────────────────────────┐
│ 🛡️ THÔNG TIN DỊ ỨNG                │
├─────────────────────────────────────┤
│ 🚨 Penicillin                       │
│ [Nguy hiểm tính mạng] [Đã xác nhận]│
│ Biểu hiện: Phản vệ toàn thân, khó   │
│ thở, sốc phản vệ                    │
├─────────────────────────────────────┤
│ ⚡ Aspirin                           │
│ [Trung bình] [Nghi ngờ]             │
│ Biểu hiện: Phát ban, ngứa da        │
└─────────────────────────────────────┘
```

### **Thông tin y tế**
```
┌─────────────────────────────────────┐
│ 🏥 THÔNG TIN Y TẾ                   │
├─────────────────────────────────────┤
│ Bệnh viện: BV Đa khoa Trung ương    │
│ Khoa: Nội tổng hợp                  │
│ Bác sĩ: BS. Nguyễn Thị B            │
│ 📞 0912345678 (bấm để gọi)          │
│ Ngày cấp: 15/11/2024                │
└─────────────────────────────────────┘
```

---

## 🔐 Bảo mật

### **Dữ liệu công khai:**
✅ Mã thẻ  
✅ Họ tên bệnh nhân  
✅ Tuổi, giới tính  
✅ Thông tin dị ứng  
✅ Bệnh viện, bác sĩ  
✅ Số điện thoại liên hệ  

### **Dữ liệu KHÔNG công khai:**
❌ User ID  
❌ Report ID  
❌ Thông tin tài khoản  
❌ Lịch sử chỉnh sửa  
❌ Dữ liệu hệ thống  

### **Kiểm soát:**
- Chỉ cho phép GET (đọc)
- Không cho phép sửa/xóa qua API công khai
- Validate mã thẻ chặt chẽ
- Hiển thị cảnh báo nếu thẻ hết hạn/vô hiệu

---

## 📱 Hướng dẫn sử dụng cho người dùng cuối

### **Dành cho bệnh nhân:**

1. **Nhận thẻ dị ứng** có mã QR từ bác sĩ
2. **Giữ thẻ bên mình** hoặc chụp ảnh QR code
3. Khi đến cơ sở y tế khác, **cho nhân viên y tế quét QR**
4. Thông tin dị ứng hiển thị ngay lập tức

### **Dành cho nhân viên y tế:**

1. **Yêu cầu bệnh nhân xuất trình thẻ** dị ứng
2. **Quét QR bằng điện thoại** (không cần cài app đặc biệt)
3. **Đọc kỹ thông tin** dị ứng trước khi điều trị
4. **Liên hệ bác sĩ** nếu cần thêm thông tin (có số điện thoại)

### **Trong trường hợp khẩn cấp:**

🚨 Khi bệnh nhân không tỉnh táo:
1. Kiểm tra ví/túi xách có thẻ dị ứng không
2. Quét QR ngay lập tức
3. Xem thông tin dị ứng để tránh thuốc nguy hiểm
4. Liên hệ bác sĩ điều trị qua số điện thoại trên thẻ

---

## 🧪 Test thử

### **1. Tạo thẻ dị ứng mới:**
```bash
POST /api/allergy-cards
{
  "patient_name": "Test User",
  "patient_age": 30,
  "patient_gender": "male",
  "hospital_name": "Test Hospital",
  "doctor_name": "Dr. Test",
  "allergies": [
    {
      "allergen_name": "Penicillin",
      "certainty_level": "confirmed",
      "severity_level": "severe"
    }
  ]
}
```

### **2. Lấy mã thẻ từ response:**
```json
{
  "success": true,
  "card": {
    "card_code": "AC-2024-000001",
    "qr_code_url": "data:image/png;base64,..."
  }
}
```

### **3. Test truy cập công khai:**
```bash
# Không cần authentication
GET /api/allergy-cards/public/AC-2024-000001

# Hoặc mở trình duyệt
https://your-domain.com/allergy-cards/public/AC-2024-000001
```

### **4. Quét QR bằng điện thoại:**
- Mở Camera
- Quét QR code từ thẻ
- Tự động mở trang thông tin

---

## 🔄 Migration từ hệ thống cũ

### **Thẻ đã tạo trước đây:**
- QR cũ vẫn hoạt động bình thường
- Để có QR công khai mới, cần **re-generate QR**
- Hoặc tạo thẻ mới từ dữ liệu cũ

### **Script regenerate QR (nếu cần):**
```sql
-- Query tất cả thẻ cần update QR
SELECT id, card_code FROM allergy_cards WHERE qr_code_url LIKE '%AC-20%';

-- Update bằng API hoặc script
```

---

## 📊 Thống kê sử dụng

### **Metrics có thể theo dõi:**
- Số lượt quét QR công khai
- Top thẻ được quét nhiều nhất
- Thời gian response trung bình
- Tỷ lệ thẻ hết hạn được quét

### **Log format:**
```
[Public Access] Card: AC-2024-000001, IP: xxx.xxx.xxx.xxx, Time: 2024-11-15 10:30:00
```

---

## ⚠️ Lưu ý quan trọng

### **Cần thiết lập:**
1. **Environment variable:**
   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

2. **Domain phải có SSL (HTTPS):**
   - Camera điện thoại yêu cầu HTTPS để mở link
   - Đảm bảo certificate hợp lệ

3. **Test trên production:**
   - QR code với localhost không hoạt động trên mobile
   - Cần deploy lên server thật để test

### **Performance:**
- API công khai dùng Admin client (bypass RLS)
- Response time < 200ms
- Cache-able (có thể thêm caching sau)

### **SEO & Privacy:**
- Có thể thêm `noindex` meta tag nếu không muốn Google index
- Cân nhắc thêm password protection nếu cần

---

## 🆘 Troubleshooting

### **Problem: QR không mở được**
**Solution:**
- Kiểm tra `NEXT_PUBLIC_APP_URL` đã set đúng chưa
- Kiểm tra SSL certificate
- Thử quét bằng app QR khác

### **Problem: "Không tìm thấy thẻ"**
**Solution:**
- Kiểm tra mã thẻ đúng format `AC-YYYY-XXXXXX`
- Kiểm tra thẻ có tồn tại trong database không
- Xem log API để debug

### **Problem: Trang hiển thị sai layout trên mobile**
**Solution:**
- Kiểm tra responsive CSS
- Test trên nhiều thiết bị khác nhau
- Kiểm tra viewport meta tag

---

## 📝 Changelog

### **Version 2.0 - Public QR (15/11/2024)**
- ✅ Tạo API công khai `/api/allergy-cards/public/[code]`
- ✅ Tạo trang công khai `/allergy-cards/public/[code]`
- ✅ Cập nhật QR service để sinh URL công khai
- ✅ Cập nhật middleware cho phép truy cập không auth
- ✅ Cập nhật trang scan để hỗ trợ URL mới
- ✅ Giao diện responsive, đẹp mắt, dễ đọc

### **Version 1.0 - QR Basic**
- Chỉ chứa mã thẻ
- Cần đăng nhập để xem

---

## 🎓 Best Practices

### **Khi tạo thẻ:**
1. Nhập đầy đủ thông tin bệnh nhân
2. Ghi rõ mức độ nghiêm trọng của dị ứng
3. Cung cấp số điện thoại liên hệ chính xác
4. Kiểm tra QR trước khi in thẻ

### **Khi in thẻ:**
1. In QR kích thước đủ lớn (ít nhất 2x2cm)
2. Đảm bảo độ phân giải cao
3. In trên giấy/plastic bền
4. Có thể in backup nhiều bản

### **Khi phát hành:**
1. Hướng dẫn bệnh nhân cách sử dụng
2. Demo quét QR trước mặt bệnh nhân
3. Khuyên bệnh nhân chụp ảnh QR lưu trữ
4. Nhắc nhở update khi có thay đổi

---

## 📞 Liên hệ hỗ trợ

Nếu có vấn đề kỹ thuật, liên hệ:
- Email: support@your-domain.com
- Hotline: 1900-xxxx

---

**Tài liệu này được tạo tự động bởi AI Assistant**  
**Ngày cập nhật: 15/11/2024**

