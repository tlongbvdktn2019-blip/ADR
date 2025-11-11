# 🔧 HƯỚNG DẪN SETUP: QR CÔNG KHAI

## 📋 YÊU CẦU

- Node.js 18+
- Next.js 13+
- Supabase account
- Domain với SSL/HTTPS (cho production)

---

## ⚙️ CÀI ĐẶT

### **Bước 1: Cập nhật Environment Variables**

Thêm vào file `.env.local` (hoặc `.env`):

```env
# App URL - QUAN TRỌNG cho tính năng QR công khai
# Phải là domain production với HTTPS
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

**⚠️ LƯU Ý:**
- **KHÔNG dùng `localhost`** - sẽ không hoạt động trên mobile
- **BẮT BUỘC phải HTTPS** - camera điện thoại yêu cầu SSL
- Ví dụ: `https://codex-adr.vercel.app` hoặc `https://your-domain.com`

### **Bước 2: Cài đặt Dependencies**

```bash
npm install
# hoặc
yarn install
```

### **Bước 3: Build**

```bash
npm run build
```

### **Bước 4: Deploy lên Production**

#### **Option 1: Vercel (Khuyên dùng)**
```bash
# Cài Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variable trên Vercel dashboard
# Settings → Environment Variables
# Add: NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
```

#### **Option 2: Netlify**
```bash
# Cài Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Set environment variable
netlify env:set NEXT_PUBLIC_APP_URL https://your-app.netlify.app
```

#### **Option 3: Self-hosted**
```bash
# Build
npm run build

# Start production server
npm run start

# Đảm bảo set environment variable trên server
export NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 🧪 KIỂM TRA SETUP

### **Test 1: Kiểm tra Environment**

```bash
# Xem env var đã set chưa
echo $NEXT_PUBLIC_APP_URL

# Hoặc trong code
console.log(process.env.NEXT_PUBLIC_APP_URL)
```

**Kết quả mong đợi:**
```
https://your-production-domain.com
```

### **Test 2: Kiểm tra API**

```bash
# Tạo một thẻ test (cần đăng nhập)
# Lấy mã thẻ (VD: AC-2024-000001)

# Test API công khai (không cần đăng nhập)
curl https://your-domain.com/api/allergy-cards/public/AC-2024-000001
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "card": {
    "card_code": "AC-2024-000001",
    "patient_name": "...",
    "allergies": [...]
  }
}
```

### **Test 3: Kiểm tra Trang Public**

Mở trình duyệt:
```
https://your-domain.com/allergy-cards/public/AC-2024-000001
```

**Kết quả mong đợi:**
- Hiển thị trang đẹp với thông tin thẻ
- Không yêu cầu đăng nhập
- Responsive trên mobile

### **Test 4: Kiểm tra QR Code**

1. Tạo thẻ dị ứng mới
2. Download QR code
3. Mở QR bằng tool (qrcode.com) để xem nội dung
4. **Kiểm tra QR chứa URL đúng:**
   ```
   https://your-domain.com/allergy-cards/public/AC-2024-XXXXXX
   ```

### **Test 5: Quét QR bằng Mobile**

1. In QR code hoặc hiển thị trên màn hình
2. Mở Camera trên iPhone/Android
3. Quét QR
4. Xác nhận:
   - Tự động mở trình duyệt
   - Load trang thông tin thẻ
   - Hiển thị đúng dữ liệu
   - Không yêu cầu đăng nhập

---

## 🚨 TROUBLESHOOTING

### **Vấn đề 1: QR không mở được trên mobile**

**Triệu chứng:**
- Quét QR không có phản ứng
- Hoặc báo lỗi "Cannot open URL"

**Nguyên nhân:**
- `NEXT_PUBLIC_APP_URL` chưa set
- Hoặc đang dùng localhost
- Hoặc không có HTTPS

**Giải pháp:**
```bash
# 1. Kiểm tra env var
echo $NEXT_PUBLIC_APP_URL

# 2. Đảm bảo là HTTPS production URL
# BAD:  http://localhost:3000
# BAD:  http://your-domain.com
# GOOD: https://your-domain.com

# 3. Set lại và rebuild
export NEXT_PUBLIC_APP_URL=https://your-domain.com
npm run build

# 4. Redeploy
```

### **Vấn đề 2: API trả về 404**

**Triệu chứng:**
```json
{
  "error": "Not Found"
}
```

**Nguyên nhân:**
- Mã thẻ không tồn tại
- Route chưa được deploy
- Middleware chặn request

**Giải pháp:**
```bash
# 1. Kiểm tra mã thẻ có đúng không
# Format phải là: AC-YYYY-XXXXXX

# 2. Kiểm tra route file có tồn tại
ls app/api/allergy-cards/public/[code]/route.ts

# 3. Kiểm tra middleware
# File: middleware.ts
# Đảm bảo có:
# if (req.nextUrl.pathname.startsWith('/api/allergy-cards/public/')) {
#   return true
# }

# 4. Rebuild và deploy lại
npm run build
```

### **Vấn đề 3: "Không tìm thấy thẻ"**

**Triệu chứng:**
- API trả về 404
- Hoặc trang hiển thị "Không tìm thấy thẻ"

**Nguyên nhân:**
- Thẻ chưa được tạo
- Mã thẻ sai
- Database connection error

**Giải pháp:**
```bash
# 1. Kiểm tra thẻ có trong database không
# Vào Supabase Dashboard → Table Editor → allergy_cards
# Search mã thẻ

# 2. Nếu không có, tạo thẻ mới

# 3. Kiểm tra database connection
# File: .env.local
# NEXT_PUBLIC_SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...

# 4. Test trực tiếp API
curl https://your-domain.com/api/allergy-cards/public/AC-2024-000001
```

### **Vấn đề 4: Trang hiển thị lỗi CSS**

**Triệu chứng:**
- Layout bị vỡ
- Không responsive
- Màu sắc sai

**Giải pháp:**
```bash
# 1. Clear cache
# Trong browser: Ctrl+Shift+R (hard refresh)

# 2. Rebuild
npm run build

# 3. Kiểm tra Tailwind config
# File: tailwind.config.js
# Đảm bảo content paths đúng

# 4. Kiểm tra mobile viewport
# Trong page.tsx phải có:
# <meta name="viewport" content="width=device-width, initial-scale=1" />
```

### **Vấn đề 5: Middleware chặn request**

**Triệu chứng:**
- Redirect về trang login
- 401 Unauthorized

**Giải pháp:**
```typescript
// File: middleware.ts
// Đảm bảo có các rules sau:

// Allow public access to allergy card public pages
if (req.nextUrl.pathname.startsWith('/allergy-cards/public/')) {
  return true
}

// Allow public API access for allergy cards
if (req.nextUrl.pathname.startsWith('/api/allergy-cards/public/')) {
  return true
}

// Allow public access to QR scanner page
if (req.nextUrl.pathname.startsWith('/allergy-cards/scan')) {
  return true
}
```

---

## 📊 MONITORING

### **Metrics cần theo dõi:**

1. **API Response Time**
   ```bash
   # Public API phải < 200ms
   curl -w "\nTime: %{time_total}s\n" \
     https://your-domain.com/api/allergy-cards/public/AC-2024-000001
   ```

2. **Error Rate**
   - Xem logs: Vercel Dashboard → Functions → Logs
   - Hoặc server logs nếu self-hosted

3. **Traffic**
   - Số lượt truy cập API public
   - Số lượt quét QR
   - Top thẻ được xem nhiều

### **Logging:**

Thêm logging vào API nếu cần:

```typescript
// File: app/api/allergy-cards/public/[code]/route.ts

console.log('[Public Access]', {
  cardCode,
  timestamp: new Date().toISOString(),
  ip: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent')
});
```

---

## 🔒 SECURITY CHECKLIST

- [ ] `NEXT_PUBLIC_APP_URL` chỉ set production domain
- [ ] SSL/HTTPS đã enable
- [ ] Rate limiting (optional, thêm sau nếu cần)
- [ ] Không log sensitive data
- [ ] API chỉ cho phép GET
- [ ] Validate mã thẻ chặt chẽ
- [ ] Không trả về user ID, report ID internal
- [ ] Test với nhiều mã thẻ sai để đảm bảo không lộ thông tin

---

## 📈 PERFORMANCE TUNING

### **Caching (optional):**

Thêm cache headers nếu cần:

```typescript
// File: app/api/allergy-cards/public/[code]/route.ts

return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
  }
});
```

### **CDN:**

Nếu dùng Vercel/Netlify, tự động có CDN.

### **Database Optimization:**

- Index trên `card_code` column (đã có từ UNIQUE constraint)
- Dùng `maybeSingle()` thay vì `single()` để tránh throw error

---

## ✅ CHECKLIST HOÀN CHỈNH

### **Trước khi deploy production:**

- [ ] Set `NEXT_PUBLIC_APP_URL` đúng
- [ ] Test API local
- [ ] Test trang public local
- [ ] Build successful
- [ ] Deploy lên staging (nếu có)
- [ ] Test API trên staging
- [ ] Test trang public trên staging
- [ ] Test quét QR trên mobile (iOS)
- [ ] Test quét QR trên mobile (Android)
- [ ] Test với nhiều thiết bị khác nhau
- [ ] Kiểm tra logs không có error
- [ ] Deploy lên production
- [ ] Test lại trên production
- [ ] Monitor trong 24h đầu
- [ ] Thông báo cho users
- [ ] Chuẩn bị training materials
- [ ] Setup support channel

### **Sau khi deploy:**

- [ ] Tạo thẻ mẫu để demo
- [ ] Train bác sĩ/admin
- [ ] Train nhân viên y tế
- [ ] Hướng dẫn bệnh nhân
- [ ] Collect feedback
- [ ] Monitor performance
- [ ] Fix bugs nếu có
- [ ] Document lessons learned

---

## 📞 SUPPORT

Nếu cần hỗ trợ:

1. **Xem logs:**
   - Vercel: Dashboard → Functions → Logs
   - Netlify: Dashboard → Functions → Logs
   - Self-hosted: `pm2 logs` hoặc `journalctl`

2. **Check tài liệu:**
   - Chi tiết: `docs/PUBLIC-QR-ALLERGY-CARD-GUIDE.md`
   - Quick: `docs/PUBLIC-QR-QUICK-START.md`
   - Changelog: `CHANGELOG-PUBLIC-QR.md`

3. **Test script:**
   ```bash
   node scripts/test-public-qr.js
   ```

4. **Contact:**
   - GitHub Issues
   - Email support
   - Slack/Discord channel

---

## 🎉 HOÀN THÀNH!

Setup hoàn tất! Bây giờ hệ thống đã sẵn sàng với tính năng QR công khai.

**Next steps:**
1. Test kỹ trên production
2. Train users
3. Monitor & maintain
4. Collect feedback for improvements

**Good luck! 🚀**

