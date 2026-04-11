# Fix: Lỗi "Cuộc thi không tồn tại" khi làm bài

## 🆕 Công cụ Debug mới (Khuyến nghị)

**Cách nhanh nhất để khắc phục:**
1. Đăng nhập Admin
2. Truy cập `/admin/debug-contest`
3. Xem cuộc thi nào hiển thị màu đỏ ❌
4. Click nút **Fix** hoặc làm theo hướng dẫn

📖 **Chi tiết:** Xem [CONTEST-DEBUG-TOOL-GUIDE.md](./CONTEST-DEBUG-TOOL-GUIDE.md)

---

## 🔍 Vấn đề

Khi tạo cuộc thi mới và thử đăng ký làm bài, hệ thống báo lỗi:
- "Cuộc thi không tồn tại"
- "Không đủ câu hỏi"
- Cuộc thi không hiển thị trên trang công khai

## 🎯 Nguyên nhân

### 1. **Logic kiểm tra start_date/end_date quá chặt**
Trước đây, API yêu cầu:
```typescript
.lte('start_date', now)  // PHẢI có start_date và <= now
.gte('end_date', now)    // PHẢI có end_date và >= now
```

**Vấn đề:**
- Nếu không điền `start_date` hoặc `end_date` → giá trị NULL
- Supabase filter `.lte(null)` và `.gte(null)` sẽ loại bỏ record này
- → Cuộc thi không xuất hiện!

### 2. **Trường `is_public` không được set đúng**
**Vấn đề:**
- Cuộc thi cần có `is_public = true` để hiển thị công khai
- Nếu `is_public = false` hoặc `NULL` → cuộc thi không xuất hiện
- → API `/api/contest/active` không trả về cuộc thi này

**Nguyên nhân:**
- Khi tạo cuộc thi, có thể trường này không được set đúng
- Hoặc bị sửa thành `false` trong quá trình chỉnh sửa

**Giải pháp:**
- Dùng công cụ Debug (`/admin/debug-contest`) để phát hiện và fix 1-click
- Hoặc cập nhật trực tiếp trong database

### 3. **Chưa import câu hỏi vào ngân hàng cuộc thi**
- Cuộc thi cần có câu hỏi trong bảng `contest_questions`
- Nếu chưa import → báo lỗi "Không đủ câu hỏi"

## ✅ Giải pháp đã triển khai

### **1. Cải thiện logic kiểm tra thời gian**

**File cập nhật:**
- `app/api/contest/active/route.ts`
- `app/api/contest/questions/route.ts`
- `app/api/contest/register/route.ts`

**Logic mới:**

```typescript
// Trước: Dùng Supabase filter (không xử lý null)
.lte('start_date', now)
.gte('end_date', now)

// Sau: Lấy tất cả, filter trong code
const validContest = contests?.find((contest: any) => {
  // Nếu có start_date, kiểm tra đã bắt đầu chưa
  if (contest.start_date && contest.start_date > now) {
    return false;
  }
  // Nếu có end_date, kiểm tra đã kết thúc chưa
  if (contest.end_date && contest.end_date < now) {
    return false;
  }
  return true; // OK nếu không có hoặc hợp lệ
});
```

**Lợi ích:**
- ✅ Hỗ trợ cuộc thi không có `start_date` (bắt đầu ngay)
- ✅ Hỗ trợ cuộc thi không có `end_date` (không giới hạn thời gian)
- ✅ Vẫn kiểm tra đúng nếu có giá trị

### **2. Cải thiện thông báo lỗi**

Thông báo lỗi rõ ràng hơn để dễ debug:

```typescript
// Nếu thiếu câu hỏi
error: `Không đủ câu hỏi. Cần ${numberOfQuestions} câu nhưng chỉ có ${allQuestions?.length || 0} câu trong ngân hàng cuộc thi`

// Nếu chưa bắt đầu
error: 'Cuộc thi chưa bắt đầu'

// Nếu đã kết thúc
error: 'Cuộc thi đã kết thúc'
```

## 📋 Checklist khắc phục

Nếu gặp lỗi "Cuộc thi không tồn tại", hãy kiểm tra theo thứ tự:

### ✅ **Bước 1: Kiểm tra trạng thái cuộc thi**

1. Đăng nhập admin → `/admin/contest-management`
2. Kiểm tra cuộc thi có:
   - ✅ Status = **"active"** (màu xanh)
   - ✅ `is_public` = **true**
3. Nếu chưa active → Click nút **"Kích hoạt"**

### ✅ **Bước 2: Kiểm tra ngày bắt đầu/kết thúc**

⚠️ **LỖI PHỔ BIẾN NHẤT:** Cuộc thi đã kết thúc vì `end_date` trong quá khứ!

**Kiểm tra trong SQL:**
```sql
SELECT 
  title,
  start_date,
  end_date,
  NOW() as current_time,
  CASE
    WHEN start_date > NOW() THEN '❌ Chưa bắt đầu'
    WHEN end_date < NOW() THEN '❌ ĐÃ KẾT THÚC!'
    ELSE '✅ Đang diễn ra'
  END as time_status
FROM contests
WHERE status = 'active';
```

**Fix nhanh:**
```sql
-- Xóa giới hạn thời gian (KHUYẾN NGHỊ)
UPDATE contests
SET 
  start_date = NULL,
  end_date = NULL
WHERE id = 'your-contest-id';
```

**Lưu ý:**
- ✅ **Để trống (NULL)** → cuộc thi luôn khả dụng (KHUYẾN NGHỊ)
- ⚠️ Nếu điền → phải đảm bảo `start_date <= now <= end_date`
- 🚫 TRÁNH đặt `end_date` quá gần (ví dụ: 1 tiếng)

### ✅ **Bước 3: Kiểm tra câu hỏi trong ngân hàng**

**Quan trọng nhất!**

1. Truy cập admin: `/admin/contest-management`
2. Click nút **"Import Câu hỏi từ Excel"** (nút màu xanh lá)
3. Tải file Excel với format:
   ```
   | question_text | option_a | option_b | option_c | option_d | correct_answer | category | difficulty |
   |---------------|----------|----------|----------|----------|----------------|----------|------------|
   | Câu hỏi 1...  | Đáp án A | Đáp án B | Đáp án C | Đáp án D | A              | Dược    | medium     |
   ```
4. Import ít nhất **10 câu hỏi** (hoặc bằng số câu hỏi đã cấu hình)
5. Kiểm tra:
   - Các câu hỏi có `is_active = true`
   - Số lượng câu hỏi >= `number_of_questions` của cuộc thi

### ✅ **Bước 4: Test lại**

1. Mở tab ẩn danh hoặc trình duyệt khác
2. Truy cập: `https://your-domain.com/contest`
3. Kiểm tra cuộc thi có hiển thị không
4. Thử đăng ký và làm bài

## 🔧 Cách tạo cuộc thi đúng cách

### **Bước 1: Tạo cuộc thi**
1. Admin → `/admin/contest-management`
2. Click **"+ Tạo cuộc thi mới"**
3. Điền thông tin:
   - **Tên cuộc thi** (*)
   - **Số câu hỏi**: 10 (mặc định)
   - **Thời gian mỗi câu**: 20 giây
   - **Ngày bắt đầu**: Để trống hoặc chọn ngày hiện tại
   - **Ngày kết thúc**: Để trống hoặc chọn ngày tương lai
   - **Trạng thái**: **draft** (sẽ kích hoạt sau)
4. Click **"Tạo cuộc thi"**

### **Bước 2: Import câu hỏi**
1. Click **"Import Câu hỏi từ Excel"**
2. Tải file Excel mẫu (nếu có)
3. Chuẩn bị file Excel với format đúng
4. Import file
5. Kiểm tra thông báo thành công

### **Bước 3: Kích hoạt cuộc thi**
1. Tìm cuộc thi vừa tạo
2. Click nút **"Kích hoạt"** (màu xanh lá)
3. Trạng thái chuyển sang **"active"**

### **Bước 4: Test công khai**
1. Mở trình duyệt ẩn danh
2. Truy cập `/contest`
3. Đăng ký và làm bài thử

## 📊 So sánh trước và sau

| Trước | Sau |
|-------|-----|
| ❌ Cuộc thi không có start_date → không hiện | ✅ Cuộc thi không có start_date → hiện ngay |
| ❌ Cuộc thi không có end_date → không hiện | ✅ Cuộc thi không có end_date → luôn hiện |
| ❌ Lỗi không rõ ràng | ✅ Thông báo lỗi chi tiết |
| ❌ Khó debug | ✅ Dễ kiểm tra và khắc phục |

## 🐛 Troubleshooting

### **Lỗi: "Cuộc thi không tồn tại"**
→ Kiểm tra:
1. Status = "active"?
2. is_public = true?
3. start_date hợp lệ?

### **Lỗi: "Không đủ câu hỏi"**
→ Kiểm tra:
1. Đã import câu hỏi vào `contest_questions` chưa?
2. Số câu hỏi >= `number_of_questions` của cuộc thi?
3. Các câu hỏi có `is_active = true`?

### **Lỗi: "Cuộc thi chưa bắt đầu"**
→ Kiểm tra:
1. `start_date` có lớn hơn thời gian hiện tại không?
2. Để trống `start_date` nếu muốn bắt đầu ngay

### **Lỗi: "Cuộc thi đã kết thúc"**
→ Kiểm tra:
1. `end_date` có nhỏ hơn thời gian hiện tại không?
2. Để trống `end_date` nếu không giới hạn thời gian
3. Hoặc gia hạn `end_date` trong tương lai

## 🔍 Debug trong Database

Nếu vẫn không được, kiểm tra trực tiếp trong Supabase:

```sql
-- Kiểm tra cuộc thi
SELECT id, title, status, is_public, start_date, end_date, number_of_questions
FROM contests
WHERE status = 'active';

-- Kiểm tra số lượng câu hỏi
SELECT COUNT(*) as total_questions
FROM contest_questions
WHERE is_active = true;

-- Xem chi tiết câu hỏi
SELECT id, question_text, category, difficulty, is_active
FROM contest_questions
WHERE is_active = true
LIMIT 10;
```

## 📝 Lưu ý quan trọng

1. **Ngân hàng câu hỏi riêng biệt:**
   - `contest_questions` → Ngân hàng câu hỏi duy nhất được module cuộc thi sử dụng
   - **Không import sang bảng khác nếu muốn dùng cho cuộc thi.**

2. **Import câu hỏi:**
   - Phải import vào đúng ngân hàng `contest_questions`
   - Đảm bảo format Excel đúng
   - Kiểm tra `is_active = true`

3. **Thời gian:**
   - `start_date` và `end_date` là **optional**
   - Để trống nếu muốn linh hoạt
   - Điền nếu muốn kiểm soát chặt chẽ

---

**Ngày cập nhật:** 31/10/2025
**Version:** 1.0

