# 🚀 Hướng dẫn triển khai lên Vercel

## 🎯 Giải pháp cho lỗi PDF `spawn ETXTBSY`

### 📋 Tóm tắt vấn đề
Lỗi `spawn ETXTBSY` xảy ra khi Puppeteer cố gắng khởi chạy Chromium trên môi trường serverless của Vercel. Đây là lỗi phổ biến do:
- Resource locking trên serverless
- Quá nhiều processes được spawn đồng thời
- Binary executable conflicts

### ✅ Giải pháp đã triển khai

#### 1. Dependencies đã cài đặt
```json
{
  "@sparticuz/chromium": "^119.0.0",
  "puppeteer-core": "^24.2.0"
}
```

#### 2. Cấu hình Next.js (next.config.js)
- ✅ Externalize puppeteer packages
- ✅ Standalone output mode
- ✅ Function timeout optimization

#### 3. Cấu hình Vercel (vercel.json)
- ✅ Tăng memory lên 1024MB
- ✅ Timeout 30 giây cho PDF APIs
- ✅ Environment variables

#### 4. Enhanced PDF Service
- ✅ Browser instance reuse
- ✅ Exponential backoff retry
- ✅ ETXTBSY error handling
- ✅ Process cleanup

## 🔧 Các bước deployment

### 1. Cấu hình Environment Variables trên Vercel

Vào **Vercel Dashboard** → **Project Settings** → **Environment Variables**, thêm:

```bash
# Required Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required Auth
NEXTAUTH_SECRET=your_random_secret_32_chars_min
NEXTAUTH_URL=https://your-app.vercel.app

# Optional Email
EMAIL_FROM=noreply@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Vercel-specific (tự động set)
VERCEL=1
AWS_EXECUTION_ENV=AWS_Lambda_nodejs20.x
```

### 2. Deploy commands

```bash
# Commit changes
git add .
git commit -m "Fix PDF generation for Vercel deployment"
git push

# Deploy (nếu không tự động)
vercel --prod
```

### 3. Monitoring và debugging

#### Check function logs:
```bash
vercel logs https://your-app.vercel.app
```

#### Test PDF endpoint:
```bash
curl -X GET "https://your-app.vercel.app/api/reports/[id]/export-pdf" \
  -H "Cookie: your-session-cookie"
```

## 🐛 Troubleshooting

### Vẫn gặp lỗi ETXTBSY?

1. **Kiểm tra function timeout**:
   - Vercel free plan: Max 10s
   - Pro plan: Max 60s (đã set 30s trong vercel.json)

2. **Kiểm tra memory usage**:
   - Default: 1024MB (đã cấu hình)
   - Có thể tăng lên 3008MB nếu cần

3. **Kiểm tra concurrent requests**:
   - Vercel có giới hạn concurrent functions
   - Implement queue nếu có nhiều requests PDF đồng thời

### Lỗi dependencies?

```bash
# Reinstall packages
rm -rf node_modules package-lock.json
npm install
```

### Lỗi template.html không tìm thấy?

```bash
# Ensure template.html is in root directory
ls -la template.html
```

## ⚡ Performance optimization

### 1. Browser instance reuse
- ✅ Sử dụng lại browser instance
- ✅ Connection pooling
- ✅ Automatic cleanup

### 2. HTML optimization
- Disable JavaScript trong PDF
- Optimize CSS cho print
- Minimize template size

### 3. Caching strategy
- Cache static assets
- Browser cache headers
- CDN optimization

## 📊 Monitoring

### Success metrics:
- PDF generation time < 10s
- Success rate > 99%
- Memory usage < 800MB

### Error tracking:
- Monitor ETXTBSY frequency
- Function timeout rate
- Memory out-of-bounds

## 🔗 Useful links

- [Vercel Function Limits](https://vercel.com/docs/functions/serverless-functions/runtimes#limits)
- [Puppeteer in Vercel](https://vercel.com/guides/using-puppeteer-with-vercel)
- [@sparticuz/chromium docs](https://github.com/Sparticuz/chromium)

## 🚨 Emergency rollback

Nếu PDF không hoạt động sau deployment:

1. **Revert to simple PDF**:
```typescript
// Temporarily use jsPDF fallback
import { jsPDF } from 'jspdf'
const pdf = new jsPDF()
pdf.text('PDF generation temporarily unavailable', 20, 20)
return pdf.output('arraybuffer')
```

2. **Disable PDF temporarily**:
```typescript
return NextResponse.json({
  error: 'PDF generation temporarily disabled',
  message: 'Please try again later'
}, { status: 503 })
```

## ✅ Verification checklist

- [ ] All environment variables set on Vercel
- [ ] vercel.json deployed correctly
- [ ] Dependencies installed and locked
- [ ] Template.html accessible
- [ ] Test PDF generation works
- [ ] Function logs show no errors
- [ ] Performance within limits
