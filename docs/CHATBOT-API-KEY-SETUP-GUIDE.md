# Hướng Dẫn Setup API Key Trong ChatBot

## Tổng quan

Người dùng giờ đây có thể thêm API key cho ChatGPT hoặc Gemini trực tiếp trong giao diện AI ChatBot mà không cần phải vào trang Settings.

**🎉 MỚI: GUEST MODE** - Bây giờ có thể sử dụng ChatBot **KHÔNG CẦN ĐĂNG NHẬP**! 
- Guest users: API key lưu trong localStorage của trình duyệt
- Logged-in users: API key lưu an toàn trong database (encrypted)

👉 Xem chi tiết: [CHATBOT-GUEST-MODE-GUIDE.md](./CHATBOT-GUEST-MODE-GUIDE.md)

## Các tính năng đã thêm

### 1. **API Key Status Indicator**
- Hiển thị trạng thái API key ngay trên header của chatbot
- Badge "API Ready" (màu xanh) khi đã có API key
- Button "Setup Key" (màu vàng) khi chưa có API key

### 2. **Quick Setup Button**
- Khi thiếu API key, message lỗi sẽ hiển thị nút "Setup API Key Ngay"
- Click vào nút sẽ mở modal setup ngay lập tức
- Không cần chuyển trang hoặc rời khỏi chatbot

### 3. **API Key Setup Modal**
Modal bao gồm:
- **Header có màu gradient** với icon của provider (ChatGPT hoặc Gemini)
- **Hướng dẫn chi tiết** để lấy API key từ trang web của provider
- **Link trực tiếp** đến trang tạo API key
- **Input field** để nhập API key (password field để bảo mật)
- **Optional name field** để đặt tên cho key
- **Thông báo bảo mật** về việc mã hóa API key
- **Validation** format API key trước khi lưu

### 4. **Auto Refresh**
- Sau khi thêm API key thành công, hệ thống tự động refresh trạng thái
- Badge "API Ready" xuất hiện ngay lập tức
- Người dùng có thể bắt đầu chat ngay

## Cách sử dụng

### Cho người dùng:

1. **Mở AI ChatBot** từ trang báo cáo ADR
2. **Kiểm tra trạng thái API key** ở header:
   - Nếu thấy "API Ready" → có thể chat ngay
   - Nếu thấy "Setup Key" → cần setup trước
3. **Click "Setup Key"** hoặc nút trong error message
4. **Làm theo hướng dẫn** trong modal:
   - Click link để mở trang tạo API key
   - Copy API key từ OpenAI Platform hoặc Google AI Studio
   - Paste vào input field
   - (Tùy chọn) Đặt tên cho key
5. **Click "Lưu API Key"**
6. **Chờ validation** (hệ thống sẽ kiểm tra format)
7. **Bắt đầu chat!**

### Cho ChatGPT (OpenAI):
- Format: `sk-proj-...` hoặc `sk-...`
- Website: https://platform.openai.com/api-keys
- Yêu cầu: Tài khoản OpenAI với credits

### Cho Gemini:
- Format: `AIzaSy...`
- Website: https://aistudio.google.com/app/apikey
- Free tier: 60 requests/phút, 1500/ngày

## Luồng hoạt động

```
User opens ChatBot
    ↓
System checks API keys (useEffect)
    ↓
Display status in header
    ↓
User tries to chat without API key
    ↓
Error message với "Setup API Key Ngay" button
    ↓
User clicks button → Modal opens
    ↓
User enters API key
    ↓
Submit → Validation → Save to DB (encrypted)
    ↓
Success toast → Modal closes → Status updates
    ↓
User can chat immediately
```

## API & Services sử dụng

### Frontend:
- **Component**: `components/ai/AIChatbot.tsx`
  - `APIKeySetupModal` sub-component
  - `checkAPIKeys()` function
  - State management cho modal và API key status

### Backend:
- **Service**: `lib/user-api-key-service.ts`
  - `getUserAPIKeys()` - Lấy danh sách keys
  - `addAPIKey()` - Thêm key mới
  - `validateAPIKeyFormat()` - Validate format

- **API Route**: `app/api/user/api-keys/route.ts`
  - `GET /api/user/api-keys` - Lấy keys của user
  - `POST /api/user/api-keys` - Tạo key mới

### Database:
- Table: `user_api_keys`
- Columns:
  - `id`, `user_id`, `provider`, `encrypted_api_key`
  - `api_key_name`, `is_active`, `is_valid`
  - `created_at`, `updated_at`

## Bảo mật

1. **Authentication Required** - Kiểm tra session trước mọi API call
2. **API keys được mã hóa** trước khi lưu vào database
3. **Password input field** để ẩn key khi nhập
4. **Validation** format để tránh lỗi
5. **User-specific keys** - mỗi user có keys riêng
6. **Server-side encryption** sử dụng `UserAPIKeyServer`

### Authentication Checks:
- ChatBot component kiểm tra `useSession()` từ NextAuth
- Hiển thị loading state khi đang kiểm tra session
- Hiển thị warning "Yêu cầu đăng nhập" nếu chưa login
- API Key Modal cũng kiểm tra session trước khi submit
- Tất cả API routes yêu cầu valid session

## Lưu ý quan trọng

### Cho developers:
- API keys được mã hóa bằng base64 (demo purpose)
- **Production**: Nên dùng encryption mạnh hơn (crypto-js, AES-256)
- Keys chỉ được giải mã server-side khi cần sử dụng
- Không bao giờ expose decrypted keys ra client

### Cho users:
- Mỗi provider cần một API key riêng
- API keys có thể expire hoặc bị vô hiệu hóa
- Kiểm tra credits/quota của provider thường xuyên
- Không chia sẻ API keys với người khác

## Troubleshooting

### "Unauthorized" hoặc "Error 401"
**Nguyên nhân:** Người dùng chưa đăng nhập hoặc session đã hết hạn.

**Giải pháp:**
1. Kiểm tra trạng thái đăng nhập ở header
2. Đăng xuất và đăng nhập lại
3. Clear cookies và thử lại
4. Kiểm tra console để xem session status

### "Invalid API key format"
- **OpenAI**: Đảm bảo key bắt đầu bằng `sk-`
- **Gemini**: Đảm bảo key bắt đầu bằng `AIzaSy`

### "Không thể thêm API key"
- Kiểm tra kết nối mạng
- Kiểm tra session đăng nhập (quan trọng!)
- Xem console log để debug
- Thử refresh trang

### API key không hoạt động
- Test key trực tiếp trên trang provider
- Kiểm tra credits/quota còn lại
- Tạo key mới nếu cần

### ChatBot hiển thị "Yêu cầu đăng nhập"
- Đây là message bình thường khi chưa đăng nhập
- Click "Đóng" và đăng nhập vào hệ thống
- Sau đó mở lại ChatBot

## Cải tiến trong tương lai

- [ ] Test API key ngay trong modal trước khi lưu
- [ ] Hiển thị usage stats của API key
- [ ] Cảnh báo khi sắp hết quota
- [ ] Multi-key support cho failover
- [ ] Rotate keys tự động
- [ ] Export/Import keys (encrypted)

## Screenshots

### 1. API Key Status Badge
Header của chatbot hiển thị:
- ✅ "API Ready" khi có key
- ⚠️ "Setup Key" khi chưa có key

### 2. Error Message với Setup Button
Khi chat mà chưa có key:
- Message lỗi rõ ràng
- Button "Setup API Key Ngay" nổi bật
- Màu warning (đỏ/cam) để thu hút attention

### 3. Setup Modal
- Header gradient đẹp mắt
- Hướng dẫn từng bước
- Link trực tiếp đến provider
- Input fields rõ ràng
- Security note để trấn an user

## Kết luận

Tính năng này giúp người dùng:
- ✅ Setup API key nhanh chóng ngay trong chatbot
- ✅ Không cần rời khỏi workflow đang làm việc
- ✅ Có hướng dẫn chi tiết và rõ ràng
- ✅ Cảm thấy an tâm về bảo mật
- ✅ Bắt đầu sử dụng AI ngay lập tức sau setup

Trải nghiệm người dùng được cải thiện đáng kể!

