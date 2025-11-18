# 🔓 HƯỚNG DẪN THIẾT LẬP PUBLIC ACCESS CHO THẺ DỊ ỨNG

## 🎯 Mục đích

Cho phép **bất kỳ ai** (không cần đăng nhập) có thể:
- ✅ Xem thông tin thẻ dị ứng khi quét QR code
- ✅ Xem lịch sử bổ sung của thẻ
- ✅ Bổ sung thông tin mới (sau khi xác thực mã thẻ)

## 📋 Yêu cầu

- Quyền truy cập Supabase Dashboard
- Database đã có sẵn schema cho allergy cards và updates

## 🚀 BƯỚC 1: Chạy Migration Enable Public Access

### Cách 1: Qua Supabase Dashboard (Khuyến nghị)

1. Truy cập **Supabase Dashboard** của dự án
2. Vào **SQL Editor** (menu bên trái)
3. Tạo query mới
4. Copy toàn bộ nội dung file:
   ```
   supabase/ENABLE-PUBLIC-ACCESS-ALLERGY-UPDATES.sql
   ```
5. Paste vào SQL Editor
6. Nhấn **RUN** hoặc **Ctrl + Enter**

### Cách 2: Qua Command Line (nếu dùng Supabase CLI)

```bash
supabase db push --file supabase/ENABLE-PUBLIC-ACCESS-ALLERGY-UPDATES.sql
```

### ✅ Kết quả mong đợi

Sau khi chạy thành công, bạn sẽ thấy:
```
✅ Public access enabled for allergy card updates!
Bây giờ có thể xem và bổ sung thông tin thẻ dị ứng mà KHÔNG CẦN đăng nhập
```

## 🔍 BƯỚC 2: Kiểm tra Public Access đã hoạt động

Chạy file test:

1. Vào **SQL Editor**
2. Copy nội dung file:
   ```
   supabase/TEST-PUBLIC-ACCESS.sql
   ```
3. Paste và chạy
4. Kiểm tra kết quả

### Kết quả mong đợi:

#### 1. RLS đã enable:
```
tablename                  | rls_enabled
---------------------------+------------
allergy_cards              | true
card_allergies             | true
allergy_card_updates       | true
update_allergies           | true
```

#### 2. Policies đã tạo:
```
tablename                  | policyname                           | command | access_level
---------------------------+--------------------------------------+---------+-------------
allergy_cards              | Public can view allergy cards        | SELECT  | PUBLIC ACCESS
card_allergies             | Public can view card allergies       | SELECT  | PUBLIC ACCESS
allergy_card_updates       | Public can view allergy card updates | SELECT  | PUBLIC ACCESS
allergy_card_updates       | Public can insert allergy card...    | INSERT  | PUBLIC ACCESS
update_allergies           | Public can view update allergies     | SELECT  | PUBLIC ACCESS
update_allergies           | Public can insert update allergies   | INSERT  | PUBLIC ACCESS
```

## 🧪 BƯỚC 3: Test thực tế trên Web App

### Test 1: Xem thẻ dị ứng (không cần đăng nhập)

1. **Mở browser ở chế độ Incognito/Private** (để đảm bảo không có session)
2. Truy cập URL: 
   ```
   https://your-domain.com/allergy-cards/[id]
   ```
   (thay `[id]` bằng ID thẻ thực tế)
3. **Kết quả mong đợi**: Trang hiển thị thông tin thẻ, không redirect về login

### Test 2: Xem lịch sử bổ sung

1. Ở trang chi tiết thẻ (từ Test 1)
2. Cuộn xuống phần **"Lịch sử bổ sung"**
3. **Kết quả mong đợi**: Hiển thị timeline lịch sử (hoặc "Chưa có lịch sử")

### Test 3: Bổ sung thông tin

1. Nhấn nút **"Bổ sung thông tin"** (màu xanh)
2. Nhập **mã thẻ** (ví dụ: `AC-2024-000001`)
3. Nhấn **"Xác thực"**
4. Điền form:
   - Họ tên: `Test User`
   - Tổ chức: `Bệnh viện Test`
   - Cơ sở y tế: `Bệnh viện Test`
   - Loại cập nhật: `Phát hiện dị ứng mới`
5. Thêm dị ứng:
   - Nhấn **"Thêm dị ứng"**
   - Tên dị nguyên: `Test Allergen`
   - Mức độ chắc chắn: `Chắc chắn`
6. Nhấn **"Bổ sung thông tin"**
7. **Kết quả mong đợi**: 
   - Toast thông báo thành công
   - Redirect về trang chi tiết thẻ
   - Lịch sử bổ sung hiển thị bản cập nhật mới

## ⚠️ XỬ LÝ LỖI

### Lỗi 1: "Error fetching data" khi xem thẻ

**Nguyên nhân**: RLS policies chưa được apply

**Giải pháp**:
1. Chạy lại file `ENABLE-PUBLIC-ACCESS-ALLERGY-UPDATES.sql`
2. Kiểm tra policies bằng `TEST-PUBLIC-ACCESS.sql`
3. Restart Supabase connection (nếu dùng local)

### Lỗi 2: "403 Forbidden" khi bổ sung thông tin

**Nguyên nhân**: Insert policies chưa có

**Giải pháp**:
1. Kiểm tra policies với query:
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename IN ('allergy_card_updates', 'update_allergies')
   AND cmd = 'INSERT';
   ```
2. Nếu không có policies, chạy lại migration
3. Clear cache trình duyệt và thử lại

### Lỗi 3: "Cannot read allergy_card_updates_with_details view"

**Nguyên nhân**: View chưa có permissions cho anon role

**Giải pháp**:
```sql
GRANT SELECT ON allergy_card_updates_with_details TO anon;
GRANT SELECT ON allergy_card_updates_with_details TO authenticated;
```

### Lỗi 4: Trigger không tự động thêm dị ứng vào thẻ chính

**Nguyên nhân**: Trigger bị lỗi hoặc chưa có

**Giải pháp**:
1. Chạy file: `supabase/FIX-allergy-card-updates-trigger.sql`
2. Kiểm tra trigger:
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgname = 'trigger_auto_add_approved_allergies';
   ```

## 🔒 BẢO MẬT

### Các biện pháp bảo mật đã implement:

✅ **Xác thực mã thẻ**: 
- API yêu cầu `card_code` chính xác trước khi cho phép bổ sung
- Chỉ người có thẻ vật lý hoặc biết mã mới bổ sung được

✅ **Lưu thông tin người bổ sung**:
- Tên, tổ chức, vai trò, SĐT, email
- Có thể liên hệ lại nếu cần

✅ **Không thể xóa/sửa lịch sử**:
- Public chỉ có quyền SELECT và INSERT
- Không có UPDATE/DELETE

✅ **Xác minh sau**:
- Có trường `is_verified` cho admin/chủ thẻ xác minh

### Những gì KHÔNG được phép:

❌ Sửa/xóa thông tin bệnh nhân  
❌ Sửa/xóa lịch sử bổ sung  
❌ Tạo thẻ mới (cần login với quyền admin)  
❌ Xóa thẻ (cần login với quyền admin)

## 📊 Monitoring

### Kiểm tra hoạt động:

```sql
-- Xem số lượng bổ sung theo ngày
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_updates,
  COUNT(DISTINCT card_id) as unique_cards
FROM allergy_card_updates
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

-- Xem các bổ sung gần đây
SELECT 
  updated_by_name,
  updated_by_organization,
  facility_name,
  update_type,
  created_at
FROM allergy_card_updates
ORDER BY created_at DESC
LIMIT 20;
```

## 📝 Rollback (nếu cần)

Nếu cần tắt public access:

```sql
-- Xóa public policies
DROP POLICY IF EXISTS "Public can view allergy cards" ON allergy_cards;
DROP POLICY IF EXISTS "Public can view card allergies" ON card_allergies;
DROP POLICY IF EXISTS "Public can view allergy card updates" ON allergy_card_updates;
DROP POLICY IF EXISTS "Public can insert allergy card updates" ON allergy_card_updates;
DROP POLICY IF EXISTS "Public can view update allergies" ON update_allergies;
DROP POLICY IF EXISTS "Public can insert update allergies" ON update_allergies;

-- Revoke permissions trên view
REVOKE SELECT ON allergy_card_updates_with_details FROM anon;
```

## ✅ Checklist hoàn thành

- [ ] Đã chạy file `ENABLE-PUBLIC-ACCESS-ALLERGY-UPDATES.sql`
- [ ] Đã chạy file `TEST-PUBLIC-ACCESS.sql` và kiểm tra kết quả
- [ ] Test xem thẻ không cần login ✓
- [ ] Test xem lịch sử ✓
- [ ] Test bổ sung thông tin ✓
- [ ] Dị ứng tự động thêm vào thẻ chính ✓
- [ ] Lịch sử hiển thị đúng ✓

## 🎉 Hoàn tất!

Sau khi hoàn thành tất cả các bước trên, hệ thống thẻ dị ứng của bạn đã sẵn sàng cho **public access**!

Bất kỳ ai quét QR code hoặc biết ID thẻ đều có thể:
- Xem thông tin dị ứng
- Xem lịch sử bổ sung
- Bổ sung thông tin mới (với mã thẻ hợp lệ)

---

**Lưu ý**: Tính năng này được thiết kế đặc biệt cho các tình huống cấp cứu, khi bệnh nhân đến khám ở bệnh viện khác và cần bổ sung thông tin nhanh chóng.

**Version**: 1.0  
**Ngày tạo**: 18/11/2024

