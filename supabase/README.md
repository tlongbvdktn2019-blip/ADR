# Hướng dẫn thiết lập Database Supabase

## 🔧 Các bước thiết lập

### 1. Tạo Project Supabase

1. Đi đến [https://supabase.com](https://supabase.com)
2. Đăng nhập và tạo project mới
3. Chọn region gần nhất (Singapore cho Việt Nam)
4. Đợi project được tạo xong

### 2. Chạy Database Schema

1. Vào **SQL Editor** trong Supabase dashboard
2. Tạo một query mới
3. Copy nội dung file `schema.sql` và paste vào
4. Nhấn **Run** để chạy script

> ⚠️ **Lưu ý**: Nếu gặp lỗi về permissions, hãy bỏ qua - đây là lỗi bình thường trong môi trường Supabase hosted.

### 3. Tạo Demo Users (Tùy chọn)

1. Tạo query mới trong SQL Editor
2. Copy nội dung file `demo-users.sql` và paste vào
3. Nhấn **Run** để tạo các user demo

### 4. Cấu hình Authentication

1. Đi đến **Authentication > Settings**
2. Tắt **Email confirmation** nếu chỉ để demo
3. Cấu hình **Site URL**: `http://localhost:3000`
4. Thêm `http://localhost:3000/**` vào **Redirect URLs**

### 5. Lấy API Keys

1. Đi đến **Settings > API**
2. Copy các thông tin sau:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

### 6. Cấu hình .env.local

Tạo file `.env.local` trong thư mục root của project:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## 📊 Schema Overview

### Bảng `users`
- Lưu thông tin người dùng và vai trò
- Có RLS để phân quyền truy cập

### Bảng `adr_reports`
- Bảng chính lưu báo cáo ADR
- Auto-generate mã báo cáo dạng YYYY-XXXXXX
- Foreign key tới `users`

### Bảng `suspected_drugs`
- Lưu thông tin thuốc nghi ngờ gây ADR
- Relation 1-n với `adr_reports`

## 🔐 Row Level Security (RLS)

- **Admins**: Có thể truy cập tất cả dữ liệu
- **Users**: Chỉ truy cập dữ liệu của chính họ
- Policies tự động áp dụng dựa trên `auth.uid()`

## ✅ Kiểm tra Setup

Sau khi hoàn thành, kiểm tra:

1. Tất cả bảng đã được tạo (3 bảng chính)
2. RLS policies đã được enable
3. Demo users đã được tạo
4. Functions và triggers hoạt động

## 🚨 Troubleshooting

### Lỗi "permission denied to set parameter"
- Bỏ qua lỗi này, không ảnh hưởng đến chức năng
- Chỉ xảy ra trong môi trường Supabase hosted

### Lỗi "relation does not exist"
- Đảm bảo đã chạy schema.sql trước
- Check trong **Database > Tables** xem bảng đã được tạo chưa

### Lỗi RLS policies
- Đảm bảo auth.uid() có giá trị
- Check user đã login và có trong bảng users

## 📝 Demo Accounts

Sau khi chạy `demo-users.sql`:

- **Admin**: admin@soyte.gov.vn / admin123
- **User**: user@benhvien.gov.vn / user123

> 💡 **Lưu ý**: Mật khẩu được hard-code trong NextAuth cho demo. Trong production cần implement proper password hashing.


