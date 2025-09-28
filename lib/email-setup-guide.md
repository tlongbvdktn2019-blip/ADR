# 📧 Hướng dẫn thiết lập Email cho ADR System

## 🎯 Tổng quan tính năng

Hệ thống ADR hỗ trợ gửi báo cáo qua email với các tính năng:

✅ **Email Template đẹp** - HTML responsive với đầy đủ thông tin báo cáo  
✅ **Target Email** - Gửi đến `di.pvcenter@gmail.com` (có thể custom)  
✅ **Permission-based** - Chỉ người tạo báo cáo hoặc admin mới gửi được  
✅ **Development-friendly** - Test email với Ethereal Email  
✅ **Production-ready** - Hỗ trợ SMTP thực tế  

## 🚀 Cách sử dụng (Development)

### Bước 1: Cài đặt dependencies

```bash
npm install nodemailer @types/nodemailer
```

### Bước 2: Test ngay (không cần SMTP)

1. **Khởi động server**: `npm run dev` 
2. **Truy cập chi tiết báo cáo**: `/reports/[id]`
3. **Nhấn nút "Gửi Email"**
4. **Kiểm tra console** - Sẽ có link preview email

### Bước 3: Xem email test

- System tự động tạo test email với Ethereal Email
- Link preview sẽ xuất hiện trong toast notification
- Mở link để xem email đã gửi

## 🔧 Production Setup (Optional)

### Với Gmail SMTP:

1. **Tạo App Password** cho Gmail account
2. **Thêm vào `.env.local`**:

```bash
# Email configuration
EMAIL_FROM=your-system@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
```

### Với SMTP khác:

```bash
EMAIL_FROM=noreply@yourcompany.com
SMTP_HOST=mail.yourcompany.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username
SMTP_PASS=password
```

## 📧 Email Content

### Subject Format:
```
[ADR] 2023-000001 - Nguyễn Văn A (Nghiêm trọng)
```

### Email bao gồm:
- **Header** với logo và mã báo cáo
- **5 phần thông tin đầy đủ** (A,B,C,D,E)  
- **Color-coded severity** badges
- **Responsive design** cho mobile
- **Professional styling**

## 🎮 Demo và Test

### Test Flow:
1. Login với demo account
2. Vào `/reports` → Click báo cáo
3. Nhấn "Gửi Email" 
4. Nhập email hoặc để mặc định
5. Check toast notification để lấy preview link

### Custom Email:
- Mặc định: `di.pvcenter@gmail.com`
- Có thể override trong modal
- Validate email format

## 🔒 Security & Permissions

- **Admin**: Gửi email cho mọi báo cáo
- **User**: Chỉ gửi email cho báo cáo của mình
- **Email validation**: Kiểm tra format hợp lệ
- **Data protection**: Tuân thủ quy định bảo mật

## 🐛 Troubleshooting

### Lỗi "Không thể gửi email":
1. Kiểm tra internet connection
2. Xem server logs (terminal)
3. Thử với default test email

### Production email không gửi:
1. Kiểm tra SMTP credentials
2. Test với external SMTP tester  
3. Check firewall/security settings

### Email đến spam:
1. Cấu hình SPF/DKIM records
2. Sử dụng domain email thay vì Gmail
3. Warm-up email reputation

## 📊 API Endpoints

### Gửi email:
```
POST /api/reports/[id]/send-email
Body: { email?: string }
```

### Kiểm tra quyền:
```  
GET /api/reports/[id]/send-email
Response: { canSendEmail: boolean, ... }
```

## 🎨 Customization

### Thay đổi email template:
- Edit: `lib/email-templates/adr-report.ts`
- Modify HTML structure, CSS styling
- Add/remove sections as needed

### Thay đổi target email:
- Update: `lib/email-service.ts` → `EMAIL_CONFIG.targetEmail`
- Or pass custom email in API call

### Add new email types:
- Create new template in `lib/email-templates/`
- Add to `EMAIL_TEMPLATES` enum
- Create corresponding API endpoints

---

## ✨ Features Summary

🎯 **Ready to use** - Works immediately in development  
📧 **Professional emails** - Beautiful HTML templates  
🔧 **Flexible** - Easy customization and configuration  
🛡️ **Secure** - Permission-based access control  
📱 **Responsive** - Mobile-friendly email design  
🚀 **Scalable** - Production-ready architecture  

**Perfect for sending ADR reports to authorities! 🏥📊**


