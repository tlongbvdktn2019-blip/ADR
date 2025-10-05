# 🤖 Hướng dẫn Cài đặt AI Chatbot với Google Gemini (MIỄN PHÍ)

## 📝 Tổng quan

Tài liệu này hướng dẫn cách lấy API key Google Gemini miễn phí và cấu hình cho AI Chatbot trong hệ thống Codex-ADR.

---

## 🎯 Bước 1: Lấy API Key Google Gemini

### 1.1. Truy cập Google AI Studio

Mở trình duyệt và truy cập một trong các link sau:
- **Link chính:** https://aistudio.google.com/app/apikey
- **Link phụ:** https://makersuite.google.com/app/apikey

### 1.2. Đăng nhập Google Account

- Sử dụng tài khoản Google của bạn (Gmail)
- Chấp nhận Terms of Service nếu được yêu cầu

### 1.3. Tạo API Key

Có 2 cách tạo API key:

#### **Cách 1: Tạo project mới (Khuyến nghị)**
1. Nhấn nút **"Get API key"** hoặc **"Create API key"**
2. Chọn **"Create API key in new project"**
3. Hệ thống tự động tạo project và API key
4. **QUAN TRỌNG:** Copy ngay API key (chỉ hiển thị 1 lần!)

#### **Cách 2: Sử dụng project có sẵn**
1. Chọn **"Create API key in existing project"**
2. Chọn project từ Google Cloud Platform
3. Copy API key được tạo

### 1.4. Định dạng API Key

API key Google Gemini có dạng:
```
AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
- Bắt đầu bằng: `AIzaSy`
- Độ dài: ~39 ký tự

---

## ⚙️ Bước 2: Cấu hình vào Project

### 2.1. Tạo file `.env.local`

Tại thư mục gốc của project (`E:\Codex-ADR\`), tạo file `.env.local`:

**Cách tạo:**

#### **Option A: Sử dụng Editor (VS Code / Cursor)**
1. Mở project trong editor
2. Chuột phải vào thư mục gốc → **New File**
3. Đặt tên: `.env.local`
4. Paste nội dung bên dưới

#### **Option B: Sử dụng PowerShell**
```powershell
cd E:\Codex-ADR
New-Item -Path ".env.local" -ItemType File -Force
```

### 2.2. Nội dung file `.env.local`

```env
# ============================================
# AI CHATBOT CONFIGURATION
# ============================================

# Google Gemini API Key (FREE)
# Lấy tại: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# OpenAI API Key (Optional - có phí)
# Nếu muốn dùng ChatGPT thay vì Gemini
# Lấy tại: https://platform.openai.com/api-keys
# OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXX
# OPENAI_MODEL=gpt-4

# ============================================
# LƯU Ý BẢO MẬT
# ============================================
# - KHÔNG commit file này lên Git
# - KHÔNG share API key với người khác
# - API key có quyền truy cập account của bạn
```

### 2.3. Thay thế API Key

**Thay dòng:**
```env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Bằng API key thật của bạn:**
```env
GEMINI_API_KEY=AIzaSyC9dK3mL2pQ7rS8tU4vW6xY1zA2bC3dE4f
```
*(Đây chỉ là ví dụ, dùng key thật của bạn)*

---

## 🚀 Bước 3: Restart Server

### 3.1. Dừng server hiện tại
Nếu đang chạy server, nhấn `Ctrl + C` trong terminal để dừng.

### 3.2. Khởi động lại server
```bash
npm run dev
```

### 3.3. Kiểm tra console
Server sẽ chạy tại: `http://localhost:3000`

Xem console để đảm bảo không có lỗi liên quan đến API keys.

---

## ✅ Bước 4: Test AI Chatbot

### 4.1. Đăng nhập vào hệ thống
- Truy cập: `http://localhost:3000`
- Đăng nhập bằng tài khoản có sẵn

### 4.2. Tạo ADR Report mới
1. Vào menu: **Reports** → **New Report**
2. Điền thông tin:
   - **Patient Info:** Tên, tuổi, giới tính, cân nặng
   - **Suspected Drugs:** Ít nhất 1 loại thuốc
   - **ADR Description:** Mô tả phản ứng có hại

### 4.3. Mở AI Chatbot
1. Scroll xuống phần **"4. Assessment"**
2. Nhấn nút **"🤖 AI Consultant"** (màu tím/xanh)
3. Chatbot sẽ mở trong modal window

### 4.4. Chat với AI
Thử các câu hỏi sau:
- "Phân tích case này theo thang WHO-UMC"
- "Tính điểm Naranjo cho trường hợp này"
- "Khuyến nghị xử trí lâm sàng"
- "Cần làm thêm xét nghiệm gì?"

### 4.5. Kiểm tra kết quả
- ✅ AI trả lời bằng tiếng Việt
- ✅ Hiển thị model name (Gemini/ChatGPT)
- ✅ Có confidence score
- ✅ Gợi ý câu hỏi phù hợp

---

## 📊 Giới hạn miễn phí của Gemini

### Quota miễn phí (Free tier)
- **Requests per minute (RPM):** 60 requests
- **Requests per day (RPD):** 1,500 requests
- **Tokens per minute:** 32,000 tokens
- **Unlimited requests per month**

### So sánh với OpenAI
| Tính năng | Google Gemini | OpenAI ChatGPT |
|-----------|---------------|----------------|
| **Giá** | MIỄN PHÍ | Tính phí theo token |
| **RPM** | 60 | 3-90 (tùy tier) |
| **Quality** | Tốt | Rất tốt (GPT-4) |
| **Setup** | Không cần credit card | Cần credit card |
| **Use case** | Development, Testing | Production |

### Khi nào nâng cấp?
Nếu vượt quota miễn phí, bạn có 2 lựa chọn:
1. **Upgrade Gemini:** Chuyển sang paid tier (rẻ)
2. **Thêm OpenAI:** Dùng song song cả 2 providers

---

## 🔧 Troubleshooting

### Lỗi: "Dịch vụ AI tạm thời không khả dụng"

**Nguyên nhân:** API key chưa được cấu hình hoặc sai

**Giải pháp:**
1. Kiểm tra file `.env.local` có tồn tại
2. Kiểm tra `GEMINI_API_KEY` có đúng format
3. Restart server: `npm run dev`
4. Xóa cache browser (Ctrl + Shift + R)

### Lỗi: "API Key invalid"

**Nguyên nhân:** API key sai hoặc đã revoke

**Giải pháp:**
1. Quay lại Google AI Studio
2. Tạo API key mới
3. Thay vào file `.env.local`
4. Restart server

### Lỗi: "Rate limit exceeded"

**Nguyên nhân:** Vượt quota 60 requests/minute

**Giải pháp:**
1. Đợi 1 phút rồi thử lại
2. Giảm tần suất gọi API
3. Nếu cần nhiều hơn, upgrade hoặc dùng OpenAI

### Chatbot không mở được

**Kiểm tra:**
1. Đã điền đủ thông tin patient và drugs chưa?
2. Có lỗi JavaScript trong console không?
3. Session đã login chưa?
4. Network tab có request `/api/ai/chatbot` không?

---

## 🎓 Tips sử dụng hiệu quả

### 1. Câu hỏi tốt → Kết quả tốt
- ❌ Tệ: "Phân tích"
- ✅ Tốt: "Phân tích case này theo thang WHO-UMC và giải thích lý do"

### 2. Sử dụng gợi ý
- Sidebar có sẵn câu hỏi phổ biến
- Click để tự động điền vào input

### 3. Chuyển đổi providers
- Thử cả ChatGPT và Gemini
- So sánh kết quả từ 2 AI
- Chọn câu trả lời phù hợp nhất

### 4. Apply insights
- Nhấn nút "Áp dụng" để copy insight vào form
- Tiết kiệm thời gian điền form

### 5. Context matters
- Điền đầy đủ thông tin trước khi chat
- Càng nhiều data → AI càng chính xác

---

## 📚 Tài liệu tham khảo

- **Google Gemini Docs:** https://ai.google.dev/docs
- **API Reference:** https://ai.google.dev/api/rest
- **Pricing:** https://ai.google.dev/pricing
- **Community:** https://discuss.ai.google.dev/

---

## 📞 Hỗ trợ

Nếu gặp vấn đề, kiểm tra:
1. File log: Console trong browser (F12)
2. Server log: Terminal đang chạy `npm run dev`
3. API status: https://status.cloud.google.com/

---

**Cập nhật:** 04/10/2025
**Version:** 1.0
**Author:** Codex-ADR Team



