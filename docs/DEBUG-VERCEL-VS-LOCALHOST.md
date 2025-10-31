# 🔍 DEBUG: Tại sao Localhost hoạt động nhưng Vercel không?

## ❌ VẤN ĐỀ

- ✅ Localhost: Vào được cuộc thi
- ❌ Vercel: Không vào được cuộc thi

---

## 🎯 NGUYÊN NHÂN THƯỜNG GẶP

### **1. Environment Variables khác nhau**

**Vấn đề:**
- Localhost dùng `.env.local`
- Vercel dùng environment variables riêng
- Có thể Vercel đang connect đến Supabase khác hoặc thiếu variables

**Cách kiểm tra:**
1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project → Settings → Environment Variables
3. Kiểm tra có đủ:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

**Cách fix:**
- Đảm bảo các env vars trên Vercel GIỐNG HỆT với `.env.local`
- Sau khi sửa → Redeploy

---

### **2. RLS Policies chặn anonymous users**

**Vấn đề:**
- API đang dùng `createClient()` - client cho anonymous users
- RLS policies trên Production có thể khác với Local
- Supabase Production enforce RLS chặt chẽ hơn Local

**Cách kiểm tra:**
Chạy query này trong Supabase SQL Editor:

```sql
-- Test as anonymous user (giống production)
SELECT * FROM contests 
WHERE status = 'active' 
  AND is_public = true;
```

**Nếu không trả về gì** → RLS chặn

**Cách fix:**
Đã có trong script `fix-contest-complete.sql` (đã chạy rồi), nhưng có thể cần chạy lại:

```sql
-- Recreate policy
DROP POLICY IF EXISTS "allow_public_read_contests" ON contests;

CREATE POLICY "allow_public_read_contests" ON contests
  FOR SELECT 
  TO anon, authenticated  -- ← Thêm TO anon
  USING (
    status = 'active' 
    AND is_public = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );
```

---

### **3. Vercel Cache cũ**

**Vấn đề:**
- Vercel có thể cache API response cũ
- Code mới deploy nhưng vẫn trả về data cũ

**Cách fix:**
1. Mở [Vercel Dashboard](https://vercel.com/dashboard)
2. Project → Deployments → Latest deployment
3. Click **"..."** → **Redeploy**
4. Chọn **"Redeploy with existing Build Cache cleared"**

---

### **4. Database Connection khác nhau**

**Vấn đề:**
- Localhost kết nối đến Supabase Project A
- Vercel kết nối đến Supabase Project B (hoặc staging)
- Script SQL chỉ chạy trên Project A

**Cách kiểm tra:**
1. Log `NEXT_PUBLIC_SUPABASE_URL` trên cả local và Vercel
2. Đảm bảo trỏ đến CÙNG 1 Supabase project

**Trong API route, thêm log:**
```typescript
console.log('🔗 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

---

### **5. API Route không được deploy đúng**

**Vấn đề:**
- Code mới push lên GitHub
- Vercel build thành công
- Nhưng API route vẫn là code cũ

**Cách kiểm tra:**
Xem build logs trên Vercel, tìm:
```
Building...
✓ app/api/contest/active/route.ts
```

**Cách fix:**
- Force redeploy (xem phần 3)
- Hoặc push 1 commit dummy:
  ```bash
  git commit --allow-empty -m "trigger rebuild"
  git push
  ```

---

## ✅ CÁCH DEBUG NHANH

### **BƯỚC 1: Thêm debug logging vào API**

File: `app/api/contest/active/route.ts`

```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const now = new Date().toISOString();
    
    // DEBUG: Log environment
    console.log('🌍 Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serverTime: now
    });
    
    const { data: contests, error } = await supabase
      .from('contests')
      .select('*')
      .eq('status', 'active')
      .eq('is_public', true);

    // DEBUG: Log results
    console.log('📊 Query results:', {
      found: contests?.length || 0,
      error: error?.message || 'none',
      contests: contests
    });

    // ... rest of code
  }
}
```

### **BƯỚC 2: Xem logs trên Vercel**

1. Vào Vercel Dashboard → Project → Logs
2. Filter by: **"Functions"**
3. Truy cập API: `/api/contest/active`
4. Xem logs real-time

**Tìm:**
- ❌ Lỗi database connection
- ❌ RLS policy denied
- ❌ Environment variables missing

---

## 🔧 FIX NGAY BÂY GIỜ

### **FIX 1: Chạy lại SQL script đầy đủ**

Có thể RLS policies trên production chưa được apply đúng. Chạy script này:

```sql
-- Fix RLS policies với TO anon, authenticated
DROP POLICY IF EXISTS "allow_public_read_contests" ON contests;

CREATE POLICY "allow_public_read_contests" ON contests
  FOR SELECT 
  TO anon, authenticated  -- ← Quan trọng!
  USING (
    status = 'active' 
    AND is_public = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Verify
SELECT 
  policyname,
  roles,
  qual
FROM pg_policies
WHERE tablename = 'contests' AND policyname = 'allow_public_read_contests';

-- Test as anon user
SET ROLE anon;
SELECT * FROM contests WHERE status = 'active' AND is_public = true;
RESET ROLE;
```

### **FIX 2: Kiểm tra Vercel Environment Variables**

```bash
# Liệt kê env vars (local)
cat .env.local

# So sánh với Vercel
# Vào: https://vercel.com/your-team/adr-liart/settings/environment-variables
```

Đảm bảo Vercel có:
```
NEXT_PUBLIC_SUPABASE_URL=https://wnkwqzwyunprmchdru.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### **FIX 3: Clear cache và redeploy**

```bash
# Push empty commit to trigger rebuild
git commit --allow-empty -m "chore: trigger rebuild for contest fix"
git push
```

Hoặc trong Vercel Dashboard:
1. Deployments → Latest
2. **"..."** → Redeploy
3. ✅ Clear Build Cache

---

## 📸 CHO TÔI BIẾT

Sau khi thử các fix trên, hãy gửi cho tôi:

1. **Screenshot Vercel Logs** khi truy cập `/api/contest/active`
2. **Screenshot Vercel Environment Variables** (che sensitive data)
3. **Kết quả của query test RLS** (phần FIX 1)

Tôi sẽ biết chính xác vấn đề là gì!

---

**Cập nhật:** 31/10/2025  
**Version:** 1.0

