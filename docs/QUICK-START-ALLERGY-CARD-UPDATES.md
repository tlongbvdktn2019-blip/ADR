# ⚡ QUICK START - Bổ sung Thông tin Thẻ Dị Ứng

## 🎯 Mục đích
Cho phép **bất kỳ cơ sở y tế nào** bổ sung thông tin vào thẻ dị ứng khi bệnh nhân đến khám.

## 🚀 5 bước sử dụng

### 1️⃣ Quét QR hoặc truy cập trang thẻ
```
Quét QR trên thẻ → Nhấn link → Trang chi tiết thẻ
HOẶC
Truy cập: /allergy-cards/[id]
```

### 2️⃣ Nhấn nút "Bổ sung thông tin"
Nút màu xanh ở góc trên bên phải

### 3️⃣ Xác thực mã thẻ
```
Nhập mã thẻ (VD: AC-2024-000001)
→ Nhấn "Xác thực"
```

### 4️⃣ Điền thông tin
**Bắt buộc:**
- Tên người bổ sung
- Tổ chức/Bệnh viện  
- Cơ sở y tế (nơi khám hiện tại)

**Thêm dị ứng mới (nếu có):**
- Nhấn "Thêm dị ứng"
- Điền: Tên dị nguyên, Mức độ chắc chắn, Mức độ nghiêm trọng

### 5️⃣ Gửi
Nhấn "Bổ sung thông tin" → Hoàn tất!

## 📊 Xem lịch sử

Trên trang chi tiết thẻ → Cuộn xuống → **"Lịch sử bổ sung"**

Sẽ thấy timeline với:
- ⏰ Thời gian
- 👤 Người bổ sung
- 🏥 Cơ sở y tế
- 🔴 Dị ứng được thêm

## 🔐 Bảo mật

✅ Yêu cầu mã thẻ chính xác  
✅ Lưu đầy đủ thông tin người bổ sung  
✅ Không thể xóa sau khi bổ sung  

## 🗄️ Cài đặt Database

**Một lần duy nhất** - Chạy migration:

```sql
-- File: supabase/allergy-card-updates-schema.sql
-- Truy cập Supabase Dashboard → SQL Editor → Paste → Run
```

## 📁 Files quan trọng

```
📂 Tính năng bổ sung thông tin thẻ dị ứng
├── 🗄️ supabase/allergy-card-updates-schema.sql (Migration)
├── 📝 types/allergy-card.ts (Types mới)
├── 🔌 app/api/allergy-cards/[id]/updates/route.ts (API)
├── 🎨 app/allergy-cards/[id]/add-info/page.tsx (Form bổ sung)
└── 👁️ app/allergy-cards/[id]/page.tsx (Hiển thị lịch sử)
```

## ✨ Tính năng nổi bật

✅ **Public access** - Không cần đăng nhập  
✅ **Tự động cập nhật** - Dị ứng tự động thêm vào thẻ  
✅ **Lịch sử đầy đủ** - Timeline trực quan  
✅ **Xác thực an toàn** - Yêu cầu mã thẻ  

## 💡 Use Case phổ biến

**Bệnh nhân đến bệnh viện B (khác với bệnh viện A đã cấp thẻ):**

1. Bác sĩ B quét QR → Xem thông tin dị ứng hiện có
2. Phát hiện dị ứng mới → Bổ sung ngay
3. Lịch sử được lưu → Bệnh viện A có thể xem sau
4. Thông tin dị ứng luôn được cập nhật từ nhiều nguồn

## 📚 Tài liệu chi tiết

👉 Xem đầy đủ: `docs/ALLERGY-CARD-UPDATE-HISTORY-GUIDE.md`

---

**Version**: 1.0 | **Date**: 18/11/2024

