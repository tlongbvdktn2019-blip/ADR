# 🔓 THIẾT LẬP PUBLIC ACCESS CHO THẺ DỊ ỨNG

## 📌 TÓM TẮT

Để cho phép **quét QR và bổ sung thông tin thẻ dị ứng KHÔNG CẦN đăng nhập**, bạn cần chạy migration SQL.

## ⚡ NHANH CHÓNG - Chỉ 3 bước

### Bước 1️⃣: Truy cập Supabase Dashboard

1. Mở https://supabase.com
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)

### Bước 2️⃣: Chạy Migration

1. Mở file: `supabase/ENABLE-PUBLIC-ACCESS-ALLERGY-UPDATES.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL Editor
4. Nhấn **RUN** (hoặc Ctrl + Enter)
5. Đợi kết quả: `✅ Public access enabled!`

### Bước 3️⃣: Test thử

1. Mở browser ở chế độ **Incognito** (không đăng nhập)
2. Truy cập: `https://your-app.com/allergy-cards/[id]`
3. Thử nhấn nút **"Bổ sung thông tin"**
4. Nếu mở được form → **Thành công!** 🎉

## 📁 CÁC FILE QUAN TRỌNG

| File | Mục đích |
|------|----------|
| `supabase/ENABLE-PUBLIC-ACCESS-ALLERGY-UPDATES.sql` | ⭐ **CHẠY FILE NÀY** để enable public access |
| `supabase/TEST-PUBLIC-ACCESS.sql` | Kiểm tra xem đã setup đúng chưa |
| `docs/HUONG-DAN-THIET-LAP-PUBLIC-ACCESS.md` | Hướng dẫn chi tiết đầy đủ |

## ✅ SAU KHI SETUP

Khi đã chạy xong migration, hệ thống sẽ cho phép:

✅ **Xem thẻ dị ứng** - Ai cũng có thể xem khi quét QR  
✅ **Xem lịch sử bổ sung** - Timeline công khai  
✅ **Bổ sung thông tin** - Sau khi nhập đúng mã thẻ  

## 🔒 BẢO MẬT

- ✅ Chỉ người có **mã thẻ** mới bổ sung được
- ✅ Lưu đầy đủ **thông tin người bổ sung** (tên, tổ chức, SĐT)
- ✅ **Không thể xóa** lịch sử sau khi bổ sung
- ✅ Có trường `is_verified` để admin xác minh sau

## 💡 USE CASE

**Bệnh nhân đến cấp cứu tại bệnh viện B:**
1. Bác sĩ quét QR trên thẻ dị ứng
2. Xem thông tin dị ứng hiện có
3. Phát hiện dị ứng mới → Bổ sung ngay
4. Không cần đăng nhập, không mất thời gian
5. Lịch sử được lưu, bệnh viện A có thể xem sau

## ❓ NẾU GẶP VẤN ĐỀ

Xem hướng dẫn chi tiết tại:
👉 `docs/HUONG-DAN-THIET-LAP-PUBLIC-ACCESS.md`

Hoặc chạy file test:
👉 `supabase/TEST-PUBLIC-ACCESS.sql`

---

**Tạo bởi**: AI Assistant  
**Ngày**: 18/11/2024  
**Mục đích**: Thiết lập tính năng bổ sung thông tin thẻ dị ứng không cần đăng nhập


