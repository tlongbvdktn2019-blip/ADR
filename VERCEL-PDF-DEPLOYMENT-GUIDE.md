# Vercel PDF Deployment Guide 

## ✅ Các thay đổi đã thực hiện

### 1. Loại bỏ puppeteer native
- Đã xóa `puppeteer` khỏi `package.json`
- Chỉ giữ lại `puppeteer-core` + `@sparticuz/chromium`

### 2. Tạo PDF Service mới cho Vercel
- **File mới**: `lib/pdf-service-vercel.ts` 
- Sử dụng `puppeteer-core` + `@sparticuz/chromium`
- Tự động phát hiện environment (development vs production)
- Optimized cho serverless Vercel

### 3. Cập nhật Allergy Card Service
- **File**: `lib/allergy-card-pdf-service.ts`
- Chuyển từ `puppeteer` sang `puppeteer-core` + `@sparticuz/chromium`

### 4. Cập nhật API Routes
- **File**: `app/api/reports/[id]/export-pdf/route.ts` 
- **File**: `app/api/allergy-cards/[id]/export-pdf/route.ts`
- Thêm `export const runtime = 'nodejs'` để force Node.js runtime
- Sử dụng `PDFServiceVercel` thay vì service cũ

### 5. Cấu hình Vercel 
- **File**: `vercel.json`
- Chỉ định `runtime: "nodejs20.x"` cho PDF routes
- Tăng `maxDuration: 30` và `memory: 1024` cho PDF generation

### 6. Next.js Configuration
- **File**: `next.config.js` (đã có từ trước)
- Externalize puppeteer packages cho server builds
- Optimize cho Vercel deployment

## 🚀 Deploy lên Vercel

### Bước 1: Commit các thay đổi
```bash
git add .
git commit -m "Fix Vercel PDF deployment - use puppeteer-core + @sparticuz/chromium"
git push origin main
```

### Bước 2: Deploy trên Vercel
1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Import project hoặc redeploy nếu đã có
3. Vercel sẽ tự động detect `vercel.json` config

### Bước 3: Kiểm tra Environment Variables
Đảm bảo các env vars sau được set trong Vercel:
```bash
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url  
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🧪 Test PDF Generation

### Test local:
```bash
npm run dev
# Navigate to a report and try exporting PDF
```

### Test production:
1. Deploy lên Vercel
2. Truy cập một ADR report 
3. Click "Export PDF" để test

## 📋 Technical Details

### Runtime Environment
- **Local**: Sử dụng full Chromium nếu có sẵn
- **Vercel**: Sử dụng `@sparticuz/chromium` (optimized cho serverless)
- **Runtime**: Node.js 20.x (NOT Edge Runtime)

### Memory và Timeout
- **Memory**: 1024MB cho PDF routes
- **Timeout**: 30 seconds maximum
- **Browser args**: Optimized cho serverless environment

### Error Handling
- Enhanced error logging cho debugging
- Graceful fallback nếu browser launch fails
- Proper cleanup của browser instances

## 🔧 Troubleshooting

### Nếu vẫn lỗi deployment:
1. Check Vercel logs trong Function tab
2. Verify environment variables
3. Ensure `vercel.json` config đúng

### Common issues:
- **Memory limit**: Tăng memory trong `vercel.json`
- **Timeout**: Tăng maxDuration trong `vercel.json`  
- **Browser launch fails**: Check logs để xem lỗi cụ thể

### Debug logs:
PDF services có extensive logging - check Vercel Function logs để debug issues.

## ✅ Build Success
Project đã build thành công locally với cấu hình mới. Ready for Vercel deployment!
