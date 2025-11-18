# 📝 HƯỚNG DẪN BỔ SUNG THÔNG TIN THẺ DỊ ỨNG

## Tổng quan

Tính năng **Bổ sung thông tin thẻ dị ứng** cho phép bất kỳ cơ sở y tế nào (sau khi xác thực mã thẻ) có thể bổ sung thêm thông tin vào thẻ dị ứng của bệnh nhân. Điều này rất hữu ích khi bệnh nhân đến khám tại nhiều cơ sở y tế khác nhau.

## 🎯 Tính năng chính

### 1. **Thông tin cố định (không thay đổi)**
- Thông tin bệnh nhân (Tên, tuổi, giới tính, CMND/CCCD)
- Mã QR và mã thẻ

### 2. **Thông tin có thể bổ sung**
- **Dị ứng mới phát hiện**: Thêm các dị ứng mới được phát hiện
- **Thông tin cơ sở y tế**: Cơ sở y tế nào đã khám/điều trị
- **Thông tin bổ sung**: Các thông tin chi tiết khác
- **Cập nhật mức độ nghiêm trọng**: Điều chỉnh mức độ nghiêm trọng của dị ứng

### 3. **Lịch sử bổ sung**
- Lưu đầy đủ lịch sử tất cả các lần bổ sung
- Hiển thị timeline với thông tin chi tiết
- Trạng thái xác minh

## 📋 Database Schema

### Bảng `allergy_card_updates`
Lưu thông tin về mỗi lần bổ sung:
- `id`: ID của bản cập nhật
- `card_id`: ID của thẻ dị ứng
- `updated_by_name`: Tên người bổ sung
- `updated_by_organization`: Tổ chức/Bệnh viện
- `updated_by_role`: Vai trò (Bác sĩ, Y tá, ...)
- `updated_by_phone`, `updated_by_email`: Liên hệ
- `facility_name`: Cơ sở y tế nơi bổ sung
- `facility_department`: Khoa/Phòng
- `update_type`: Loại cập nhật
- `update_notes`: Ghi chú
- `reason_for_update`: Lý do bổ sung
- `is_verified`: Đã xác minh chưa
- `created_at`, `updated_at`: Timestamps

### Bảng `update_allergies`
Lưu các dị ứng được bổ sung trong mỗi lần cập nhật:
- `id`: ID của dị ứng
- `update_id`: ID của bản cập nhật
- `allergen_name`: Tên dị nguyên
- `certainty_level`: Mức độ chắc chắn (suspected/confirmed)
- `clinical_manifestation`: Biểu hiện lâm sàng
- `severity_level`: Mức độ nghiêm trọng
- `reaction_type`: Loại phản ứng
- `discovered_date`: Ngày phát hiện
- `is_approved`: Đã được phê duyệt tự động

## 🚀 Cách sử dụng

### **Bước 1: Truy cập trang chi tiết thẻ dị ứng**

Có 2 cách:
1. **Quét QR code** → Nhấn link trong QR → Truy cập trang chi tiết
2. **Trực tiếp**: Truy cập `/allergy-cards/[id]`

### **Bước 2: Nhấn nút "Bổ sung thông tin"**

Trên trang chi tiết, nhấn nút màu xanh **"Bổ sung thông tin"** (nằm ở header hoặc trong phần Lịch sử bổ sung)

### **Bước 3: Xác thực mã thẻ**

Để bảo mật, hệ thống yêu cầu nhập **mã thẻ dị ứng** (có trên thẻ vật lý hoặc trong QR code)

Ví dụ: `AC-2024-000001`

### **Bước 4: Điền thông tin người bổ sung**

```
Họ và tên: Nguyễn Văn A *
Tổ chức/Bệnh viện: Bệnh viện ABC *
Vai trò/Chức danh: Bác sĩ
Số điện thoại: 0123456789
Email: bsA@hospital.com
```

### **Bước 5: Thông tin cơ sở y tế**

```
Tên cơ sở y tế: Bệnh viện ABC *
Khoa/Phòng: Khoa Cấp cứu
```

### **Bước 6: Chọn loại cập nhật**

- **Phát hiện dị ứng mới**: Khi phát hiện dị ứng mới
- **Cập nhật cơ sở y tế**: Cập nhật thông tin bệnh viện
- **Thông tin bổ sung**: Thông tin khác
- **Cập nhật mức độ nghiêm trọng**: Điều chỉnh mức độ

### **Bước 7: Thêm dị ứng mới (nếu chọn loại "Phát hiện dị ứng mới")**

Nhấn **"Thêm dị ứng"** và điền:

```
Tên dị nguyên: Amoxicillin *
Mức độ chắc chắn: Chắc chắn / Nghi ngờ *
Mức độ nghiêm trọng: Nghiêm trọng
Loại phản ứng: Sốc phản vệ
Ngày phát hiện: 18/11/2024
Biểu hiện lâm sàng: Phát ban toàn thân, khó thở...
```

Có thể thêm nhiều dị ứng bằng cách nhấn "Thêm dị ứng" nhiều lần.

### **Bước 8: Ghi chú và lý do**

```
Lý do bổ sung: Cấp cứu
Ghi chú chi tiết: Bệnh nhân nhập viện cấp cứu do sốc phản vệ sau khi dùng Amoxicillin...
```

### **Bước 9: Xác nhận và gửi**

Nhấn **"Bổ sung thông tin"** để hoàn tất.

## 📊 Xem lịch sử bổ sung

Trên trang chi tiết thẻ dị ứng, cuộn xuống phần **"Lịch sử bổ sung"** để xem:

### Timeline hiển thị:
- ✅ Thời gian bổ sung
- 👤 Người bổ sung (Tên, vai trò, tổ chức)
- 🏥 Cơ sở y tế nơi bổ sung
- 📝 Lý do và ghi chú
- 🔴 Danh sách dị ứng được bổ sung
- ✓ Trạng thái xác minh

### Màu sắc loại cập nhật:
- 🔴 **Đỏ**: Phát hiện dị ứng mới
- 🔵 **Xanh dương**: Cập nhật cơ sở y tế
- 🟢 **Xanh lá**: Thông tin bổ sung
- 🟠 **Cam**: Cập nhật mức độ nghiêm trọng

## 🔐 Bảo mật

### 1. **Xác thực mã thẻ**
Mọi người muốn bổ sung thông tin phải nhập đúng **mã thẻ dị ứng**. Điều này đảm bảo chỉ những người có quyền truy cập vào thẻ vật lý mới có thể bổ sung.

### 2. **Không cần đăng nhập**
Tính năng này là **public access** - không cần tài khoản. Điều này giúp các cơ sở y tế khác có thể nhanh chóng bổ sung thông tin trong trường hợp cấp cứu.

### 3. **Lưu thông tin người bổ sung**
Hệ thống lưu đầy đủ:
- Tên, tổ chức, vai trò
- Số điện thoại, email để liên hệ
- Thời gian bổ sung

### 4. **Xác minh sau**
Có trường `is_verified` cho phép chủ thẻ hoặc admin xác minh lại thông tin sau.

## 🔄 Tự động cập nhật

### Dị ứng được tự động thêm vào thẻ chính
Khi bổ sung dị ứng mới:
1. Dị ứng được lưu vào bảng `update_allergies`
2. Trigger tự động thêm vào bảng `card_allergies` (thẻ chính)
3. Dị ứng hiển thị ngay trong phần "Thông tin dị ứng" của thẻ

## 📁 Files liên quan

### Database:
- `supabase/allergy-card-updates-schema.sql` - Schema cho lịch sử bổ sung

### Types:
- `types/allergy-card.ts` - Thêm types cho update history

### API:
- `app/api/allergy-cards/[id]/updates/route.ts` - API GET/POST updates

### Pages:
- `app/allergy-cards/[id]/page.tsx` - Trang chi tiết (đã thêm hiển thị lịch sử)
- `app/allergy-cards/[id]/add-info/page.tsx` - Trang bổ sung thông tin (NEW)

## 🛠️ Migration Database

Để sử dụng tính năng này, cần chạy migration:

```sql
-- Chạy file:
supabase/allergy-card-updates-schema.sql
```

Hoặc truy cập Supabase Dashboard → SQL Editor → Paste nội dung file → Run

## 🎨 UI/UX

### Trang bổ sung thông tin:
- ✅ Xác thực mã thẻ bằng input đơn giản
- 📝 Form rõ ràng, dễ điền
- ➕ Thêm nhiều dị ứng một lúc
- 🎨 Màu sắc phân biệt loại cập nhật

### Hiển thị lịch sử:
- ⏱️ Timeline trực quan
- 🎯 Hiển thị đầy đủ thông tin
- 🏥 Phân biệt rõ cơ sở y tế
- ✓ Badge xác minh

## 💡 Use Cases

### **Case 1: Bệnh nhân đến cấp cứu tại bệnh viện khác**
1. Bác sĩ quét QR trên thẻ dị ứng
2. Xem thông tin dị ứng hiện có
3. Phát hiện dị ứng mới → Bổ sung ngay
4. Thông tin được lưu vào lịch sử
5. Bệnh viện cũ có thể xem lịch sử bổ sung

### **Case 2: Khám định kỳ tại phòng khám**
1. Bệnh nhân mang thẻ đến khám
2. Bác sĩ quét QR hoặc nhập mã thẻ
3. Xem lịch sử bổ sung từ các cơ sở khác
4. Cập nhật thông tin mới (nếu có)

### **Case 3: Theo dõi lịch sử y tế**
1. Bệnh nhân/Gia đình xem thẻ
2. Xem timeline đầy đủ các lần khám
3. Biết được bệnh viện nào đã khám
4. Thông tin dị ứng cập nhật liên tục

## ⚠️ Lưu ý

1. **Mã thẻ phải chính xác**: Không thể bổ sung nếu sai mã
2. **Thông tin bắt buộc**: Phải điền đầy đủ các trường có dấu (*)
3. **Không thể xóa sau khi bổ sung**: Lịch sử được lưu vĩnh viễn
4. **Auto-approve**: Dị ứng được tự động thêm vào thẻ (có thể thay đổi logic này nếu cần approval workflow)

## 🚀 Phát triển tiếp

### Tính năng có thể thêm:
1. ✅ **Xác minh bổ sung**: Cho phép admin/chủ thẻ xác minh lại
2. 📧 **Thông báo email**: Gửi email khi có bổ sung mới
3. 🔔 **Push notification**: Thông báo real-time
4. 📊 **Thống kê**: Báo cáo số lần bổ sung, cơ sở y tế
5. 🔒 **Phê duyệt**: Yêu cầu phê duyệt trước khi thêm dị ứng
6. 📱 **QR scanning**: Tích hợp camera scan QR trực tiếp

## 📞 Liên hệ hỗ trợ

Nếu có vấn đề khi sử dụng tính năng này, vui lòng liên hệ admin hệ thống.

---

**Phiên bản**: 1.0  
**Ngày tạo**: 18/11/2024  
**Tác giả**: AI Assistant

