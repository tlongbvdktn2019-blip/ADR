# 💬 Hướng dẫn Setup Telegram Notification

## 🎯 Tổng quan

Nhận thông báo ADR ngay trên **Telegram** khi có báo cáo mới!

**Ưu điểm:**
- ⚡ Thông báo real-time trên điện thoại
- 🆓 Miễn phí 100%
- 📱 App có sẵn (iOS/Android/Desktop)
- 🔔 Push notification
- 💡 Setup nhanh 5 phút

---

## 🚀 Setup (5 phút)

### **Bước 1: Tạo Telegram Bot**

1. **Mở Telegram**
2. **Tìm:** `@BotFather` (bot chính thức của Telegram)
3. **Gửi lệnh:** `/newbot`
4. **Đặt tên bot:** VD: `ADR Notification Bot`
5. **Đặt username:** VD: `adr_notification_bot` (phải có `_bot` ở cuối)
6. **Copy Bot Token:** 
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```

### **Bước 2: Lấy Chat ID**

1. **Gửi tin nhắn** cho bot vừa tạo (bất kỳ)
2. **Mở browser, vào:**
   ```
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```
   Thay `<BOT_TOKEN>` bằng token ở bước 1

3. **Tìm `chat.id`:**
   ```json
   {
     "chat": {
       "id": 123456789,  ← Copy số này
       "first_name": "Your Name"
     }
   }
   ```

### **Bước 3: Cập nhật .env.local**

Thêm vào file `.env.local`:

```bash
# Telegram Notification
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

### **Bước 4: Bật Telegram Notification trong Code**

Uncomment code trong:
- `app/api/reports/route.ts`
- `app/api/public/reports/route.ts`

Tìm section: `// TELEGRAM NOTIFICATION`

### **Bước 5: Restart Server**

```bash
npm run dev
```

### **Bước 6: Test**

Tạo báo cáo ADR → Check Telegram → Nhận thông báo! 🎉

---

## 📧 **Nội dung thông báo**

```
🔔 Có báo cáo ADR mới!

🚨 Mã báo cáo: 2025-000001
👤 Bệnh nhân: Nguyễn Văn A
🏥 Tổ chức: Bệnh viện ABC
⚠️ Mức độ: Nghiêm trọng
📅 Ngày xảy ra: 05/10/2025

💊 Thuốc nghi ngờ:
  1. Paracetamol
  2. Amoxicillin

📝 Mô tả: Phát ban toàn thân...

👨‍⚕️ Người báo cáo: BS. Nguyễn Văn B
📞 Liên hệ: 0123456789

⏰ Thời gian: 05/10/2025 10:30
```

---

## 🧪 Test Telegram Connection

```bash
node -e "require('./lib/telegram-notification-service.ts').testTelegramConnection()"
```

---

## 🔧 Troubleshooting

### **Không nhận được thông báo:**

1. Check Bot Token đúng chưa
2. Check Chat ID đúng chưa
3. Đã gửi tin nhắn cho bot chưa (phải gửi ít nhất 1 lần)
4. Restart server sau khi update .env.local

### **Lỗi "Bot was blocked by the user":**

- Unblock bot trong Telegram
- Gửi lại tin nhắn cho bot

---

## 🎯 So sánh với Email

| Feature | Email | Telegram |
|---------|-------|----------|
| **Setup** | Phức tạp | Đơn giản |
| **Cost** | Miễn phí | Miễn phí |
| **Speed** | Chậm | Real-time |
| **Mobile** | Check email | Push notification |
| **Spam** | Có thể vào spam | Không spam |
| **Authentication** | App password | Token đơn giản |

---

**🎉 Telegram notification là giải pháp tốt nhất thay thế email!**







