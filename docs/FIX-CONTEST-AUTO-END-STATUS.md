# Fix: Tự động cập nhật trạng thái cuộc thi đã hết hạn

## 🔍 Vấn đề

Trước đây, hệ thống có vấn đề sau:

- Cuộc thi có `status = 'active'` nhưng `end_date` đã qua ngày hiện tại
- Admin vẫn thấy cuộc thi hiển thị trạng thái "active" trên trang quản lý
- Người dùng không thấy cuộc thi khi truy cập `/contest` (đúng), nhưng gây nhầm lẫn với admin

**Nguyên nhân:**
- API admin chỉ kiểm tra field `status` trong database
- Không có logic tự động cập nhật `status` khi `end_date` đã qua

## ✅ Giải pháp đã triển khai

### 1. **Tự động cập nhật trạng thái khi Admin xem danh sách**

**File:** `app/api/admin/contest/route.ts`

```typescript
// Tự động cập nhật trạng thái các cuộc thi đã hết hạn
const now = new Date().toISOString();
await (supabaseAdmin
  .from('contests') as any)
  .update({ status: 'ended' })
  .eq('status', 'active')
  .lt('end_date', now);
```

**Cách hoạt động:**
- Khi admin truy cập trang quản lý cuộc thi
- Hệ thống tự động cập nhật tất cả cuộc thi có:
  - `status = 'active'`
  - `end_date < now` (đã qua ngày kết thúc)
- Chuyển trạng thái sang `'ended'`

### 2. **Kiểm tra và cập nhật khi xem chi tiết cuộc thi**

**File:** `app/api/admin/contest/[id]/route.ts`

```typescript
// Kiểm tra và tự động cập nhật trạng thái nếu đã hết hạn
if (contest && contest.status === 'active' && contest.end_date) {
  const now = new Date().toISOString();
  if (contest.end_date < now) {
    // Cập nhật trạng thái sang 'ended'
    await supabaseAdmin
      .from('contests')
      .update({ status: 'ended' })
      .eq('id', params.id);
    
    contest.status = 'ended';
  }
}
```

**Cách hoạt động:**
- Khi admin xem chi tiết cuộc thi cụ thể
- Kiểm tra nếu cuộc thi đã hết hạn
- Tự động cập nhật và trả về status mới

### 3. **Ngăn chặn đăng ký vào cuộc thi đã hết hạn**

**File:** `app/api/contest/register/route.ts`

```typescript
// Kiểm tra ngày kết thúc
if (contest.end_date && contest.end_date < now) {
  return NextResponse.json(
    { success: false, error: 'Cuộc thi đã kết thúc. Không thể đăng ký!' },
    { status: 400 }
  );
}

// Kiểm tra ngày bắt đầu
if (contest.start_date && contest.start_date > now) {
  return NextResponse.json(
    { success: false, error: 'Cuộc thi chưa bắt đầu!' },
    { status: 400 }
  );
}
```

**Cách hoạt động:**
- Khi người dùng cố gắng đăng ký tham gia
- Kiểm tra `start_date` và `end_date`
- Từ chối nếu chưa bắt đầu hoặc đã kết thúc

### 4. **Ngăn chặn lấy câu hỏi từ cuộc thi không hợp lệ**

**File:** `app/api/contest/questions/route.ts`

```typescript
// Kiểm tra cuộc thi có đang active không
if (contest.status !== 'active') {
  return NextResponse.json(
    { success: false, error: 'Cuộc thi không còn hoạt động' },
    { status: 400 }
  );
}

// Kiểm tra ngày kết thúc
if (contest.end_date && contest.end_date < now) {
  return NextResponse.json(
    { success: false, error: 'Cuộc thi đã kết thúc' },
    { status: 400 }
  );
}

// Kiểm tra ngày bắt đầu
if (contest.start_date && contest.start_date > now) {
  return NextResponse.json(
    { success: false, error: 'Cuộc thi chưa bắt đầu' },
    { status: 400 }
  );
}
```

**Cách hoạt động:**
- Khi người dùng yêu cầu lấy câu hỏi
- Kiểm tra status và thời gian hợp lệ
- Từ chối nếu không đủ điều kiện

## 📊 Luồng hoạt động mới

### Trước khi sửa:
```
1. Admin tạo cuộc thi → Status = 'active'
2. end_date qua → Status vẫn là 'active' ❌
3. Admin vẫn thấy "active" trên giao diện ❌
4. Người dùng không thấy cuộc thi (đúng)
```

### Sau khi sửa:
```
1. Admin tạo cuộc thi → Status = 'active'
2. end_date qua → Status vẫn là 'active' trong DB
3. Admin truy cập trang quản lý
   → Hệ thống tự động cập nhật: Status = 'ended' ✅
4. Admin thấy trạng thái "ended" chính xác ✅
5. Người dùng không thể đăng ký/làm bài ✅
```

## 🎯 Lợi ích

1. **Tự động hóa:** Không cần admin thủ công cập nhật trạng thái
2. **Nhất quán:** Trạng thái trong database luôn chính xác
3. **Bảo mật:** Ngăn chặn người dùng đăng ký/làm bài thi đã hết hạn
4. **UX tốt:** Thông báo rõ ràng khi cuộc thi hết hạn hoặc chưa bắt đầu

## 🔄 Các API đã được cập nhật

| API Endpoint | Chức năng | Logic mới |
|-------------|-----------|-----------|
| `GET /api/admin/contest` | Danh sách cuộc thi (Admin) | Tự động cập nhật status |
| `GET /api/admin/contest/[id]` | Chi tiết cuộc thi (Admin) | Kiểm tra và cập nhật status |
| `POST /api/contest/register` | Đăng ký tham gia | Kiểm tra start_date & end_date |
| `POST /api/contest/questions` | Lấy câu hỏi | Kiểm tra status & thời gian |

## 📝 Lưu ý

- Logic tự động cập nhật chỉ chạy khi có request đến API
- Không sử dụng cron job hoặc background task
- Cách tiếp cận này đơn giản và hiệu quả cho quy mô hiện tại
- Nếu muốn cập nhật theo thời gian thực, có thể thêm:
  - Database trigger
  - Scheduled function (Supabase Edge Functions)
  - Cron job bên ngoài

## 🧪 Test thủ công

1. **Tạo cuộc thi test:**
   - Tạo cuộc thi với `end_date` = hôm qua
   - Status = 'active'

2. **Kiểm tra tự động cập nhật:**
   - Truy cập trang admin: `/admin/contest-management`
   - Kiểm tra status đã chuyển thành "ended"

3. **Kiểm tra ngăn chặn:**
   - Thử đăng ký tham gia → Thấy thông báo "Cuộc thi đã kết thúc"
   - Thử lấy câu hỏi → Thấy thông báo lỗi

## 🚀 Triển khai

Các thay đổi đã được áp dụng trực tiếp vào code.
Không cần migration database hoặc cấu hình thêm.

---

**Ngày cập nhật:** 31/10/2025
**Version:** 1.0

