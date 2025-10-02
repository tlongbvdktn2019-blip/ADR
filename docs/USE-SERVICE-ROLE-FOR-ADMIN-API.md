# 🔑 SỬ DỤNG SERVICE ROLE CHO ADMIN API

## Tại sao cần Service Role?

RLS policies đôi khi gây khó khăn với NextAuth. Cách đơn giản và chắc chắn nhất là:
- ✅ Dùng **Service Role Key** trong API (bypass RLS)
- ✅ Check quyền admin ở **Application Layer** (code)

---

## 📝 BƯỚC 1: Tạo Supabase Admin Client

Tạo file: **`lib/supabase-admin.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Supabase admin client với service role key
// Client này BYPASS tất cả RLS policies
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper: Verify admin
export async function verifyAdmin(userId: string): Promise<boolean> {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return user?.role === 'admin';
}
```

---

## 🔧 BƯỚC 2: Cập nhật API Routes

### File: `app/api/admin/departments/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { supabaseAdmin } from '@/lib/supabase-admin'; // Import admin client

// GET: Lấy danh sách đơn vị (Admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Dùng supabaseAdmin thay vì createClient()
    const { data: departments, error } = await supabaseAdmin
      .from('departments')
      .select('*')
      .order('name');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: departments
    });
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST: Tạo đơn vị mới (Admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, code, description, is_active = true } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tên đơn vị' },
        { status: 400 }
      );
    }

    // Dùng supabaseAdmin
    const { data: department, error } = await supabaseAdmin
      .from('departments')
      .insert({ name, code, description, is_active })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: department,
      message: 'Tạo đơn vị thành công'
    });
  } catch (error: any) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT: Cập nhật đơn vị (Admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu ID đơn vị' },
        { status: 400 }
      );
    }

    // Dùng supabaseAdmin
    const { data: department, error } = await supabaseAdmin
      .from('departments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: department,
      message: 'Cập nhật đơn vị thành công'
    });
  } catch (error: any) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Xóa đơn vị (Admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu ID đơn vị' },
        { status: 400 }
      );
    }

    // Dùng supabaseAdmin
    const { error } = await supabaseAdmin
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Xóa đơn vị thành công'
    });
  } catch (error: any) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 📋 BƯỚC 3: Cập nhật các file khác

Làm tương tự cho:

1. ✅ `app/api/admin/units/route.ts` - Thay tất cả `createClient()` → `supabaseAdmin`
2. ✅ `app/api/admin/contest/route.ts`
3. ✅ `app/api/admin/contest/[id]/route.ts`
4. ✅ `app/api/admin/contest/[id]/statistics/route.ts`
5. ✅ `app/api/admin/contest/[id]/submissions/route.ts`

---

## ⚙️ BƯỚC 4: Kiểm tra ENV Variables

Đảm bảo file `.env.local` có:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # KEY NÀY!
```

**⚠️ Service Role Key:**
- Lấy từ: Supabase Dashboard → Settings → API → `service_role` key
- **KHÔNG** commit lên Git!
- **KHÔNG** expose ở client-side!
- Chỉ dùng trong server-side API routes!

---

## 🔐 Bảo mật

### ✅ An toàn:
```typescript
// Server-side API route (Node.js runtime)
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  // Check auth FIRST
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Then use admin client
  const { data } = await supabaseAdmin.from('departments').insert(...);
}
```

### ❌ KHÔNG an toàn:
```typescript
// Client component - KHÔNG BAO GIỜ dùng service role key!
'use client';
const supabaseAdmin = createClient(url, SERVICE_ROLE_KEY); // ❌ WRONG!
```

---

## ✅ Ưu điểm của cách này

1. ✅ **Bypass RLS hoàn toàn** - Không cần lo về policies
2. ✅ **Rõ ràng** - Auth check ở code, dễ đọc
3. ✅ **Linh hoạt** - Có thể thêm logic phức tạp
4. ✅ **Chắc chắn hoạt động** - Không phụ thuộc RLS

---

## ⚠️ Nhược điểm

1. ⚠️ **Phải check auth manually** - Quên check = security hole
2. ⚠️ **Service key powerful** - Cần bảo mật cẩn thận
3. ⚠️ **Không dùng được RLS** - Mất một layer bảo mật

---

## 🎯 Khi nào nên dùng?

### Dùng Service Role khi:
- ✅ Admin API (đã có auth check)
- ✅ Background jobs
- ✅ Server-side operations
- ✅ Migrations/Scripts

### Dùng RLS policies khi:
- ✅ Public API (không cần auth)
- ✅ User-specific data
- ✅ Multi-tenant apps
- ✅ Complex permission logic

---

## 📚 Tham khảo

- [Supabase Service Role](https://supabase.com/docs/guides/api/api-keys#the-service_role-key)
- [RLS vs Service Role](https://supabase.com/docs/guides/auth/row-level-security)
- [NextAuth với Supabase](https://next-auth.js.org/adapters/supabase)

---

## ✅ Checklist

Sau khi cập nhật:

- [ ] Tạo `lib/supabase-admin.ts`
- [ ] Import vào các admin API routes
- [ ] Thay `createClient()` → `supabaseAdmin`
- [ ] Giữ auth check ở đầu mỗi route
- [ ] Test tất cả admin operations
- [ ] Verify SUPABASE_SERVICE_ROLE_KEY trong .env
- [ ] Đảm bảo .env.local không trong Git

---

**🎉 Xong! Admin API sẽ hoạt động mượt mà!**



