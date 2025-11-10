# 🗑️ HƯỚNG DẪN NHANH: XÓA CÂU HỎI CUỘC THI

## Truy cập

1. Vào `/admin/contest-management`
2. Click nút **"Quản lý Câu hỏi"** (màu cam 🧡)

## Các cách xóa

### ✅ Xóa 1 câu hỏi
- Click nút **"🗑️ Xóa"** bên phải câu hỏi
- Xác nhận → Xong!

### ✅ Xóa nhiều câu hỏi
1. Tích checkbox các câu hỏi muốn xóa
2. Click **"Xóa đã chọn (n)"** ở trên
3. Xác nhận → Xong!

### ✅ Tìm kiếm trước khi xóa
- Dùng ô tìm kiếm để lọc câu hỏi
- Sau đó xóa

## ⚠️ Lưu ý quan trọng

✓ **An toàn:** Xóa câu hỏi KHÔNG ảnh hưởng đến kết quả đã nộp  
✓ **Thống kê:** Xem "Số lần dùng" trước khi xóa  
✓ **Phân trang:** 20 câu/trang  

## 📊 Thông tin hiển thị

- Nội dung câu hỏi + 4 đáp án
- Đáp án đúng (màu xanh)
- Điểm số
- Thống kê: Đã dùng / Trả lời / Tỷ lệ đúng
- Trạng thái: Active/Inactive

## 🔗 Files liên quan

**API:**
- `app/api/admin/contest/questions/route.ts` (GET, DELETE nhiều)
- `app/api/admin/contest/questions/[id]/route.ts` (DELETE 1)

**Component:**
- `components/admin/ContestQuestionsManager.tsx`

**Page:**
- `app/admin/contest-management/page.tsx`

---

Chi tiết đầy đủ: Xem `CONTEST-QUESTIONS-MANAGEMENT-GUIDE.md`




