# Hướng dẫn Tính năng Duyệt Báo cáo ADR

## 📋 Tổng quan

Tính năng này cho phép admin duyệt hoặc từ chối các báo cáo ADR. User thường chỉ có thể xem trạng thái duyệt của báo cáo của họ.

## ✨ Tính năng chính

### 1. **Trạng thái duyệt**
- **Chưa duyệt (Pending)**: Trạng thái mặc định khi tạo báo cáo mới
- **Đã duyệt (Approved)**: Admin đã phê duyệt báo cáo
- **Từ chối (Rejected)**: Admin đã từ chối báo cáo

### 2. **Quyền hạn**
- **Admin**: 
  - Xem tất cả báo cáo
  - Duyệt/từ chối báo cáo
  - Xem lịch sử duyệt (người duyệt, thời gian)
  
- **User thường**:
  - Chỉ xem được trạng thái duyệt của báo cáo
  - Không có quyền thay đổi trạng thái

### 3. **Thông tin theo dõi**
- `approval_status`: Trạng thái duyệt (pending/approved/rejected)
- `approved_by`: ID của admin đã duyệt
- `approved_at`: Thời gian duyệt
- `approval_note`: Ghi chú của admin (tùy chọn)

## 🚀 Hướng dẫn triển khai

### Bước 1: Chạy Migration SQL

Chạy file migration để thêm các trường mới vào database:

```bash
# Kết nối vào Supabase SQL Editor
# Copy và chạy nội dung file: supabase/add-approval-status.sql
```

Hoặc qua Supabase CLI:

```bash
supabase db execute -f supabase/add-approval-status.sql
```

### Bước 2: Xác nhận Migration

Kiểm tra xem các cột mới đã được thêm vào bảng `adr_reports`:

```sql
SELECT 
    approval_status,
    approved_by,
    approved_at,
    approval_note
FROM adr_reports
LIMIT 1;
```

### Bước 3: Deploy Code

Sau khi migration thành công, deploy code lên production:

```bash
# Build và deploy
npm run build
# Hoặc commit và push nếu dùng auto-deploy
git add .
git commit -m "feat: Add report approval feature"
git push origin main
```

### Bước 4: Kiểm tra tính năng

1. **Đăng nhập với tài khoản admin**
2. **Vào trang danh sách báo cáo** (`/reports`)
3. **Xác nhận hiển thị**:
   - Cột "Trạng thái" hiển thị trạng thái duyệt
   - Nút "Duyệt" (màu xanh) và "Từ chối" (màu đỏ) xuất hiện
4. **Test chức năng duyệt**:
   - Click nút "Duyệt" trên một báo cáo
   - Xác nhận trong dialog
   - Kiểm tra trạng thái cập nhật thành "Đã duyệt"
5. **Test quyền user**:
   - Đăng xuất và đăng nhập với tài khoản user thường
   - Xác nhận chỉ thấy trạng thái, không thấy nút duyệt

## 📱 Giao diện người dùng

### Danh sách báo cáo (ReportList)

```
┌─────────────────────────────────────────────────────────────┐
│  Mã BC    │ Bệnh nhân │ Mức độ     │ Trạng thái │ Thao tác  │
├─────────────────────────────────────────────────────────────┤
│ 2025-0001 │ Nguyễn A  │ Nghiêm trọng│ 🟡 Chưa   │ [Xem]    │
│           │           │             │    duyệt  │ [Duyệt]  │ <- Admin
│           │           │             │           │ [Từ chối]│
├─────────────────────────────────────────────────────────────┤
│ 2025-0002 │ Trần B    │ Nhẹ        │ ✅ Đã     │ [Xem]    │
│           │           │             │    duyệt  │ [In]     │
└─────────────────────────────────────────────────────────────┘
```

### Chi tiết báo cáo (ReportDetail)

**Header với trạng thái:**
```
📋 2025-0001  [Nghiêm trọng]  [🟡 Chưa duyệt]

Báo cáo ADR cho bệnh nhân Nguyễn Văn A

[Duyệt báo cáo]  [Từ chối]  [Chỉnh sửa]  [In]  [Xuất PDF]
     ↑              ↑
  (Admin only)  (Admin only)
```

## 🔧 API Endpoints

### Duyệt/Từ chối báo cáo

**Endpoint:** `PUT /api/reports/{id}/approve`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer {session_token}"
}
```

**Request Body:**
```json
{
  "approval_status": "approved",  // "approved" | "rejected" | "pending"
  "approval_note": "Báo cáo đầy đủ và chính xác"  // Optional
}
```

**Response (Success):**
```json
{
  "message": "Báo cáo 2025-0001 đã duyệt thành công",
  "report": {
    "id": "uuid",
    "report_code": "2025-0001",
    "approval_status": "approved",
    "approved_by": "admin_uuid",
    "approved_at": "2025-10-02T10:30:00Z",
    ...
  }
}
```

**Response (Error):**
```json
{
  "error": "Forbidden - Chỉ admin mới có quyền duyệt báo cáo"
}
```

## 🎨 Màu sắc trạng thái

| Trạng thái | Icon | Màu nền | Màu chữ | Border |
|-----------|------|---------|---------|--------|
| Chưa duyệt | 🕐 | `bg-yellow-100` | `text-yellow-700` | `border-yellow-200` |
| Đã duyệt | ✅ | `bg-green-100` | `text-green-700` | `border-green-200` |
| Từ chối | ❌ | `bg-red-100` | `text-red-700` | `border-red-200` |

## 🔒 Bảo mật

### Row Level Security (RLS)

RLS policies đã tồn tại vẫn hoạt động:
- Admin có thể cập nhật tất cả báo cáo (bao gồm trường approval)
- User thường chỉ có thể xem, không thể cập nhật trường approval

### API Authorization

- Endpoint `/api/reports/{id}/approve` kiểm tra:
  1. User đã đăng nhập chưa
  2. User có role = 'admin' không
  3. Báo cáo có tồn tại không

## 📊 Database Schema

```sql
-- Thêm vào bảng adr_reports
ALTER TABLE adr_reports 
ADD COLUMN approval_status approval_status DEFAULT 'pending' NOT NULL,
ADD COLUMN approved_by UUID REFERENCES users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approval_note TEXT;

-- Enum type
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Index
CREATE INDEX idx_adr_reports_approval_status ON adr_reports(approval_status);
```

## 🧪 Test Cases

### Test Admin

1. ✅ Admin có thể thấy nút Duyệt/Từ chối
2. ✅ Admin có thể duyệt báo cáo
3. ✅ Admin có thể từ chối báo cáo
4. ✅ Trạng thái cập nhật ngay lập tức
5. ✅ Thông báo thành công hiển thị

### Test User

1. ✅ User thường không thấy nút Duyệt/Từ chối
2. ✅ User thường chỉ thấy trạng thái (read-only)
3. ✅ API trả về 403 nếu user thường cố gọi approve endpoint

### Test Edge Cases

1. ✅ Duyệt báo cáo đã duyệt (nút Duyệt ẩn)
2. ✅ Từ chối báo cáo đã từ chối (nút Từ chối ẩn)
3. ✅ Loading state khi đang xử lý
4. ✅ Error handling khi network fail

## 📝 Ghi chú

### Migration an toàn

- Tất cả báo cáo hiện tại sẽ tự động có `approval_status = 'pending'`
- Migration không ảnh hưởng đến dữ liệu hiện tại
- Có thể rollback bằng cách:
  ```sql
  ALTER TABLE adr_reports 
  DROP COLUMN approval_status,
  DROP COLUMN approved_by,
  DROP COLUMN approved_at,
  DROP COLUMN approval_note;
  
  DROP TYPE approval_status;
  ```

### Tính năng mở rộng trong tương lai

- [ ] Thêm bộ lọc theo trạng thái duyệt
- [ ] Thống kê số lượng báo cáo theo trạng thái
- [ ] Lịch sử thay đổi trạng thái
- [ ] Thông báo email khi báo cáo được duyệt
- [ ] Ghi chú bắt buộc khi từ chối
- [ ] Workflow phê duyệt nhiều cấp

## 🆘 Troubleshooting

### Lỗi: "Column approval_status does not exist"

**Nguyên nhân:** Migration chưa chạy hoặc chưa deploy

**Giải pháp:**
```bash
# Chạy migration
supabase db execute -f supabase/add-approval-status.sql
```

### Lỗi: "Forbidden - Chỉ admin mới có quyền duyệt"

**Nguyên nhân:** User đăng nhập không phải admin

**Giải pháp:**
- Kiểm tra role trong bảng users
- Cập nhật role nếu cần:
  ```sql
  UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
  ```

### Nút duyệt không hiển thị

**Nguyên nhân:** Session không có thông tin role

**Giải pháp:**
- Logout và login lại
- Kiểm tra NextAuth session có chứa role không

## 📚 Tài liệu liên quan

- [NextAuth Documentation](https://next-auth.js.org/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Hook Form](https://react-hook-form.com/)

---

**Phiên bản:** 1.0.0  
**Ngày cập nhật:** 2025-10-02  
**Tác giả:** Development Team




