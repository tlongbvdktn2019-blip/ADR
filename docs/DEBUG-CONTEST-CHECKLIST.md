# 🔍 CHECKLIST DEBUG CUỘC THI - KHÔNG VÀO ĐƯỢC

## ⚠️ VẤN ĐỀ HIỆN TẠI
Admin đã kích hoạt cuộc thi, đã có 70 câu hỏi trong ngân hàng, nhưng người dùng vẫn không vào được.

---

## 📋 BƯỚC KIỂM TRA CHI TIẾT

### **BƯỚC 1: Kiểm tra cột `status` và `is_public`**

**Trong Supabase Table Editor:**

1. Mở bảng `contests`
2. **Scroll sang PHẢI** để xem các cột:
   - `status` 
   - `is_public`
   - `start_date`
   - `end_date`

3. Kiểm tra giá trị:

| Cột | Giá trị PHẢI LÀ | Nếu SAI thì sửa |
|-----|-----------------|-----------------|
| `status` | **'active'** | Sửa thành 'active' |
| `is_public` | **true** (✓) | Sửa thành true |
| `start_date` | NULL hoặc < thời gian hiện tại | Xóa giá trị hoặc set về quá khứ |
| `end_date` | NULL hoặc > thời gian hiện tại | Xóa giá trị hoặc set về tương lai |

---

### **BƯỚC 2: Chạy SQL Query để kiểm tra**

Vào tab **SQL Editor** trong Supabase, chạy query này:

```sql
-- Kiểm tra chi tiết cuộc thi
SELECT 
  id,
  title,
  status,
  is_public,
  start_date,
  end_date,
  number_of_questions,
  created_at,
  CASE
    WHEN status != 'active' THEN '❌ Status không phải active'
    WHEN is_public != true THEN '❌ is_public không phải true'
    WHEN start_date > NOW() THEN '❌ Chưa bắt đầu'
    WHEN end_date < NOW() THEN '❌ Đã kết thúc'
    ELSE '✅ OK - Cuộc thi hợp lệ'
  END as check_result
FROM contests
WHERE title = 'Kiến thức ADR';
```

**Kết quả mong đợi:**
- `check_result = '✅ OK - Cuộc thi hợp lệ'`

**Nếu thấy ❌:**
- Chạy query sửa lỗi bên dưới

---

### **BƯỚC 3: Fix tất cả vấn đề (nếu có)**

```sql
-- Fix cuộc thi "Kiến thức ADR"
UPDATE contests
SET 
  status = 'active',
  is_public = true,
  start_date = NULL,  -- Hoặc set về quá khứ: '2024-01-01'
  end_date = NULL     -- Hoặc set về tương lai: '2025-12-31'
WHERE title = 'Kiến thức ADR';

-- Kiểm tra lại
SELECT * FROM contests WHERE title = 'Kiến thức ADR';
```

---

### **BƯỚC 4: Kiểm tra API có trả về cuộc thi không**

**Cách 1: Dùng trình duyệt**
```
Mở trình duyệt mới (Incognito)
Truy cập: https://your-domain.com/api/contest/active
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": {
    "id": "7286bfd2-97f4-429b-808a-d554a48f50df",
    "title": "Kiến thức ADR",
    "status": "active",
    "is_public": true,
    ...
  }
}
```

**Nếu thấy:**
```json
{
  "success": true,
  "data": null
}
```
→ Cuộc thi KHÔNG đạt điều kiện hiển thị → Quay lại BƯỚC 3

---

### **BƯỚC 5: Kiểm tra RLS Policies**

Nếu vẫn không được, chạy SQL này để fix RLS:

```sql
-- 1. Kiểm tra policies hiện tại
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'contests';

-- 2. Drop và tạo lại policy cho contests
DROP POLICY IF EXISTS "Public can read active contests" ON contests;
DROP POLICY IF EXISTS "Public read active contests v2" ON contests;
DROP POLICY IF EXISTS "contests_select_policy" ON contests;

-- 3. Tạo policy mới
CREATE POLICY "public_read_active_contests" ON contests
  FOR SELECT 
  USING (status = 'active' AND is_public = true);

-- 4. Verify
SELECT * FROM contests WHERE status = 'active' AND is_public = true;
```

---

### **BƯỚC 6: Test từ phía người dùng**

1. Mở trình duyệt **Incognito/Private**
2. Truy cập: `https://your-domain.com/contest`
3. Kiểm tra:
   - ✅ Có hiển thị cuộc thi "Kiến thức ADR"
   - ✅ Có thể đăng ký
   - ✅ Có thể làm bài

---

## 🚨 CÁC LỖI THƯỜNG GẶP VÀ NGUYÊN NHÂN

### **Lỗi 1: Cuộc thi không hiển thị**

**Nguyên nhân có thể:**
- ❌ `status != 'active'` (có thể là 'draft', 'ended', 'cancelled')
- ❌ `is_public = false` hoặc NULL
- ❌ `start_date` trong tương lai
- ❌ `end_date` trong quá khứ

**Cách fix:**
→ Chạy query ở BƯỚC 3

---

### **Lỗi 2: Lỗi "Cuộc thi không tồn tại" khi đăng ký**

**Nguyên nhân:**
- API `/api/contest/active` không trả về cuộc thi
- RLS policy chặn truy cập

**Cách fix:**
→ Chạy query ở BƯỚC 5

---

### **Lỗi 3: Database schema không khớp**

**Nguyên nhân:**
- Có thể thiếu cột `is_public` trong database thực tế

**Cách kiểm tra:**
```sql
-- Xem cấu trúc bảng
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'contests'
ORDER BY ordinal_position;
```

**Nếu thiếu cột `is_public`:**
```sql
-- Thêm cột is_public
ALTER TABLE contests 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Update tất cả cuộc thi cũ
UPDATE contests SET is_public = true WHERE is_public IS NULL;
```

---

## 🎯 QUICK FIX - CHẠY NGAY

Nếu muốn fix nhanh, chạy toàn bộ script này:

```sql
-- ==================================================
-- QUICK FIX: Sửa tất cả vấn đề cuộc thi không vào được
-- ==================================================

-- 1. Thêm cột is_public nếu chưa có
ALTER TABLE contests 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 2. Fix cuộc thi hiện tại
UPDATE contests
SET 
  status = 'active',
  is_public = true,
  start_date = NULL,
  end_date = NULL
WHERE title LIKE '%Kiến thức ADR%' OR title LIKE '%ADR%';

-- 3. Fix RLS policy
DROP POLICY IF EXISTS "Public can read active contests" ON contests;
DROP POLICY IF EXISTS "Public read active contests v2" ON contests;
DROP POLICY IF EXISTS "contests_select_policy" ON contests;

CREATE POLICY "public_read_active_contests" ON contests
  FOR SELECT 
  USING (status = 'active' AND is_public = true);

-- 4. Kiểm tra kết quả
SELECT 
  id,
  title,
  status,
  is_public,
  start_date,
  end_date,
  number_of_questions,
  CASE
    WHEN status != 'active' THEN '❌ Status không active'
    WHEN is_public != true THEN '❌ is_public không true'
    WHEN start_date > NOW() THEN '❌ Chưa bắt đầu'
    WHEN end_date < NOW() THEN '❌ Đã kết thúc'
    ELSE '✅ OK'
  END as status_check
FROM contests;

-- 5. Test API query
SELECT * FROM contests 
WHERE status = 'active' 
  AND is_public = true
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW());
```

---

## 📞 NẾU VẪN KHÔNG ĐƯỢC

1. **Chụp ảnh các cột:**
   - `id`, `title`, `status`, `is_public`, `start_date`, `end_date`
   
2. **Copy kết quả query:**
   - Query kiểm tra ở BƯỚC 2
   - Query test API ở phần Quick Fix
   
3. **Kiểm tra Console log:**
   - Mở Developer Tools (F12)
   - Tab Console
   - Xem có lỗi gì khi truy cập `/contest`

---

**Thời gian cập nhật:** 31/10/2025
**Version:** 2.0

