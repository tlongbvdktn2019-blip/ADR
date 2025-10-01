# 🔧 Hướng dẫn sửa lỗi Allergy Cards

## 📋 Tóm tắt vấn đề
- Lỗi "column does not exist" khi chạy các file SQL
- Schema trong `data.md` khác với các file migration
- View `allergy_cards_with_details` bị lỗi

## ✅ Giải pháp (Chạy theo thứ tự)

### Bước 1: Xem cấu trúc hiện tại
```sql
-- File: VIEW-ALLERGY-SCHEMA.sql
-- Mục đích: Xem tất cả các cột trong bảng allergy_cards
```

### Bước 2: Sửa View
```sql
-- File: FIX-ALL-ALLERGY-ISSUES.sql
-- Mục đích: Tạo lại view với schema đúng
```

### Bước 3: Kiểm tra dữ liệu
```sql
-- File: SIMPLE-DATA-CHECK.sql  
-- Mục đích: Xem có bao nhiêu thẻ dị ứng
```

### Bước 4: Thêm dữ liệu test (nếu cần)
```sql
-- File: QUICK-TEST-ALLERGY.sql
-- Mục đích: Tạo 1 thẻ dị ứng test để kiểm tra
```

## 📊 Schema thực tế (từ data.md)

### Bảng `allergy_cards` có các cột:
- `id` - UUID primary key
- `card_code` - Mã thẻ (tự động)
- `patient_name` - Tên bệnh nhân
- `patient_id_number` - CMND/CCCD
- `patient_age` - Tuổi
- `patient_gender` - Giới tính
- `hospital_name` - Tên bệnh viện
- `department` - Khoa
- `doctor_name` - Tên bác sĩ
- `doctor_phone` - SĐT bác sĩ
- `issued_date` - Ngày cấp
- `issued_by_user_id` - User cấp thẻ
- `organization` - Tổ chức
- `qr_code_data` - Dữ liệu QR (NOT NULL)
- `qr_code_url` - URL QR code image
- `status` - Trạng thái (active/inactive/expired)
- `notes` - Ghi chú
- `created_at`, `updated_at` - Thời gian

### ❌ KHÔNG CÓ các cột sau:
- ~~`deleted_at`~~ (không có soft delete)
- ~~`patient_id`~~ (dùng `patient_id_number`)
- ~~`date_of_birth`~~ (dùng `patient_age`)
- ~~`gender`~~ (dùng `patient_gender`)
- ~~`google_drive_qr_url`~~ (migration chưa chạy)

## 🚀 Các file đã sửa

1. ✅ `FIX-VIEW-COLUMN-NAME.sql` - Comment out GRANT statements
2. ✅ `FIX-VIEW-COLUMN-NAME-NO-GRANTS.sql` - Không có GRANT
3. ✅ `SIMPLE-DATA-CHECK.sql` - Kiểm tra nhanh (đã sửa cột)
4. ✅ `CHECK-VIEW-DATA.sql` - Kiểm tra chi tiết (đã sửa cột)
5. ✅ `ADD-TEST-ALLERGY-CARD.sql` - Thêm dữ liệu test (đã sửa cột)
6. ✅ `QUICK-TEST-ALLERGY.sql` - Thêm dữ liệu nhanh (mới)
7. ✅ `VIEW-ALLERGY-SCHEMA.sql` - Xem schema (mới)
8. ✅ `FIX-ALL-ALLERGY-ISSUES.sql` - Sửa tất cả (mới, khuyến nghị)

## 💡 Khuyến nghị

**Chạy file này để sửa tất cả:**
```
FIX-ALL-ALLERGY-ISSUES.sql
```

Nếu kết quả là 0 records, chạy:
```
QUICK-TEST-ALLERGY.sql
```

## 📝 Ghi chú
- View đã được sửa để phù hợp với schema thực tế
- Đã loại bỏ tất cả tham chiếu đến cột không tồn tại
- Nếu muốn thêm Google Drive QR, cần chạy migration riêng


