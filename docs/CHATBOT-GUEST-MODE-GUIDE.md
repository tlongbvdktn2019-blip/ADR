# Hướng Dẫn Guest Mode - AI Chatbot

## Tổng quan

**Guest Mode** cho phép người dùng sử dụng AI Chatbot **KHÔNG CẦN ĐĂNG NHẬP**! 🎉

Người dùng chỉ cần:
1. Mở ChatBot
2. Nhập API key của họ (OpenAI hoặc Gemini)
3. Bắt đầu chat ngay lập tức

API key sẽ được lưu trong **localStorage** của trình duyệt, không cần tài khoản.

## Tính năng Guest Mode

### ✅ Có thể làm gì:
- Sử dụng AI Chatbot đầy đủ tính năng
- Chọn giữa ChatGPT hoặc Gemini
- Lưu API key trong trình duyệt
- Nhận phân tích ADR chuyên nghiệp
- Sử dụng tất cả prompt suggestions

### ⚠️ Hạn chế:
- API key chỉ lưu trong trình duyệt hiện tại
- Key bị mất khi xóa cookies/cache
- Không sync giữa các thiết bị
- Không track usage history
- Mỗi lần đổi trình duyệt phải nhập lại key

### 💡 So sánh Guest vs Logged-in:

| Tính năng | Guest Mode | Logged-in Mode |
|-----------|-----------|----------------|
| Cần tài khoản | ❌ Không | ✅ Có |
| Sử dụng AI Chatbot | ✅ Có | ✅ Có |
| Lưu API key | localStorage | Database (mã hóa) |
| Sync nhiều thiết bị | ❌ Không | ✅ Có |
| Track usage | ❌ Không | ✅ Có |
| API key management | Đơn giản | Đầy đủ |
| Mất key khi clear cache | ✅ Có | ❌ Không |

## Cách sử dụng Guest Mode

### Bước 1: Mở ChatBot
- Không cần đăng nhập
- Click vào icon ChatBot ở góc màn hình

### Bước 2: Nhận biết Guest Mode
Header sẽ hiển thị badge:
```
👤 Guest Mode
```

Sidebar sẽ có thông báo:
```
Guest Mode
Bạn đang dùng chế độ Guest. API key sẽ lưu tạm trong trình duyệt.
💡 Đăng nhập để lưu key vĩnh viễn và sync trên nhiều thiết bị!
```

### Bước 3: Setup API Key
1. Click nút **"Setup Key"** ở header (màu vàng)
2. Chọn provider (ChatGPT hoặc Gemini đã được chọn sẵn)
3. Làm theo hướng dẫn trong modal:
   - Click link "Mở OpenAI/Gemini"
   - Tạo và copy API key
   - Paste vào input field
4. (Tùy chọn) Đặt tên cho key
5. Click **"Lưu API Key"**

### Bước 4: Bắt đầu Chat
- Badge "API Ready" (màu xanh) xuất hiện
- Nhập câu hỏi và chat ngay!

## Luồng hoạt động kỹ thuật

### Lưu trữ API Key

**Guest Mode:**
```javascript
localStorage.setItem('guest_openai_key', apiKey)
localStorage.setItem('guest_gemini_key', apiKey)
```

**Logged-in Mode:**
```javascript
// Lưu vào database qua API
POST /api/user/api-keys
{
  provider: 'openai',
  api_key: 'sk-...',
  api_key_name: 'My Key'
}
```

### Gọi AI API

**Guest Mode:**
```typescript
// Client gọi trực tiếp AI provider
const aiResponse = await AIChatbotService.sendMessageWithUserKey(
  message,
  context,
  'openai', // or 'gemini'
  guestAPIKey, // từ localStorage
  chatHistory
)
```

**Logged-in Mode:**
```typescript
// Client gọi server API
// Server lấy encrypted key từ database
// Server gọi AI provider với decrypted key
const response = await fetch('/api/ai/chatbot', {
  method: 'POST',
  body: JSON.stringify({ message, context, provider })
})
```

### Bảo mật Guest Mode

1. **API key không gửi qua server** khi là guest
2. **Client-side call** trực tiếp đến OpenAI/Gemini
3. **localStorage** chỉ truy cập được từ same-origin
4. **HTTPS** bảo vệ trong quá trình truyền tải
5. **Không có account** nên không lo bị hack tài khoản

### Trade-offs

**Ưu điểm:**
- ✅ Trải nghiệm nhanh, không cần đăng ký
- ✅ Dữ liệu không qua server (privacy)
- ✅ API key do người dùng kiểm soát hoàn toàn
- ✅ Giảm tải cho server

**Nhược điểm:**
- ⚠️ API key expose ra client-side code
- ⚠️ Không track được usage
- ⚠️ Dễ mất key khi clear cache
- ⚠️ Không sync giữa devices

## Implementation Details

### Component State Management

```typescript
const [guestAPIKeys, setGuestAPIKeys] = useState<{
  openai: string | null
  gemini: string | null
}>({ openai: null, gemini: null })
```

### Load từ localStorage
```typescript
useEffect(() => {
  if (isOpen && !session?.user?.id) {
    loadGuestAPIKeys()
  }
}, [isOpen, session?.user?.id])

const loadGuestAPIKeys = () => {
  const openaiKey = localStorage.getItem('guest_openai_key')
  const geminiKey = localStorage.getItem('guest_gemini_key')
  
  setGuestAPIKeys({
    openai: openaiKey,
    gemini: geminiKey
  })
  
  setHasAPIKey({
    openai: !!openaiKey,
    gemini: !!geminiKey
  })
}
```

### Save vào localStorage
```typescript
const saveGuestAPIKey = (provider: 'openai' | 'gemini', apiKey: string) => {
  localStorage.setItem(`guest_${provider}_key`, apiKey)
  setGuestAPIKeys(prev => ({ ...prev, [provider]: apiKey }))
  setHasAPIKey(prev => ({ ...prev, [provider]: true }))
}
```

### API Key Setup Modal

Modal nhận prop `isGuest`:
```typescript
<APIKeySetupModal
  provider="openai"
  isGuest={!session?.user?.id}
  onClose={...}
  onSuccess={(apiKey) => {
    if (!session?.user?.id) {
      saveGuestAPIKey('openai', apiKey)
    }
    toast.success('API key đã được lưu!')
  }}
/>
```

### Send Message Logic

```typescript
const sendMessage = async (messageText: string) => {
  const provider = selectedProvider === 'chatgpt' ? 'openai' : 'gemini'
  const isGuest = !session?.user?.id
  
  if (isGuest) {
    // Get key from localStorage
    const guestKey = provider === 'openai' 
      ? guestAPIKeys.openai 
      : guestAPIKeys.gemini
    
    if (!guestKey) {
      // Show setup prompt
      return
    }

    // Call AI directly from client
    const aiResponse = await AIChatbotService.sendMessageWithUserKey(
      messageText,
      context,
      provider,
      guestKey,
      messages
    )
    
    setMessages(prev => [...prev, aiResponse])
  } else {
    // Use server API for logged-in users
    const response = await fetch('/api/ai/chatbot', {
      method: 'POST',
      body: JSON.stringify({ message, context, provider })
    })
    // ...
  }
}
```

## UI/UX Enhancements

### Header Badge
```tsx
{!session?.user?.id && (
  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
    👤 Guest Mode
  </span>
)}
```

### Sidebar Notice
```tsx
{!session?.user?.id && (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
    <h4>Guest Mode</h4>
    <p>Bạn đang dùng chế độ Guest...</p>
    <p>💡 Đăng nhập để lưu key vĩnh viễn!</p>
  </div>
)}
```

### Setup Modal Notice
```tsx
{isGuest ? (
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
    <p>💾 Guest Mode: API key sẽ lưu trong trình duyệt...</p>
    <p>✨ Khuyến nghị: Đăng nhập để lưu key vĩnh viễn</p>
  </div>
) : (
  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
    <p>🔒 Bảo mật: API key mã hóa trong database</p>
  </div>
)}
```

## Testing Guest Mode

### Test Case 1: First-time Guest User
1. Mở ChatBot (chưa đăng nhập)
2. Verify: Badge "👤 Guest Mode" hiển thị
3. Verify: Button "Setup Key" màu vàng
4. Click "Setup Key"
5. Nhập Gemini API key: `AIzaSy...`
6. Click "Lưu API Key"
7. Verify: Toast "API key đã được lưu thành công!"
8. Verify: Badge "API Ready" màu xanh
9. Gửi message: "Phân tích case này"
10. Verify: Nhận response từ Gemini

### Test Case 2: Return Guest User
1. Close và mở lại ChatBot
2. Verify: API key vẫn còn (từ localStorage)
3. Verify: Badge "API Ready" hiển thị ngay
4. Verify: Có thể chat ngay không cần setup lại

### Test Case 3: Clear Cache
1. Clear browser cache/localStorage
2. Mở lại ChatBot
3. Verify: Phải setup key lại
4. Verify: Button "Setup Key" xuất hiện

### Test Case 4: Switch to Logged-in
1. Dùng guest mode với Gemini key
2. Đăng nhập vào hệ thống
3. Mở ChatBot
4. Verify: Badge "Guest Mode" biến mất
5. Verify: Cần setup key mới (database rỗng)
6. Setup key cho logged-in account
7. Verify: Key lưu vào database

### Test Case 5: Invalid API Key
1. Guest mode, nhập key sai format
2. Example: `abc123` cho OpenAI
3. Verify: Error "OpenAI API key phải bắt đầu bằng sk-"
4. Nhập key đúng format nhưng invalid
5. Verify: AI call fails với error từ provider

## Troubleshooting

### "API key bị mất sau khi đóng trình duyệt"
- **Nguyên nhân:** Browser settings xóa localStorage khi đóng
- **Giải pháp:** 
  - Check browser settings (Privacy)
  - Hoặc đăng nhập để lưu vĩnh viễn

### "Không thể lưu API key"
- **Nguyên nhân:** localStorage disabled hoặc full
- **Giải pháp:**
  - Enable localStorage trong browser settings
  - Clear một số data để giải phóng storage
  - Dùng Incognito mode thử

### "API key không work"
- **Kiểm tra:** 
  1. Format đúng chưa? (sk- cho OpenAI, AIzaSy cho Gemini)
  2. Key còn valid không? Test trên trang provider
  3. Credits/quota còn không?
  4. Console có error gì?

### "Muốn chuyển key từ guest sang logged-in"
- Hiện tại: Phải nhập lại key sau khi đăng nhập
- Tương lai: Có thể implement migration tool

## Best Practices

### Cho Users:
1. **Backup key:** Lưu API key ở nơi an toàn (password manager)
2. **Test key:** Đảm bảo key valid trước khi nhập
3. **Monitor quota:** Check usage trên trang provider
4. **Login khi có thể:** Để lưu key vĩnh viễn và sync devices

### Cho Developers:
1. **Validate input:** Check format trước khi lưu
2. **Error handling:** Clear messages cho user
3. **localStorage limits:** Check quota trước khi write
4. **Security:** Remind users về trade-offs
5. **Migration path:** Dễ dàng upgrade lên logged-in account

## Future Enhancements

- [ ] **Auto-migration:** Chuyển guest keys sang account khi login
- [ ] **Key testing:** Test key ngay trong modal trước khi lưu
- [ ] **Multiple keys:** Support nhiều keys cho redundancy
- [ ] **Usage tracking:** Track usage local (localStorage)
- [ ] **Export/Import:** Backup và restore keys
- [ ] **QR code login:** Quick login từ guest mode

## Kết luận

Guest Mode giúp:
- ✅ **Tăng conversion:** Dùng thử không cần tài khoản
- ✅ **Giảm friction:** Không cần đăng ký phức tạp
- ✅ **Privacy-friendly:** Data không qua server
- ✅ **Fast onboarding:** Từ landing page đến chat trong <60s

Nhưng vẫn khuyến khích users đăng nhập để:
- 🌟 Lưu key vĩnh viễn
- 🌟 Sync nhiều devices  
- 🌟 Track usage và optimize costs
- 🌟 Access full features

**The best of both worlds!** 🎉

