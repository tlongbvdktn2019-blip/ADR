# Hệ thống Quản lý ADR (Adverse Drug Reaction Management System)

Một ứng dụng web hoàn chỉnh để quản lý và báo cáo phản ứng có hại của thuốc, được xây dựng với Next.js, Supabase và Tailwind CSS.

## 🚀 Tính năng chính

### ✅ Đã hoàn thành:

1. **Hệ thống Xác thực và Phân quyền**
   - Đăng nhập/đăng xuất với NextAuth.js
   - Hai vai trò: Admin (Sở Y tế) và User (Đơn vị y tế)
   - Middleware bảo vệ routes dựa trên vai trò

2. **Form Báo cáo ADR Chi tiết**
   - ✅ Phần A: Thông tin bệnh nhân (họ tên, ngày sinh, tuổi tự động, giới tính, cân nặng)
   - ✅ Phần B: Thông tin ADR (ngày xảy ra, mô tả, xét nghiệm, tiền sử, xử trí, mức độ nghiêm trọng, kết quả)
   - ✅ Phần C: Thuốc nghi ngờ (bảng động, thêm/xóa thuốc, thông tin chi tiết từng thuốc)
   - ✅ Phần D: Thẩm định ADR (đánh giá mối liên quan, thang đánh giá, bình luận)
   - ✅ Phần E: Thông tin người báo cáo (liên hệ, loại báo cáo, ngày báo cáo)

3. **Giao diện và UX**
   - ✅ UI responsive với Tailwind CSS
   - ✅ Form wizard với progress indicator
   - ✅ Components UI tái sử dụng (Input, Select, Button, Card, etc.)
   - ✅ Toast notifications với react-hot-toast

4. **Backend và Database**
   - ✅ Database schema hoàn chỉnh với PostgreSQL/Supabase
   - ✅ Row Level Security (RLS) policies
   - ✅ Auto-generate report codes
   - ✅ API routes cho CRUD operations

5. **Tính năng Xem lại Báo cáo**
   - ✅ Danh sách báo cáo với pagination, search, filter
   - ✅ Trang chi tiết báo cáo với 6 tabs thông tin
   - ✅ Phân quyền xem: Admin (all) vs User (own reports)
   - ✅ Report cards với thông tin tóm tắt
   - ✅ Demo data script cho testing

6. **Tính năng Gửi Email Báo cáo**
   - ✅ Email template HTML đẹp, responsive
   - ✅ Gửi đến di.pvcenter@gmail.com (có thể custom)
   - ✅ Phân quyền: Admin (all) vs User (own reports)
   - ✅ Development mode với test email (Ethereal)
   - ✅ Production ready với SMTP configuration

### 🚧 Cần triển khai tiếp:

7. **Dashboard với Biểu đồ Thống kê (Admin)**
   - Biểu đồ phân bố theo giới tính
   - Biểu đồ phân bố theo độ tuổi  
   - Top 5 đơn vị báo cáo nhiều nhất
   - Thuốc bị nghi ngờ nhiều nhất
   - Tỷ lệ báo cáo theo mức độ nghiêm trọng

8. **Chức năng Xuất File PDF/DOCX**
   - Xuất phiếu thông tin ADR (PDF)
   - Xuất báo cáo đầy đủ (PDF/DOCX)

## 🛠️ Công nghệ sử dụng

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **Forms**: React Hook Form
- **Notifications**: React Hot Toast
- **Email**: Nodemailer (SMTP)
- **Charts**: Recharts (sẽ dùng cho dashboard)
- **PDF Export**: jsPDF, html2canvas
- **DOCX Export**: docx, file-saver

## 📁 Cấu trúc dự án

```
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                # NextAuth endpoints
│   │   └── reports/             # ADR reports API
│   ├── auth/                    # Authentication pages
│   ├── dashboard/               # Admin dashboard
│   ├── reports/                 # Reports pages
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── forms/                   # Form sections
│   ├── layout/                  # Layout components
│   └── ui/                      # UI components
├── lib/                         # Utilities
├── types/                       # TypeScript types
├── supabase/                    # Database schema
└── middleware.ts                # Auth middleware
```

## ⚡ Quick Start

### 🚀 **Lần đầu setup? Bắt đầu tại đây:**
➡️ **Đọc:** `START-HERE.md` (5 phút orientation)

### 📋 **Các hướng dẫn chi tiết:**

| File | Mục đích | Thời gian | Khi nào dùng |
|------|----------|-----------|---------------|
| **START-HERE.md** | Quick orientation | 5 phút | Lần đầu tiên với dự án |
| **QUICK-START-GUIDE.md** | Setup đầy đủ từ A-Z | 15-20 phút | Muốn chạy hệ thống |
| **TESTING-CHECKLIST.md** | Kiểm tra tất cả tính năng | 30-60 phút | QA testing |
| **DEMO-SCRIPT.md** | Script trình diễn | 10-15 phút | Demo cho audience |
| **PROJECT-SUMMARY.md** | Tổng quan architecture | 20-30 phút | Hiểu hệ thống |

### 🔧 **Automated System Check:**
```bash
# Kiểm tra tự động hệ thống sẵn sàng chưa
node scripts/system-check.js
```

### ⚙️ Manual Setup (nếu muốn làm từng bước)

**1. Clone repository**
```bash
git clone <repository-url>
cd adr-management
```

**2. Cài đặt dependencies**
```bash
npm install
```

**3. Cấu hình môi trường**
Tạo file `.env.local`:
```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth (Required)
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Email (Optional for development)
EMAIL_FROM=noreply@adrsystem.gov.vn
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**4. Thiết lập Database**
1. Tạo project Supabase mới
2. Chạy script SQL từ file `supabase/schema.sql`
3. Chạy script SQL từ file `supabase/demo-users.sql` (tạo demo users)
4. Chạy script SQL từ file `supabase/demo-reports.sql` (tạo demo reports - optional)
5. Cấu hình Authentication trong Supabase dashboard

**5. Chạy ứng dụng**
```bash
npm run dev
```
Ứng dụng sẽ chạy tại `http://localhost:3000`

## 👥 Tài khoản Demo

**Admin (Sở Y tế):**
- Email: admin@soyte.gov.vn
- Password: admin123

**User (Đơn vị y tế):**
- Email: user@benhvien.gov.vn  
- Password: user123

> 💡 **Nếu gặp lỗi đăng nhập**: Truy cập `/debug` để kiểm tra kết nối database và tạo demo users tự động.

### 🎮 Demo Features để Test

**Sau khi login thành công:**

1. **Tạo báo cáo mới**: `/reports/new`
   - Form 5-step wizard với validation đầy đủ
   - Dynamic drug table (thêm/xóa thuốc)
   - Auto-calculate age từ ngày sinh

2. **Xem danh sách báo cáo**: `/reports`
   - Search theo mã báo cáo, tên bệnh nhân, thuốc
   - Filter theo mức độ nghiêm trọng
   - Pagination
   - Phân quyền: Admin (all) vs User (own reports)

3. **Chi tiết báo cáo**: `/reports/[id]`
   - 6 tabs thông tin: Tổng quan, Bệnh nhân, ADR, Thuốc, Thẩm định, Người báo cáo
   - Responsive design, easy navigation

4. **Gửi Email báo cáo**: Trong trang chi tiết
   - Nhấn nút "Gửi Email" 
   - Email HTML đẹp tự động gửi đến `di.pvcenter@gmail.com`
   - Development: Xem preview email trong console/toast
   - Phân quyền: Admin (all) vs User (own reports)

5. **Demo data**: Chạy `supabase/demo-reports.sql` để có 3 báo cáo mẫu

## 🔐 Phân quyền

### Admin (Sở Y tế):
- Xem tất cả báo cáo ADR
- Sửa/xóa mọi báo cáo
- Quản lý tài khoản người dùng
- Truy cập Dashboard thống kê

### User (Đơn vị y tế):
- Tạo báo cáo ADR mới
- Xem/sửa báo cáo của đơn vị mình
- Không truy cập được Dashboard

## 📊 Database Schema

### Bảng chính:
- `users`: Thông tin người dùng và phân quyền
- `adr_reports`: Báo cáo ADR chính
- `suspected_drugs`: Thuốc nghi ngờ (1-n với reports)

### Tính năng Database:
- Row Level Security (RLS) đảm bảo quyền truy cập
- Auto-generate mã báo cáo theo năm
- Triggers tự động cập nhật timestamp
- Foreign key constraints đảm bảo tính toàn vẹn

## 🔄 API Endpoints

- `GET/POST /api/reports` - Lấy/tạo báo cáo ADR
- `POST /api/auth/register` - Đăng ký tài khoản mới
- `[...nextauth]` - NextAuth endpoints

## 📝 Ghi chú kỹ thuật

- Form sử dụng controlled components với React state
- Validation client-side và server-side
- Responsive design cho mobile và desktop
- Toast notifications cho UX tốt hơn
- Loading states cho các async operations
- Error handling và user feedback

## 🚀 Roadmap

Các tính năng sẽ được triển khai tiếp:
1. Dashboard với biểu đồ thống kê
2. Chức năng xuất file PDF/DOCX  
3. Search và filter báo cáo
4. Email notifications
5. Audit trail
6. Bulk operations

## 🚨 Troubleshooting

### ❌ Lỗi "Thông tin đăng nhập không chính xác"

**Cách khắc phục nhanh:**
1. Truy cập **Debug Page**: `http://localhost:3000/debug`
2. Nhấn **"Kiểm tra kết nối Supabase"**
3. Nếu Demo Users missing → Nhấn **"Tạo Demo Users"**
4. Thử login lại với: `admin@soyte.gov.vn` / `admin123`

### ❌ Lỗi Environment Variables

```bash
# Tạo .env.local với nội dung:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_SECRET=random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

### ❌ Các lỗi khác

- **"permission denied to set parameter"**: Bỏ qua, không ảnh hưởng
- **"relation does not exist"**: Chạy lại `schema.sql` trong SQL Editor
- **Network/Connection errors**: Kiểm tra Supabase project có đang hoạt động

### 🔧 Debug Tools

- **Debug Page**: `/debug` - Kiểm tra toàn diện hệ thống
- **Test API**: `/api/test/users` - Kiểm tra database connection
- **Browser Console**: F12 để xem chi tiết lỗi client-side
- **Server Logs**: Terminal chạy `npm run dev` để xem server errors

---

Được phát triển với ❤️ bằng Next.js và Supabase