# 🔧 Troubleshooting: User API Keys Feature

## 📝 Lịch sử các lỗi đã sửa

### **Lỗi 1: Service không thể gọi Supabase từ client-side**

**Triệu chứng:**
```
Error: Failed to fetch API keys
Cannot access database from client
```

**Nguyên nhân:**
- `UserAPIKeyService` gọi trực tiếp Supabase từ browser
- Client không có permission truy cập database trực tiếp

**Giải pháp:**
- ✅ Tách thành 2 services:
  - `UserAPIKeyService` (client) → Gọi API endpoints
  - `UserAPIKeyServer` (server) → Truy cập database
- ✅ Client chỉ dùng `fetch()` để gọi API

**Files thay đổi:**
- `lib/user-api-key-service.ts` (modified)
- `lib/user-api-key-server.ts` (new)

---

### **Lỗi 2: User not found (PGRST116)**

**Triệu chứng:**
```
code: 'PGRST116'
message: 'Cannot coerce the result to a single JSON object'
Error: User not found
```

**Nguyên nhân:**
- User đăng nhập nhưng chưa tồn tại trong bảng `users`
- API endpoints tìm user theo email nhưng không có

**Giải pháp:**
- ✅ Tạo helper function `getOrCreateUser()`
- ✅ Tự động tạo user khi đăng nhập lần đầu
- ✅ Trả về UUID thay vì dùng email

**Files thay đổi:**
- `lib/get-or-create-user.ts` (new)
- `app/api/user/api-keys/route.ts` (modified)
- `app/api/user/api-keys/[id]/route.ts` (modified)
- `app/api/user/api-keys/[id]/test/route.ts` (modified)

---

### **Lỗi 3: RLS Policy Violation (42501)**

**Triệu chứng:**
```
code: '42501'
message: 'new row violates row-level security policy for table "users"'
Error: Failed to create user
```

**Nguyên nhân:**
- Row Level Security (RLS) chặn việc insert vào bảng `users`
- Regular Supabase client không có quyền bypass RLS

**Giải pháp:**
- ✅ Sử dụng **Supabase Service Role Key**
- ✅ Admin client có quyền bypass RLS
- ✅ Tạo user thành công

**Files thay đổi:**
- `lib/get-or-create-user.ts` (modified)

**Code thay đổi:**
```typescript
// CŨ (Lỗi):
const supabase = createServerComponentClient({ cookies })
// ❌ Bị chặn bởi RLS

// MỚI (Đúng):
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
// ✅ Bypass RLS với Service Role
```

---

## ✅ Trạng thái hiện tại

### **Kiến trúc hoàn chỉnh:**

```
┌─────────────────────────────────────────────────┐
│ Client Component (React)                        │
│ components/settings/APIKeyManager.tsx           │
└────────────────┬────────────────────────────────┘
                 │ fetch()
                 ↓
┌─────────────────────────────────────────────────┐
│ Client Service                                  │
│ lib/user-api-key-service.ts                    │
│ - getUserAPIKeys()                              │
│ - addAPIKey()                                   │
│ - updateAPIKey()                                │
│ - deleteAPIKey()                                │
│ - testAPIKey()                                  │
└────────────────┬────────────────────────────────┘
                 │ HTTP Requests
                 ↓
┌─────────────────────────────────────────────────┐
│ API Endpoints                                   │
│ /api/user/api-keys/*                           │
│ - GET /api/user/api-keys                       │
│ - POST /api/user/api-keys                      │
│ - PUT /api/user/api-keys/[id]                  │
│ - DELETE /api/user/api-keys/[id]               │
│ - POST /api/user/api-keys/[id]/test            │
└────────────────┬────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────┐
│ Helper: Get/Create User                         │
│ lib/get-or-create-user.ts                      │
│ getUserIdFromSession(session)                   │
│   ↓                                             │
│ getOrCreateUser(email, name)                    │
│   ├─ Find user → Return UUID                    │
│   └─ Not found → Create user → Return UUID      │
└────────────────┬────────────────────────────────┘
                 │ Uses Supabase Admin
                 ↓
┌─────────────────────────────────────────────────┐
│ Server Service                                  │
│ lib/user-api-key-server.ts                     │
│ - getUserAPIKeys(userId)                        │
│ - addAPIKey(userId, keyInput)                   │
│ - updateAPIKey(userId, keyId, updates)          │
│ - deleteAPIKey(userId, keyId)                   │
│ - testAPIKey(userId, keyId)                     │
│ - encryptAPIKey() / decryptAPIKey()             │
└────────────────┬────────────────────────────────┘
                 │ Supabase Admin Client
                 │ (Service Role Key)
                 ↓
┌─────────────────────────────────────────────────┐
│ Supabase Database                               │
│ - users (with RLS)                              │
│ - user_ai_keys (with RLS)                       │
│ - user_ai_usage (with RLS)                      │
└─────────────────────────────────────────────────┘
```

### **Flow tạo user lần đầu:**

```
1. User login → Session created
   ↓
2. User truy cập /settings
   ↓
3. Frontend gọi: GET /api/user/api-keys
   ↓
4. API endpoint: getUserIdFromSession(session)
   ↓
5. Helper: getOrCreateUser(email, name)
   ├─ Query users table
   ├─ User không tồn tại?
   └─ → Create user với Service Role Key (bypass RLS)
   ↓
6. Return user UUID
   ↓
7. Load API keys của user
   ↓
8. Return data cho frontend
```

---

## 🔑 Environment Variables cần thiết

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=random-32-char-string

# Supabase (QUAN TRỌNG!)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # ← CẦN THIẾT để bypass RLS

# AI Chatbot (Optional)
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-proj...
```

**⚠️ QUAN TRỌNG:**
- `SUPABASE_SERVICE_ROLE_KEY` là **bắt buộc** để tạo user
- Đây là secret key, **không được public**
- Có thể lấy từ: Supabase Dashboard → Settings → API → service_role

---

## 🧪 Cách test

### **Test 1: User auto-creation**

1. Đăng nhập lần đầu với email mới
2. Vào `/settings`
3. Kiểm tra console log: `Creating new user: [email]`
4. Kiểm tra console log: `New user created: [uuid]`
5. Không thấy lỗi

**Kết quả mong đợi:**
```
✅ Trang Settings load thành công
✅ Tab "API Keys" hiển thị
✅ Message: "Chưa có API key nào"
```

### **Test 2: Add API key**

1. Nhấn "Thêm API Key"
2. Chọn provider: Gemini
3. Paste API key
4. Nhấn "Thêm API Key"

**Kết quả mong đợi:**
```
✅ Toast: "Đã thêm API key thành công!"
✅ Key xuất hiện trong danh sách
✅ Status: "Chưa kiểm tra"
```

### **Test 3: Test API key**

1. Nhấn nút "Test" bên cạnh key
2. Đợi 5-10 giây

**Kết quả mong đợi:**
```
✅ Status thay đổi thành "Hoạt động tốt" (nếu key hợp lệ)
✅ Hiển thị thời gian test
✅ Có thể xem chi tiết test result
```

---

## 🆘 Common Errors

### **Error: "Missing Supabase credentials"**

**Nguyên nhân:**
- Thiếu `NEXT_PUBLIC_SUPABASE_URL` hoặc `SUPABASE_SERVICE_ROLE_KEY`

**Giải pháp:**
1. Kiểm tra file `.env.local`
2. Đảm bảo có đủ 2 biến
3. Restart server

### **Error: "Failed to create user"**

**Nguyên nhân:**
- Service Role Key không đúng
- Supabase database không accessible

**Giải pháp:**
1. Kiểm tra Service Role Key trong Supabase Dashboard
2. Copy lại key vào `.env.local`
3. Restart server

### **Error: "Không thể tải danh sách API keys"**

**Nguyên nhân:**
- Session hết hạn
- Network error

**Giải pháp:**
1. Đăng xuất và đăng nhập lại
2. Refresh trang
3. Kiểm tra network trong DevTools

---

## 📚 Tài liệu tham khảo

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Service Role](https://supabase.com/docs/guides/api/api-keys)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**Cập nhật:** 2025-10-04  
**Version:** 2.0  
**Status:** ✅ All issues resolved



