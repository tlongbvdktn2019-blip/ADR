# HƯỚNG DẪN QUẢN LÝ CÂU HỎI CUỘC THI

## Tổng quan

Tính năng **Quản lý Câu hỏi Cuộc thi** cho phép Admin xem, tìm kiếm và xóa các câu hỏi trong ngân hàng câu hỏi cuộc thi. Ngân hàng này được quản lý độc lập trong bảng `contest_questions`.

## Truy cập

1. Đăng nhập với tài khoản Admin
2. Vào `/admin/contest-management`
3. Click nút **"Quản lý Câu hỏi"** (nút màu cam)

## Tính năng chính

### 1. Xem danh sách câu hỏi

- Hiển thị tất cả câu hỏi trong ngân hàng
- Mỗi câu hỏi bao gồm:
  - Nội dung câu hỏi
  - 4 đáp án (A, B, C, D)
  - Đáp án đúng (được highlight màu xanh)
  - Giải thích (nếu có)
  - Điểm số
  - Thống kê sử dụng:
    - Số lần được dùng trong cuộc thi
    - Số lần được trả lời
    - Tỷ lệ trả lời đúng (%)
  - Trạng thái (Active/Inactive)

### 2. Tìm kiếm câu hỏi

- Sử dụng ô tìm kiếm ở trên cùng
- Tìm kiếm theo:
  - Nội dung câu hỏi
  - Giải thích
- Kết quả hiển thị real-time

### 3. Xóa câu hỏi

#### Xóa từng câu hỏi

1. Click nút **"🗑️ Xóa"** ở cột "Thao tác"
2. Xác nhận trong popup
3. Câu hỏi sẽ bị xóa khỏi ngân hàng

#### Xóa nhiều câu hỏi cùng lúc

1. Tích checkbox ở đầu mỗi câu hỏi muốn xóa
2. Hoặc tích checkbox ở header để chọn tất cả câu hỏi trên trang hiện tại
3. Click nút **"Xóa đã chọn (n)"** ở trên cùng
4. Xác nhận trong popup
5. Tất cả câu hỏi đã chọn sẽ bị xóa

### 4. Phân trang

- Mỗi trang hiển thị 20 câu hỏi
- Sử dụng nút **"← Trước"** và **"Sau →"** để chuyển trang
- Hiển thị thông tin: "Trang x / y (Tổng: z câu hỏi)"

## Lưu ý quan trọng

### ⚠️ Xóa câu hỏi an toàn

- **Câu hỏi đã sử dụng trong cuộc thi:** Khi bạn xóa câu hỏi khỏi ngân hàng, nó **KHÔNG ẢNH HƯỞNG** đến các bài thi đã nộp.
- Lý do: Câu hỏi được snapshot (lưu lại toàn bộ) trong bảng `contest_submissions` dưới dạng JSONB.
- Các cuộc thi đang diễn ra: Nếu câu hỏi đã được chọn ngẫu nhiên cho người dùng đang làm bài, họ vẫn có thể tiếp tục.

### 📊 Thống kê sử dụng

- **Số lần được dùng:** Số lần câu hỏi xuất hiện trong các cuộc thi
- **Số lần được trả lời:** Tổng số lần người dùng trả lời câu này
- **Tỷ lệ đúng:** Giúp đánh giá độ khó của câu hỏi
  - Tỷ lệ thấp: Câu hỏi khó hoặc gây nhầm lẫn
  - Tỷ lệ cao: Câu hỏi dễ

### 🔄 Quan hệ với các tính năng khác

1. **Import Excel:** Thêm câu hỏi mới vào ngân hàng
2. **Tạo cuộc thi:** Khi tạo cuộc thi, hệ thống sẽ chọn ngẫu nhiên từ ngân hàng này
3. **Làm bài thi:** Người dùng nhận câu hỏi ngẫu nhiên từ ngân hàng

## Cấu trúc Database

### Bảng: `contest_questions`

```sql
CREATE TABLE contest_questions (
  id UUID PRIMARY KEY,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,  -- [{"key":"A","text":"..."},...]
  correct_answer VARCHAR(1) CHECK (correct_answer IN ('A','B','C','D')),
  explanation TEXT,
  points_value INTEGER DEFAULT 10,
  times_used INTEGER DEFAULT 0,
  times_answered INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## API Endpoints

### GET `/api/admin/contest/questions`

**Lấy danh sách câu hỏi**

Query Parameters:
- `page`: Số trang (default: 1)
- `limit`: Số câu hỏi mỗi trang (default: 50)
- `search`: Từ khóa tìm kiếm

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "question_text": "...",
      "options": [...],
      "correct_answer": "A",
      "explanation": "...",
      "points_value": 10,
      "times_used": 5,
      "times_answered": 45,
      "times_correct": 32,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

### DELETE `/api/admin/contest/questions`

**Xóa nhiều câu hỏi**

Body:
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

Response:
```json
{
  "success": true,
  "message": "Đã xóa 3 câu hỏi thành công"
}
```

### DELETE `/api/admin/contest/questions/[id]`

**Xóa một câu hỏi**

Response:
```json
{
  "success": true,
  "message": "Đã xóa câu hỏi thành công"
}
```

## Best Practices

### 1. Kiểm tra trước khi xóa

- Xem thống kê sử dụng
- Câu hỏi có `times_used > 0` nghĩa là đã được dùng trong cuộc thi
- Cân nhắc kỹ trước khi xóa câu hỏi phổ biến

### 2. Quản lý chất lượng

- Dùng tỷ lệ đúng để đánh giá độ khó
- Xóa câu hỏi lỗi hoặc không rõ ràng
- Câu hỏi có tỷ lệ đúng quá cao (>95%) hoặc quá thấp (<10%) cần review

### 3. Backup trước khi xóa hàng loạt

- Nếu cần xóa nhiều câu hỏi, hãy backup database trước
- Sử dụng chức năng tìm kiếm để lọc chính xác

### 4. Kết hợp với Import

- Thường xuyên import câu hỏi mới
- Xóa câu hỏi cũ, lỗi hoặc lạc hậu
- Duy trì ngân hàng câu hỏi chất lượng cao

## Troubleshooting

### Lỗi: "Không thể tải danh sách câu hỏi"

**Nguyên nhân:**
- Không có quyền admin
- Database connection issue

**Giải pháp:**
- Kiểm tra role của user
- Kiểm tra Supabase connection
- Xem console log

### Lỗi: "Lỗi khi xóa câu hỏi"

**Nguyên nhân:**
- Foreign key constraint (hiếm khi xảy ra)
- Database permission issue

**Giải pháp:**
- Kiểm tra Supabase RLS policies
- Xem error details trong console

### Không có câu hỏi nào hiển thị

**Nguyên nhân:**
- Chưa import câu hỏi vào ngân hàng

**Giải pháp:**
- Sử dụng chức năng "Import Câu hỏi từ Excel"
- Hoặc insert trực tiếp vào database

## UI Components

### Component: `ContestQuestionsManager.tsx`

Location: `components/admin/ContestQuestionsManager.tsx`

Features:
- Modal full-screen với overflow
- Search box với debounce
- Checkbox selection (single & multiple)
- Pagination controls
- Delete confirmation
- Statistics display

### Styling

- Tailwind CSS
- Responsive design
- Toast notifications (react-hot-toast)
- Hover effects
- Color-coded status badges

## Security

### Authentication & Authorization

- Requires: `session.user.role === 'admin'`
- All API routes check admin role
- Supabase RLS policies enforce access control

### Data Validation

- Question ID validation
- Array validation for bulk delete
- SQL injection prevention (via Supabase client)

## Performance

- Pagination: 20 items per page (configurable)
- Index on `is_active` and `created_at`
- Efficient JSON queries on `options` field
- Frontend caching with React state

## Kết luận

Tính năng **Quản lý Câu hỏi Cuộc thi** giúp Admin dễ dàng:
- Xem toàn bộ ngân hàng câu hỏi
- Tìm kiếm câu hỏi cụ thể
- Xóa câu hỏi không còn cần thiết
- Đánh giá chất lượng qua thống kê

**Lưu ý:** Xóa câu hỏi an toàn, không ảnh hưởng đến kết quả đã nộp.

---

**Phát triển bởi:** Codex-ADR Team  
**Phiên bản:** 1.0.0  
**Ngày tạo:** 2025-11-01











