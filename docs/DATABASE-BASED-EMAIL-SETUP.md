# 🗄️ Database-Based Email Setup Guide

## 📋 Tổng quan

Phiên bản **Professional** sử dụng database để lưu trữ cấu hình email theo tổ chức, cho phép:

✅ **Quản lý qua UI** - Admin panel để CRUD organization emails  
✅ **Linh hoạt** - Thêm/sửa/xóa organization không cần sửa code  
✅ **Scalable** - Dễ dàng mở rộng cho nhiều tổ chức  
✅ **Audit trail** - Lưu lịch sử created_at, updated_at  
✅ **Contact info** - Lưu thêm thông tin liên hệ  

---

## 🚀 Setup nhanh (5 phút)

### **Bước 1: Chạy Migration SQL**

1. **Vào Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Chọn project của bạn
   - Vào **SQL Editor**

2. **Copy nội dung file:**
   ```
   supabase/organization-settings-schema.sql
   ```

3. **Paste vào SQL Editor và Run**
   - Click "Run" hoặc Ctrl+Enter
   - Đợi ~2-3 giây

4. **Kiểm tra kết quả:**
   ```sql
   SELECT * FROM organization_settings;
   ```

### **Bước 2: Restart Server**

```bash
# Nếu server đang chạy
# Nhấn Ctrl+C để dừng

# Restart
npm run dev
```

### **Bước 3: Truy cập Admin Panel**

```bash
# URL: http://localhost:3000/admin/organization-emails

# Login với admin account:
Email: admin@soyte.gov.vn
Password: admin123
```

---

## 🎨 Giao diện Admin Panel

### **Dashboard Overview:**

```
┌─────────────────────────────────────────────────────────┐
│ 📧 Quản lý Email Thông báo                              │
│                                                         │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│ │ Tổng: 5 │ │ Active:4│ │ Tắt: 1  │                   │
│ └─────────┘ └─────────┘ └─────────┘                   │
│                                                         │
│ [🔍 Tìm kiếm...]                    [+ Thêm tổ chức]  │
│                                                         │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Tổ chức          │ Email          │ Liên hệ │ ✏️🗑️ │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ Bệnh viện ABC    │ abc@gmail.com  │ Admin   │ ✏️🗑️ │ │
│ │ Sở Y tế          │ di.pvcenter... │ Admin   │ ✏️🗑️ │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### **Features:**

✅ **CRUD Operations** - Create, Read, Update, Delete  
✅ **Search** - Tìm kiếm theo tên tổ chức hoặc email  
✅ **Active/Inactive** - Bật/tắt email notification  
✅ **Contact Info** - Lưu người liên hệ và số điện thoại  
✅ **Stats Dashboard** - Thống kê real-time  
✅ **Validation** - Validate email format  

---

## 📊 Database Schema

### **Table: organization_settings**

```sql
CREATE TABLE organization_settings (
    id UUID PRIMARY KEY,
    organization_name VARCHAR(255) UNIQUE NOT NULL,
    notification_email VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### **Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `organization_name` | VARCHAR | Tên tổ chức (unique) |
| `notification_email` | VARCHAR | Email nhận thông báo |
| `contact_person` | VARCHAR | Người liên hệ |
| `contact_phone` | VARCHAR | Số điện thoại |
| `is_active` | BOOLEAN | Trạng thái kích hoạt |
| `created_at` | TIMESTAMP | Thời gian tạo |
| `updated_at` | TIMESTAMP | Thời gian cập nhật |

### **Indexes:**

- `idx_organization_settings_name` - Tên tổ chức
- `idx_organization_settings_active` - Trạng thái
- `idx_organization_settings_email` - Email

### **Helper Functions:**

```sql
-- Lấy email notification cho tổ chức
SELECT get_organization_notification_email('Bệnh viện ABC');

-- List tất cả tổ chức active
SELECT * FROM list_active_organization_emails();
```

---

## 🔧 API Endpoints

### **GET /api/organization-settings**
List all organization settings

**Query Parameters:**
- `page` - Trang (default: 1)
- `limit` - Số items (default: 50)
- `search` - Tìm kiếm
- `active_only` - Chỉ hiện active (true/false)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "organization_name": "Bệnh viện ABC",
      "notification_email": "abc@hospital.vn",
      "contact_person": "Nguyễn Văn A",
      "contact_phone": "0123456789",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 5,
    "totalPages": 1
  },
  "stats": {
    "total": 5,
    "active": 4,
    "inactive": 1
  }
}
```

### **POST /api/organization-settings**
Create new organization setting

**Body:**
```json
{
  "organization_name": "Bệnh viện XYZ",
  "notification_email": "xyz@hospital.vn",
  "contact_person": "Trần Thị B",
  "contact_phone": "0987654321",
  "is_active": true
}
```

### **PUT /api/organization-settings/[id]**
Update organization setting

**Body:**
```json
{
  "notification_email": "newemail@hospital.vn",
  "contact_person": "New Contact",
  "is_active": false
}
```

### **DELETE /api/organization-settings/[id]**
Delete organization setting

---

## 🧪 Testing

### **Test 1: Thêm tổ chức mới**

1. Vào: http://localhost:3000/admin/organization-emails
2. Click "Thêm tổ chức"
3. Điền form:
   - Tên tổ chức: "Bệnh viện Test"
   - Email: "test@hospital.vn"
   - Người liên hệ: "Test Admin"
   - SĐT: "0123456789"
4. Click "Thêm mới"
5. ✅ Thấy tổ chức mới trong danh sách

### **Test 2: Sửa email**

1. Click icon ✏️ ở hàng muốn sửa
2. Thay đổi email
3. Click "Cập nhật"
4. ✅ Email được cập nhật

### **Test 3: Tạo báo cáo và check email**

```bash
# 1. Tạo báo cáo ADR từ tổ chức đã cấu hình

# 2. Check console logs:
Organization "Bệnh viện Test" → Email: test@hospital.vn
📧 Auto email sent to: test@hospital.vn

# 3. Verify email được gửi đến đúng địa chỉ
```

### **Test 4: Test fallback**

```bash
# Tạo báo cáo từ tổ chức chưa có trong database

# Expected:
Organization "Unknown Org" not found in database, using default
📧 Auto email sent to: di.pvcenter@gmail.com
```

---

## 🔍 Troubleshooting

### **Problem: Bảng không tồn tại**

**Error:** `relation "organization_settings" does not exist`

**Solution:**
```bash
# Chạy lại migration SQL
1. Mở Supabase SQL Editor
2. Copy supabase/organization-settings-schema.sql
3. Run script
```

### **Problem: RLS policy error**

**Error:** `new row violates row-level security policy`

**Solution:**
```sql
-- Disable RLS temporarily để test
ALTER TABLE organization_settings DISABLE ROW LEVEL SECURITY;

-- Sau khi test xong, enable lại
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
```

### **Problem: Email không gửi đến organization**

**Check:**
1. Verify organization exists trong database:
   ```sql
   SELECT * FROM organization_settings 
   WHERE organization_name = 'Tên tổ chức';
   ```

2. Check is_active = true:
   ```sql
   UPDATE organization_settings 
   SET is_active = true 
   WHERE organization_name = 'Tên tổ chức';
   ```

3. Check server logs:
   ```bash
   # Terminal logs sẽ hiện:
   Organization "XYZ" → Email: xyz@hospital.vn
   ```

---

## 🎯 Ưu điểm so với Hardcode

| Feature | Hardcode | Database |
|---------|----------|----------|
| **Add organization** | Sửa code + restart | UI click |
| **Update email** | Sửa code + restart | UI click |
| **Scalability** | ❌ Khó | ✅ Dễ |
| **Audit trail** | ❌ Không | ✅ Có |
| **Non-technical user** | ❌ Không thể | ✅ Dễ dàng |
| **Production deployment** | ⚠️ Code change | ✅ Data change |

---

## 📚 Files Created

### **Database:**
- `supabase/organization-settings-schema.sql` - Migration script

### **Backend:**
- `lib/auto-email-service.ts` - Updated to query database
- `app/api/organization-settings/route.ts` - CRUD endpoints
- `app/api/organization-settings/[id]/route.ts` - Single item ops

### **Frontend:**
- `app/admin/organization-emails/page.tsx` - Admin UI
- `types/organization-settings.ts` - TypeScript types

### **Documentation:**
- `docs/DATABASE-BASED-EMAIL-SETUP.md` - This file

---

## ✨ Next Steps

1. ✅ **Migration done** - Bảng đã tạo
2. ✅ **Admin UI ready** - Giao diện quản lý sẵn sàng
3. ⏭️ **Add organizations** - Thêm tổ chức của bạn
4. ⏭️ **Configure emails** - Cấu hình email
5. ⏭️ **Test** - Tạo báo cáo và check email

---

**🎉 Hệ thống database-based email đã sẵn sàng!**

**Truy cập:** http://localhost:3000/admin/organization-emails







