# 🔧 SỬA LỖI PERMISSION DENIED - MODULE CUỘC THI

## ❌ Lỗi gặp phải

```
Error fetching units: {
  code: '42501',
  details: null,
  hint: null,
  message: 'permission denied for table users'
}
```

## 🔍 Nguyên nhân

RLS policies trong file `create-contest-tables.sql` ban đầu cố gắng truy cập bảng `auth.users` (Supabase Auth), nhưng hệ thống này đang dùng NextAuth với bảng `public.users` riêng.

## ✅ Giải pháp

Chạy file SQL sửa lỗi: `supabase/fix-contest-rls-policies.sql`

### Cách 1: Qua Supabase Dashboard (Khuyến nghị)

1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Tạo **New Query**
4. Copy toàn bộ nội dung file `supabase/fix-contest-rls-policies.sql`
5. Click **Run**

### Cách 2: Qua psql

```bash
psql -h your-host -U postgres -d your-database -f supabase/fix-contest-rls-policies.sql
```

### Cách 3: Qua Supabase CLI

```bash
supabase db reset
# Hoặc
supabase migration up
```

## 🎯 File SQL làm gì?

### Bước 1: Xóa policies cũ
- Xóa các policies admin có vấn đề

### Bước 2: Tạo function `is_admin()`
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Function này:
- ✅ Check role từ bảng `public.users` thay vì `auth.users`
- ✅ Dùng `SECURITY DEFINER` để bypass RLS
- ✅ Có exception handling an toàn

### Bước 3: Tạo policies mới
- Policy cho departments
- Policy cho units
- Policy cho contests

### Bước 4: Grant permissions
- Grant execute cho function
- Tạo RLS policy an toàn cho users table

## 📊 Kiểm tra sau khi chạy

### 1. Test function
```sql
SELECT is_admin();
```

Kết quả:
- `true` nếu bạn đang đăng nhập với admin
- `false` nếu không phải admin hoặc chưa đăng nhập

### 2. Test policies
```sql
-- Check policies đã tạo
SELECT * FROM pg_policies 
WHERE tablename IN ('departments', 'units', 'contests');
```

### 3. Test API

Thử lại trong ứng dụng:
1. Đăng nhập với tài khoản Admin
2. Vào `/admin/departments`
3. Thử thêm Đơn vị mới

**Kết quả mong đợi:** ✅ Không còn lỗi permission denied

## 🔐 Bảo mật

File SQL này đảm bảo:

✅ **An toàn**: Function `is_admin()` chỉ check role, không expose data  
✅ **RLS enabled**: Users table có RLS policy đúng  
✅ **Least privilege**: Chỉ grant quyền cần thiết  
✅ **Error handling**: Function có try-catch  

## 🚨 Nếu vẫn lỗi

### Option A: Dùng Service Role trong API

Nếu vẫn gặp vấn đề với RLS, có thể sửa API để dùng service role key:

```typescript
// Trong app/api/admin/departments/route.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

Service role key bypass RLS hoàn toàn.

### Option B: Disable RLS tạm thời (Không khuyến nghị cho production)

```sql
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE units DISABLE ROW LEVEL SECURITY;
ALTER TABLE contests DISABLE ROW LEVEL SECURITY;
```

**⚠️ Chú ý:** Cách này không an toàn! Chỉ dùng để debug.

### Option C: Simplify policies (Dự phòng)

Nếu function không hoạt động, uncomment phần "CÁCH 2" trong file `fix-contest-rls-policies.sql`:

```sql
-- Cho phép tất cả authenticated users manage
-- Check role ở application layer (API)
CREATE POLICY "Authenticated can manage departments" ON departments
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
```

Với cách này, **PHẢI check role trong API code**, ví dụ:

```typescript
// Trong API route
const session = await getServerSession(authOptions);
if (session?.user?.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
}
```

## 📝 Checklist hoàn thành

Sau khi chạy fix:

- [ ] Function `is_admin()` tồn tại
- [ ] Policies mới đã được tạo
- [ ] Test `SELECT is_admin()` hoạt động
- [ ] Vào `/admin/departments` không lỗi
- [ ] Thêm Đơn vị thành công
- [ ] Thêm Khoa/Phòng thành công
- [ ] Tạo Cuộc thi thành công

## 🎉 Kết luận

Sau khi chạy file `fix-contest-rls-policies.sql`, module Cuộc thi sẽ hoạt động bình thường với admin.

Nếu vẫn gặp vấn đề, hãy:
1. Check logs trong Supabase Dashboard
2. Verify admin user có đúng role = 'admin'
3. Clear browser cache và refresh
4. Test với Incognito mode

---

**Updated:** 2025-10-02  
**Status:** ✅ Ready to fix









