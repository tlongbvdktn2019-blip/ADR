# Hướng dẫn sửa lỗi trường "Nhóm thuốc điều trị" không hiển thị trong form public

## Vấn đề
Trong form báo cáo công khai (public report form), trường **"Nhóm thuốc điều trị"** không hiển thị danh sách lựa chọn từ bảng `treatment_drugs`.

## Nguyên nhân
1. Bảng `treatment_drugs` có thể đang bị chặn bởi Row Level Security (RLS) policy
2. Bảng `treatment_drugs` có thể không có dữ liệu
3. API public không có quyền truy cập vào bảng

## Giải pháp

### Bước 1: Chạy Migration SQL

Có 2 cách để chạy migration:

#### Cách 1: Sử dụng Supabase CLI (Khuyên dùng)
```bash
# Chạy từ thư mục gốc của project
supabase db push
```

#### Cách 2: Chạy trực tiếp trong Supabase Dashboard
1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor** ở sidebar bên trái
4. Copy toàn bộ nội dung từ file `supabase/migrations/fix_treatment_drugs_public_access.sql`
5. Paste vào SQL Editor và click **Run**

File migration này sẽ:
- Disable RLS trên bảng `treatment_drugs` (vì đây là bảng tham chiếu/lookup table)
- Thêm dữ liệu mẫu nếu bảng đang trống
- Thêm 20 nhóm thuốc điều trị phổ biến

### Bước 2: Kiểm tra dữ liệu

Chạy query sau trong SQL Editor để kiểm tra:
```sql
SELECT * FROM treatment_drugs ORDER BY name;
```

Bạn sẽ thấy danh sách các nhóm thuốc như:
- Thuốc kháng sinh
- Thuốc giảm đau
- Thuốc hạ sốt
- Thuốc chống viêm
- ...

### Bước 3: Test lại form public

1. Mở form báo cáo công khai: `/public-report`
2. Điền thông tin cho đến **Phần C - Thuốc nghi ngờ gây ADR**
3. Kiểm tra trường **"Nhóm thuốc điều trị"**
4. Dropdown sẽ hiển thị danh sách các nhóm thuốc

### Bước 4: Kiểm tra Console Logs

Mở Developer Console (F12) trong browser và xem logs:
- ✅ `Successfully fetched treatment drugs: X` - Thành công
- ⚠️ `No treatment drugs found in database` - Bảng trống
- ❌ `Failed to fetch treatment drugs` - Lỗi API

## Thay đổi kỹ thuật

### 1. Migration SQL mới
- **File**: `supabase/migrations/fix_treatment_drugs_public_access.sql`
- Disable RLS cho bảng `treatment_drugs`
- Insert dữ liệu mẫu nếu bảng trống

### 2. Cải thiện API
- **File**: `app/api/public/treatment-drugs/route.ts`
- Thêm debug logging chi tiết
- Trả về chi tiết lỗi để dễ dàng troubleshoot

### 3. Cải thiện Component
- **File**: `components/forms/SuspectedDrugsSection.tsx`
- Thêm state để track lỗi
- Hiển thị thông báo lỗi cho người dùng
- Hiển thị loading state
- Console logging để debug

## Troubleshooting

### Vấn đề: Vẫn không hiển thị dropdown sau khi chạy migration

**Giải pháp:**
1. Kiểm tra console logs trong browser (F12)
2. Kiểm tra server logs (nếu chạy local)
3. Kiểm tra lại Supabase RLS policies:
```sql
-- Kiểm tra RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'treatment_drugs';

-- Nếu rowsecurity = true, disable nó:
ALTER TABLE treatment_drugs DISABLE ROW LEVEL SECURITY;
```

### Vấn đề: API trả về lỗi 500

**Giải pháp:**
1. Kiểm tra Supabase Service Role Key có đúng không trong `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
2. Kiểm tra bảng `treatment_drugs` có tồn tại không:
```sql
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'treatment_drugs'
);
```

### Vấn đề: Dropdown hiển thị nhưng không có options

**Giải pháp:**
1. Chạy lại phần insert data trong migration
2. Hoặc thêm dữ liệu thủ công:
```sql
INSERT INTO treatment_drugs (name) VALUES 
('Thuốc kháng sinh'),
('Thuốc giảm đau'),
('Thuốc hạ sốt')
-- ... thêm các loại khác
;
```

## Thêm nhóm thuốc mới

Để thêm nhóm thuốc mới vào danh sách:
```sql
INSERT INTO treatment_drugs (name) VALUES ('Tên nhóm thuốc mới');
```

Hoặc tạo API endpoint cho admin để quản lý (khuyên dùng cho sau này).

## Lưu ý

- Bảng `treatment_drugs` là bảng tham chiếu/lookup, không cần RLS
- Dữ liệu trong bảng này nên được quản lý bởi admin
- Form public chỉ đọc dữ liệu, không ghi vào bảng này
- Nếu muốn bảo mật hơn, có thể enable RLS và tạo policy cho phép SELECT public

## Kiểm tra hoàn tất

✅ Migration đã chạy thành công  
✅ Bảng `treatment_drugs` có dữ liệu  
✅ API `/api/public/treatment-drugs` trả về 200 OK  
✅ Dropdown trong form public hiển thị danh sách  
✅ Console không có lỗi  

---

**Ngày tạo**: 2025-10-05  
**Liên quan**: `ADD-TREATMENT-DRUG-GROUP-GUIDE.md`



