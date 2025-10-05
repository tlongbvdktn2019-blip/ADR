# 🚀 Quick Start - Tự động gửi Email Thông báo

## ⚡ Setup nhanh trong 3 phút

### **Bước 1: Cài đặt dependencies**

```bash
# Nếu chưa cài
npm install nodemailer @types/nodemailer
```

### **Bước 2: Cấu hình (Optional)**

Chức năng **đã hoạt động ngay** mà không cần cấu hình!

- ✅ Development: Dùng Ethereal Email (fake SMTP)
- ✅ Email mặc định: `di.pvcenter@gmail.com`
- ✅ Tự động gửi khi tạo báo cáo

**Nếu muốn custom email theo organization:**

Edit `lib/auto-email-service.ts`:

```typescript
const ORGANIZATION_EMAILS: Record<string, string> = {
  'Sở Y tế Thành phố': 'soyte@gmail.com',
  'Bệnh viện ABC': 'benhvien.abc@gmail.com',
  // Thêm organization của bạn
}
```

### **Bước 3: Test thử**

```bash
# 1. Start server
npm run dev

# 2. Tạo báo cáo ADR mới (qua UI)
#    - Login: admin@soyte.gov.vn / admin123
#    - Vào menu "Báo cáo ADR" → "Tạo báo cáo"
#    - Điền form và submit

# 3. Check console logs
📧 Auto email sent successfully for report 2024-000123:
  sentTo: ['reporter@email.com', 'di.pvcenter@gmail.com']

# 4. Mở link preview để xem email
https://ethereal.email/message/xxxxx
```

---

## 📧 Email được gửi đến ai?

```typescript
Khi tạo báo cáo → Email tự động gửi đến:

1. ✅ Người báo cáo (nếu có reporter_email)
2. ✅ Email tổ chức (map từ organization name)
3. ✅ Email mặc định (di.pvcenter@gmail.com)

// Loại bỏ duplicate emails tự động
```

---

## ⚙️ Cấu hình nâng cao (Optional)

### **A. Thêm organization email mới**

File: `lib/auto-email-service.ts`

```typescript
const ORGANIZATION_EMAILS: Record<string, string> = {
  'Bệnh viện Đại học Y': 'bvdaihoc@gmail.com',
  'Bệnh viện Trung ương': 'bvtrunguong@gmail.com',
  // ← Thêm tổ chức mới vào đây
}
```

### **B. Gmail SMTP (Production)**

File: `.env.local`

```bash
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password # Get from: https://myaccount.google.com/apppasswords

# Sender info
EMAIL_FROM=noreply@adrsystem.gov.vn
```

**Cách lấy Gmail App Password:**
1. Vào https://myaccount.google.com/apppasswords
2. Chọn "Mail" → "Other (Custom name)"
3. Nhập: "ADR System"
4. Copy 16-character password

### **C. Tắt auto-send (nếu cần)**

File: `app/api/reports/route.ts`

```typescript
// Comment out phần này:
/*
sendAutoReportEmail(completeReport as ADRReport, {
  includeReporter: true,
  includeOrganization: true
})
*/
```

---

## 🧪 Testing

### **Test 1: Qua UI (Đơn giản nhất)**

```bash
1. npm run dev
2. Login → Tạo báo cáo ADR
3. Check console → Copy link preview
4. Mở link trong browser → Xem email
```

### **Test 2: Qua API**

```bash
# Test auto-send cho báo cáo đã tạo
curl -X POST http://localhost:3000/api/reports/auto-email \
  -H "Content-Type: application/json" \
  -d '{"reportId": "uuid-here"}'
```

### **Test 3: Check logs**

```bash
# Terminal sẽ hiện:
📧 Auto email sent successfully for report 2024-000123
   sentTo: ['reporter@email.com', 'di.pvcenter@gmail.com']
   previewURL: https://ethereal.email/message/xxxxx
```

---

## 🎯 Tóm tắt

| Feature | Default | Custom |
|---------|---------|--------|
| **Auto-send** | ✅ Enabled | - |
| **Development SMTP** | ✅ Ethereal Email | Gmail SMTP |
| **Recipients** | ✅ reporter + default | Add organizations |
| **Email Template** | ✅ Beautiful HTML | Edit template file |
| **Error handling** | ✅ Graceful | - |

---

## 📚 Tài liệu đầy đủ

Xem chi tiết: [AUTO-EMAIL-NOTIFICATION-GUIDE.md](./AUTO-EMAIL-NOTIFICATION-GUIDE.md)

---

**🎉 Chức năng sẵn sàng sử dụng ngay!**

**Không cần cấu hình gì thêm để test trong development mode.**







