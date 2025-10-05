# 🔧 Environment Variables Setup Guide

## 📋 **Tổng quan**

Hệ thống cần các environment variables sau để hoạt động:

1. ✅ **NextAuth** - Authentication
2. ✅ **Supabase** - Database
3. ✅ **AI Providers** - Chatbot (optional)

---

## 🚀 **SETUP NHANH**

### **Bước 1: Lấy Supabase Credentials**

1. Truy cập: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **Settings** → **API** (menu bên trái)
4. Copy 3 giá trị:

```
📋 Project URL: https://xxxxxxxxxxxxx.supabase.co
📋 anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
📋 service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (secret!)
```

### **Bước 2: Tạo NEXTAUTH_SECRET**

Chạy lệnh sau trong PowerShell:

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Hoặc dùng giá trị đã tạo:
```
1s0AMhjRNc5eFL3yvdu6DgVHrtxnzTUa
```

### **Bước 3: Cập nhật file `.env.local`**

Mở file: `E:\Codex-ADR\.env.local`

Thay thế các giá trị sau:

```env
# =====================================================
# NEXTAUTH CONFIGURATION
# =====================================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=1s0AMhjRNc5eFL3yvdu6DgVHrtxnzTUa

# =====================================================
# SUPABASE CONFIGURATION
# =====================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =====================================================
# AI CHATBOT CONFIGURATION (Optional)
# =====================================================
GEMINI_API_KEY=AIzaSy_PASTE_YOUR_KEY_HERE
# OPENAI_API_KEY=sk-proj-YOUR_KEY_HERE
```

### **Bước 4: Restart Server**

```bash
# Dừng server (Ctrl+C)
# Chạy lại:
npm run dev
```

---

## 📚 **CHI TIẾT CÁC BIẾN**

### **1. NEXTAUTH_URL**
- **Mô tả:** URL của ứng dụng
- **Development:** `http://localhost:3000`
- **Production:** `https://your-domain.com`
- **Bắt buộc:** ✅ Yes

### **2. NEXTAUTH_SECRET**
- **Mô tả:** Secret key để mã hóa JWT tokens
- **Format:** Random string 32+ ký tự
- **Tạo:** `openssl rand -base64 32` hoặc dùng PowerShell
- **Bắt buộc:** ✅ Yes
- **⚠️ Lưu ý:** KHÔNG share key này, giữ bí mật!

### **3. NEXT_PUBLIC_SUPABASE_URL**
- **Mô tả:** URL của Supabase project
- **Format:** `https://xxxxxxxxxxxxx.supabase.co`
- **Lấy từ:** Supabase Dashboard → Settings → API → Project URL
- **Bắt buộc:** ✅ Yes

### **4. NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **Mô tả:** Public anon key cho client-side
- **Format:** JWT token dài (eyJhbGciOi...)
- **Lấy từ:** Supabase Dashboard → Settings → API → anon public
- **Bắt buộc:** ✅ Yes
- **⚠️ Lưu ý:** Key này được public, không sao!

### **5. SUPABASE_SERVICE_ROLE_KEY**
- **Mô tả:** Service role key cho server-side operations
- **Format:** JWT token dài (eyJhbGciOi...)
- **Lấy từ:** Supabase Dashboard → Settings → API → service_role
- **Bắt buộc:** ✅ Yes (cho admin operations)
- **⚠️ Lưu ý:** KHÔNG share key này, rất quan trọng!

### **6. GEMINI_API_KEY**
- **Mô tả:** Google Gemini API key cho AI chatbot
- **Format:** `AIzaSy...` (39 ký tự)
- **Lấy từ:** https://aistudio.google.com/app/apikey
- **Bắt buộc:** ❌ No (chỉ cần khi dùng AI chatbot)
- **Chi phí:** Miễn phí (60 requests/phút)

### **7. OPENAI_API_KEY**
- **Mô tả:** OpenAI API key cho ChatGPT
- **Format:** `sk-proj-...` hoặc `sk-...`
- **Lấy từ:** https://platform.openai.com/api-keys
- **Bắt buộc:** ❌ No (alternative cho Gemini)
- **Chi phí:** ~$0.03/chat với GPT-4

---

## 🔍 **KIỂM TRA CẤU HÌNH**

### **Checklist:**

```bash
✅ File .env.local tồn tại
✅ NEXTAUTH_URL = http://localhost:3000
✅ NEXTAUTH_SECRET = [32+ ký tự random]
✅ NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci... [JWT token]
✅ SUPABASE_SERVICE_ROLE_KEY = eyJhbGci... [JWT token]
🔲 GEMINI_API_KEY (optional)
🔲 OPENAI_API_KEY (optional)
```

### **Test kết nối:**

1. **Start server:**
   ```bash
   npm run dev
   ```

2. **Truy cập:**
   ```
   http://localhost:3000
   ```

3. **Kiểm tra console:**
   - ✅ Không có lỗi `NO_SECRET`
   - ✅ Không có lỗi `supabaseUrl is required`
   - ✅ Server chạy bình thường

---

## 🆘 **TROUBLESHOOTING**

### **Lỗi: [next-auth][error][NO_SECRET]**

**Nguyên nhân:** Thiếu `NEXTAUTH_SECRET`

**Giải pháp:**
1. Thêm `NEXTAUTH_SECRET=...` vào `.env.local`
2. Restart server

### **Lỗi: supabaseUrl is required**

**Nguyên nhân:** Thiếu Supabase credentials

**Giải pháp:**
1. Lấy URL và keys từ Supabase Dashboard
2. Thêm vào `.env.local`
3. Restart server

### **Lỗi: Invalid JWT**

**Nguyên nhân:** Copy sai hoặc thiếu phần của JWT token

**Giải pháp:**
1. Copy lại toàn bộ JWT token từ Supabase
2. Đảm bảo không có dấu cách thừa
3. Token phải bắt đầu bằng `eyJhbGciOi...`

### **Server không start được**

**Kiểm tra:**
1. File `.env.local` có đúng tên không?
2. Tất cả biến bắt buộc đã điền chưa?
3. Có ký tự đặc biệt lạ trong values không?
4. Thử xóa folder `.next` và build lại

---

## 🔐 **BẢO MẬT**

### **⚠️ QUAN TRỌNG:**

1. **KHÔNG commit** file `.env.local` lên Git
   - File đã được thêm vào `.gitignore`

2. **KHÔNG share** các keys sau:
   - ❌ `NEXTAUTH_SECRET`
   - ❌ `SUPABASE_SERVICE_ROLE_KEY`
   - ❌ `OPENAI_API_KEY`

3. **CÓ THỂ public** (được thiết kế cho client):
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Rotation keys định kỳ:**
   - Thay `NEXTAUTH_SECRET` mỗi 6 tháng
   - Regenerate Supabase keys nếu bị lộ

---

## 🚀 **PRODUCTION SETUP**

Khi deploy lên production (Vercel, Railway, etc.):

1. **Thêm environment variables** vào platform settings
2. **Cập nhật NEXTAUTH_URL:**
   ```
   NEXTAUTH_URL=https://your-production-domain.com
   ```
3. **Tạo NEXTAUTH_SECRET mới** (khác với development)
4. **Kiểm tra RLS policies** trong Supabase
5. **Test kỹ authentication flow**

---

## 📞 **HỖ TRỢ**

Nếu gặp vấn đề:
1. Đọc lại hướng dẫn này
2. Kiểm tra console logs
3. Xem file `docs/AI-CHATBOT-USER-GUIDE.md`
4. Liên hệ support

---

**Cập nhật:** 2025-10-04  
**Version:** 1.0



