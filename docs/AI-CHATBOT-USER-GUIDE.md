# 🤖 **HỆ THỐNG AI CHATBOT CÁ NHÂN - HƯỚNG DẪN SỬ DỤNG**

## 🎯 **Tổng quan**

Hệ thống ADR đã được cập nhật để hỗ trợ **AI Chatbot cá nhân**. Từ nay, mỗi người dùng sẽ sử dụng API key riêng của mình thay vì chia sẻ chung, mang lại nhiều lợi ích:

✅ **Bảo mật cao hơn** - API key được mã hóa riêng
✅ **Không giới hạn quota** - Sử dụng quota riêng của bạn
✅ **Tự quản lý chi phí** - Chỉ trả tiền cho những gì bạn sử dụng
✅ **Lựa chọn AI** - ChatGPT hoặc Gemini tùy ý

---

## 🚀 **HƯỚNG DẪN BẮT ĐẦU**

### **Bước 1: Truy cập trang Settings**

1. Đăng nhập vào hệ thống ADR
2. Vào menu bên trái → **"Cài đặt"** 
3. Chọn tab **"API Keys"**

### **Bước 2: Chọn AI Provider**

**🔷 Google Gemini (Khuyến nghị cho người mới)**
- ✅ **Miễn phí** - Không cần thẻ tín dụng
- ✅ **60 requests/phút, 1,500/ngày**
- ✅ **Chất lượng tốt** cho tư vấn y khoa
- 📖 [Hướng dẫn lấy API key Gemini](./AI-CHATBOT-GEMINI-SETUP.md)

**🤖 OpenAI ChatGPT (Chất lượng cao)**
- 💰 **Có phí** - ~$0.002/1K tokens
- ✅ **Chất lượng cao nhất**
- ✅ **Phản hồi chi tiết, chính xác**
- 📖 [Hướng dẫn lấy API key OpenAI](./AI-CHATBOT-OPENAI-SETUP.md)

### **Bước 3: Thêm API Key vào hệ thống**

1. Nhấn **"Thêm API Key"**
2. Chọn Provider (Gemini hoặc OpenAI)
3. Dán API key vào ô input
4. Đặt tên gợi nhớ (tùy chọn)
5. Nhấn **"Thêm API Key"**

### **Bước 4: Test API Key**

1. Nhấn nút **"Test"** bên cạnh API key
2. Chờ hệ thống kiểm tra (5-10 giây)
3. Thấy ✅ **"Hoạt động tốt"** = Thành công!

### **Bước 5: Sử dụng AI Chatbot**

1. Vào **Reports → New Report**
2. Điền thông tin bệnh nhân và ADR
3. Scroll xuống phần **"Assessment"**
4. Nhấn **"🤖 AI Consultant"**
5. Chat với AI về case!

---

## 💡 **CÁCH SỬ DỤNG AI CHATBOT HIỆU QUẢ**

### **✅ Câu hỏi nên hỏi:**

```
✅ "Phân tích case này theo thang WHO-UMC"
✅ "Tính điểm Naranjo chi tiết cho trường hợp này"
✅ "Khuyến nghị xử trí lâm sàng cụ thể"
✅ "Cần làm thêm xét nghiệm gì để hỗ trợ đánh giá?"
✅ "Phân tích dechallenge/rechallenge"
✅ "Risk factors cần lưu ý cho bệnh nhân này"
```

### **❌ Câu hỏi nên tránh:**

```
❌ "Phân tích" (quá chung chung)
❌ "Có gì?" (không cụ thể)
❌ "Thuốc này thế nào?" (thiếu context)
```

### **🎯 Tips sử dụng:**

1. **Điền đầy đủ thông tin** trước khi chat
2. **Sử dụng gợi ý** có sẵn ở sidebar
3. **Chuyển đổi AI providers** để so sánh
4. **Apply insights** vào form để tiết kiệm thời gian
5. **Chat theo từng vấn đề** thay vì hỏi quá nhiều cùng lúc

---

## 🔧 **QUẢN LÝ API KEYS**

### **Xem danh sách API Keys**
- Vào **Settings → API Keys**
- Xem tất cả keys đã thêm
- Kiểm tra trạng thái: ✅ Hợp lệ | ❌ Không hợp lệ | ⚠️ Chưa test

### **Test API Key**
- Nhấn nút **"Test"** 
- Hệ thống sẽ gọi thử API
- Kết quả hiển thị ngay lập tức

### **Bật/Tắt API Key**
- Nhấn **"Bật"** hoặc **"Tắt"**
- Chỉ keys **đang bật** và **hợp lệ** mới được sử dụng

### **Xóa API Key**
- Nhấn biểu tượng **🗑️**
- Xác nhận xóa
- ⚠️ **Lưu ý:** Không thể khôi phục sau khi xóa

---

## 📊 **GIỚI HẠN VÀ CHI PHÍ**

### **Google Gemini (Miễn phí)**

| Loại | Giới hạn | Ghi chú |
|-------|----------|---------|
| **Requests/phút** | 60 | Đủ cho sử dụng thông thường |
| **Requests/ngày** | 1,500 | Reset hàng ngày |
| **Chi phí** | $0 | Hoàn toàn miễn phí |
| **Chất lượng** | Tốt | Phù hợp tư vấn ADR |

### **OpenAI ChatGPT (Có phí)**

| Model | Chi phí Input | Chi phí Output | Ghi chú |
|--------|---------------|----------------|---------|
| **GPT-4** | $0.03/1K tokens | $0.06/1K tokens | Chất lượng cao nhất |
| **GPT-3.5** | $0.0015/1K tokens | $0.002/1K tokens | Rẻ hơn, vẫn tốt |

**Ước tính chi phí:**
- 1 cuộc chat = ~500-1000 tokens
- 1 cuộc chat GPT-4 = ~$0.03-0.06
- 1 cuộc chat GPT-3.5 = ~$0.001-0.003

---

## 🆘 **TROUBLESHOOTING**

### **Lỗi: "Bạn chưa cấu hình API key"**

**Nguyên nhân:** Chưa thêm API key hoặc key bị vô hiệu hóa

**Giải pháp:**
1. Vào **Settings → API Keys**
2. Thêm API key mới hoặc bật key hiện có
3. Test key để đảm bảo hoạt động
4. Quay lại chatbot thử lại

### **Lỗi: "API key không hợp lệ"**

**Nguyên nhân:** API key sai hoặc đã bị thu hồi

**Giải pháp:**
1. Kiểm tra API key đã copy đúng chưa
2. Tạo API key mới từ provider
3. Cập nhật trong Settings
4. Test lại

### **Lỗi: "Rate limit exceeded"**

**Nguyên nhân:** Vượt quota của provider

**Giải pháp:**
- **Gemini:** Đợi 1 phút rồi thử lại
- **OpenAI:** Kiểm tra billing account
- Giảm tần suất sử dụng

### **Chatbot không phản hồi**

**Kiểm tra:**
1. Đã điền đủ thông tin Patient + ADR chưa?
2. API key có đang hoạt động không?
3. Kết nối internet ổn định không?
4. Thử refresh trang và chat lại

---

## 🔒 **BẢO MẬT VÀ QUYỀN RIÊNG TƯ**

### **An toàn API Key**
- ✅ API keys được **mã hóa** trước khi lưu database
- ✅ Chỉ bạn mới thấy được keys của mình
- ✅ Admin không thể xem API keys của user
- ✅ Keys được truyền an toàn qua HTTPS

### **Quyền riêng tư dữ liệu**
- ✅ Chỉ thông tin ADR cần thiết được gửi đến AI
- ✅ Không gửi thông tin cá nhân nhạy cảm
- ✅ Chat history không được lưu vĩnh viễn
- ✅ Tuân thủ quy định GDPR và HIPAA

### **Khuyến nghị bảo mật**
- 🔒 Không chia sẻ API key với ai
- 🔒 Thường xuyên kiểm tra usage ở provider
- 🔒 Thu hồi key cũ khi không dùng nữa
- 🔒 Báo ngay nếu nghi ngờ key bị lộ

---

## 📚 **TÀI LIỆU THAM KHẢO**

### **Hướng dẫn chi tiết**
- 📖 [Cách lấy Google Gemini API key](./AI-CHATBOT-GEMINI-SETUP.md)
- 📖 [Cách lấy OpenAI API key](./AI-CHATBOT-OPENAI-SETUP.md)
- 📖 [WHO-UMC Causality Assessment](./who-umc-guidelines.md)
- 📖 [Naranjo Scale Guide](./naranjo-scale-guide.md)

### **Resources Provider**
- 🔗 [Google AI Studio](https://aistudio.google.com/app/apikey)
- 🔗 [OpenAI Platform](https://platform.openai.com/api-keys)
- 🔗 [Gemini Pricing](https://ai.google.dev/pricing)
- 🔗 [OpenAI Pricing](https://openai.com/pricing)

---

## 🎓 **EXAMPLES - CÁC CASE STUDY MẪU**

### **Case 1: ADR nặng với nhiều thuốc**

**Input vào form:**
- Patient: Nam, 65 tuổi, 70kg
- Drugs: Aspirin, Warfarin, Metformin
- ADR: Chảy máu dạ dày nghiêm trọng

**Câu hỏi hay:**
```
"Phân tích mối liên quan của từng thuốc với chảy máu dạ dày theo thang WHO-UMC. Thuốc nào có khả năng cao nhất?"
```

**Kết quả mong đợi:**
- Aspirin: Probable/Certain (cơ chế rõ ràng)
- Warfarin: Probable (tương tác thuốc)
- Metformin: Unlikely (không liên quan)

### **Case 2: ADR da liễu**

**Input vào form:**
- Patient: Nữ, 30 tuổi
- Drug: Amoxicillin
- ADR: Phát ban toàn thân sau 3 ngày dùng thuốc

**Câu hỏi hay:**
```
"Tính điểm Naranjo chi tiết và đưa ra khuyến nghị xử trí cấp tính cho bệnh nhân này"
```

---

## 📞 **HỖ TRỢ**

### **Khi nào cần hỗ trợ?**
- Không thể thêm được API key
- AI trả lời không chính xác hoặc lạ
- Vấn đề về billing/chi phí
- Lỗi kỹ thuật khác

### **Cách liên hệ:**
- 📧 Email: support@adr-system.com
- 💬 Chat: Trong hệ thống (góc phải dưới)
- 📱 Hotline: 1900-ADR-HELP

### **Thông tin cần cung cấp:**
- Tên đăng nhập
- Provider đang dùng (Gemini/OpenAI)
- Mô tả lỗi chi tiết
- Screenshot nếu có

---

**📅 Cập nhật:** Tháng 10, 2025  
**🔄 Version:** 2.0 - Personal API Keys  
**👥 Team:** Codex-ADR Development

---

**🎉 Chúc bạn sử dụng AI Chatbot hiệu quả và an toàn!** 🚀


