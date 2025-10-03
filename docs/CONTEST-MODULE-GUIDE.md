# HƯỚNG DẪN MODULE CUỘC THI KIẾN THỨC ADR

## Tổng quan

Module "Cuộc thi Kiến thức ADR" cho phép tổ chức các cuộc thi trắc nghiệm trực tuyến **không cần đăng nhập**. Người dùng chỉ cần điền thông tin cơ bản là có thể tham gia.

## Tính năng chính

### A. Dành cho người tham gia (Public)

1. **Landing Page** (`/contest`)
   - Hiển thị thông tin cuộc thi
   - Form đăng ký: Họ tên, Đơn vị, Khoa/Phòng
   - Thể lệ và giải thưởng

2. **Trang làm bài** (`/contest/quiz`)
   - Hiển thị 10 câu hỏi ngẫu nhiên (có thể cấu hình)
   - Đồng hồ đếm ngược cho mỗi câu (mặc định 20 giây)
   - Thanh tiến trình hiển thị câu hiện tại
   - Auto-save để phòng trường hợp tải lại trang
   - Tổng quan bài thi (câu đã trả lời/chưa trả lời)

3. **Trang kết quả** (`/contest/result`)
   - Hiển thị điểm số và thời gian hoàn thành
   - Xem lại đáp án chi tiết với giải thích
   - Chia sẻ kết quả lên mạng xã hội
   - Link đến bảng xếp hạng

4. **Bảng xếp hạng** (`/contest/leaderboard`)
   - Hiển thị Top 3 với podium đẹp mắt
   - Bảng xếp hạng đầy đủ với phân trang
   - Tìm kiếm theo tên
   - Lọc theo Đơn vị, Khoa/Phòng
   - Toggle hiển thị Top 10 hoặc tất cả

### B. Dành cho Admin

1. **Quản lý Cuộc thi** (`/admin/contest-management`)
   - Tạo/sửa/xóa cuộc thi
   - Cấu hình số câu hỏi, thời gian
   - Kích hoạt/kết thúc cuộc thi
   - Xem danh sách tất cả cuộc thi

2. **Thống kê Cuộc thi** (`/admin/contest-management/[id]`)
   - Tổng số người tham gia
   - Điểm trung bình
   - Tỷ lệ hoàn thành
   - Phân phối điểm
   - Top 10 người xuất sắc
   - Thống kê theo đơn vị
   - Danh sách bài thi đã nộp

3. **Quản lý Đơn vị & Khoa/Phòng** (`/admin/departments`)
   - Thêm/sửa/xóa đơn vị
   - Thêm/sửa/xóa khoa/phòng
   - Bật/tắt trạng thái hoạt động

## Cài đặt và Triển khai

### Bước 1: Chạy Migration Database

```bash
# Chạy file SQL để tạo bảng
psql -d your_database < supabase/create-contest-tables.sql
```

Hoặc trong Supabase Dashboard:
1. Vào SQL Editor
2. Copy nội dung file `supabase/create-contest-tables.sql`
3. Run query

### Bước 2: Kiểm tra Types

File types đã được tạo tại: `types/contest.ts`

### Bước 3: Cấu hình Routes

**API Routes:**
- `/api/contest/*` - Public APIs
- `/api/admin/contest/*` - Admin APIs
- `/api/admin/departments` - Quản lý đơn vị
- `/api/admin/units` - Quản lý khoa/phòng

**Page Routes:**
- `/contest` - Landing page
- `/contest/quiz` - Làm bài thi
- `/contest/result` - Kết quả
- `/contest/leaderboard` - Bảng xếp hạng
- `/admin/contest-management` - Quản lý cuộc thi (Admin)
- `/admin/departments` - Quản lý đơn vị (Admin)

### Bước 4: Tạo Cuộc thi Đầu tiên

1. Đăng nhập với tài khoản Admin
2. Truy cập `/admin/contest-management`
3. Click "Tạo cuộc thi mới"
4. Điền thông tin:
   - Tên cuộc thi
   - Số câu hỏi (mặc định 10)
   - Thời gian mỗi câu (mặc định 20 giây)
   - Thời gian bắt đầu và kết thúc
5. Click "Tạo cuộc thi"
6. Click "Kích hoạt" để công khai cuộc thi

### Bước 5: Thêm Đơn vị và Khoa/Phòng

1. Truy cập `/admin/departments`
2. Tab "Đơn vị": Thêm các bệnh viện/tổ chức
3. Tab "Khoa/Phòng": Thêm các khoa/phòng thuộc đơn vị

**Lưu ý:** File SQL đã có sẵn sample data. Bạn có thể sử dụng hoặc xóa đi.

## Cấu trúc Database

### Bảng chính:

1. **departments** - Đơn vị (bệnh viện, trường...)
2. **units** - Khoa/phòng
3. **contests** - Cuộc thi
4. **contest_participants** - Người tham gia
5. **contest_submissions** - Bài thi đã nộp
6. **contest_answers** - Câu trả lời chi tiết
7. **contest_leaderboard** (VIEW) - Bảng xếp hạng

### Quan hệ:

```
departments (1) ---> (*) units
contests (1) ---> (*) contest_participants
contest_participants (1) ---> (*) contest_submissions
contest_submissions (1) ---> (*) contest_answers
quiz_questions (1) <--- (*) contest_answers
```

## Flow hoạt động

### Flow người dùng:

1. Truy cập `/contest`
2. Điền form đăng ký (Họ tên, Đơn vị, Khoa/Phòng)
3. Click "Bắt đầu làm bài"
4. Hệ thống tạo `contest_participant` và chọn ngẫu nhiên câu hỏi
5. Làm bài thi với đồng hồ đếm ngược
6. Nộp bài → Hệ thống chấm điểm
7. Xem kết quả và đáp án chi tiết
8. Xem bảng xếp hạng

### Flow admin:

1. Tạo cuộc thi với cấu hình
2. Thêm đơn vị và khoa/phòng (nếu chưa có)
3. Kích hoạt cuộc thi
4. Theo dõi thống kê real-time
5. Xem danh sách bài thi
6. Kết thúc cuộc thi khi hết hạn

## Tính năng nổi bật

### 1. Auto-save

Hệ thống tự động lưu tiến trình vào `localStorage`:
- Câu trả lời hiện tại
- Câu đang làm
- Thời gian đã trôi qua

Nếu người dùng vô tình reload trang, họ có thể tiếp tục từ câu đã làm.

### 2. Leaderboard thông minh

Xếp hạng dựa trên:
1. Điểm số (cao hơn = xếp trước)
2. Thời gian (nếu điểm bằng nhau, nhanh hơn = xếp trước)

### 3. RLS (Row Level Security)

- Public: Đọc departments, units, contests active, leaderboard
- Public: Insert participants, submissions, answers (không cần auth)
- Admin: Full CRUD tất cả bảng

### 4. Thống kê chi tiết

Admin có thể xem:
- Phân phối điểm số
- Thống kê theo đơn vị
- Top performers
- Average score & time

## Customization

### Thay đổi số câu hỏi và thời gian:

Khi tạo cuộc thi, admin có thể cấu hình:
- `number_of_questions`: Số câu hỏi (mặc định 10)
- `time_per_question`: Thời gian mỗi câu (giây, mặc định 20)
- `passing_score`: Điểm đạt (tùy chọn)

### Thay đổi giao diện:

Các file UI sử dụng Tailwind CSS, bạn có thể dễ dàng thay đổi màu sắc, font, layout.

### Thêm câu hỏi:

Câu hỏi được lấy từ bảng `quiz_questions` đã có sẵn trong hệ thống. Sử dụng tính năng quản lý câu hỏi hiện tại hoặc tạo mới.

## Troubleshooting

### Lỗi: "Không đủ câu hỏi"

**Nguyên nhân:** Số lượng câu hỏi trong database < số câu được yêu cầu

**Giải pháp:**
1. Thêm câu hỏi vào `quiz_questions`
2. Hoặc giảm `number_of_questions` trong cấu hình cuộc thi

### Lỗi: "Unauthorized" khi tạo cuộc thi

**Nguyên nhân:** User không có role admin

**Giải pháp:** Kiểm tra `session.user.role` phải là `'admin'`

### Lỗi: Auto-save không hoạt động

**Nguyên nhân:** localStorage bị block hoặc full

**Giải pháp:** 
- Kiểm tra browser settings
- Clear localStorage
- Tăng storage limit

## Best Practices

1. **Trước khi tổ chức cuộc thi:**
   - Kiểm tra đủ câu hỏi
   - Test flow hoàn chỉnh
   - Chuẩn bị danh sách đơn vị/khoa phòng

2. **Trong cuộc thi:**
   - Theo dõi thống kê real-time
   - Sẵn sàng hỗ trợ người dùng
   - Backup database định kỳ

3. **Sau cuộc thi:**
   - Export kết quả
   - Công bố kết quả chính thức
   - Archive cuộc thi (status = 'archived')

## API Documentation

### Public APIs

**GET `/api/contest/active`**
- Lấy cuộc thi đang active

**GET `/api/contest/departments`**
- Lấy danh sách đơn vị

**GET `/api/contest/units?department_id={id}`**
- Lấy danh sách khoa/phòng (có thể lọc theo department)

**POST `/api/contest/register`**
- Đăng ký tham gia cuộc thi
- Body: `{ contest_id, full_name, email, phone, department_id, unit_id }`

**POST `/api/contest/questions`**
- Lấy câu hỏi ngẫu nhiên
- Body: `{ contest_id, participant_id }`

**POST `/api/contest/submit`**
- Nộp bài thi
- Body: `{ submission_id, answers, time_taken }`

**GET `/api/contest/leaderboard?contest_id={id}&limit=100`**
- Lấy bảng xếp hạng

### Admin APIs (Require Auth + Role Admin)

**GET/POST `/api/admin/contest`**
- Lấy danh sách/Tạo cuộc thi

**GET/PUT/DELETE `/api/admin/contest/[id]`**
- Chi tiết/Cập nhật/Xóa cuộc thi

**GET `/api/admin/contest/[id]/statistics`**
- Thống kê cuộc thi

**GET `/api/admin/contest/[id]/submissions`**
- Danh sách bài thi

**GET/POST/PUT/DELETE `/api/admin/departments`**
- CRUD đơn vị

**GET/POST/PUT/DELETE `/api/admin/units`**
- CRUD khoa/phòng

## Kết luận

Module Cuộc thi Kiến thức ADR là một hệ thống hoàn chỉnh, dễ sử dụng, không cần đăng nhập, phù hợp cho việc tổ chức các cuộc thi kiến thức quy mô lớn trong ngành y tế.

Để được hỗ trợ, vui lòng tạo issue trên GitHub hoặc liên hệ team phát triển.

---

**Phát triển bởi:** Codex-ADR Team
**Phiên bản:** 1.0.0
**Ngày cập nhật:** 2025-10-02









