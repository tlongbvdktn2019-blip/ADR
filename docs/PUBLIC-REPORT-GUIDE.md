# 📋 Hướng dẫn Hệ thống Báo cáo Public

## 🎯 Tổng quan

Hệ thống ADR hiện đã hỗ trợ **báo cáo KHÔNG CẦN ĐĂNG NHẬP**. Người dùng có thể truy cập trang chủ và gửi báo cáo ADR ngay lập tức.

## 🌐 Các trang chính

### 1. **Trang chủ (/) - Public**
- **URL:** `http://localhost:3000/`
- **Mô tả:** Form báo cáo ADR không cần đăng nhập
- **Tính năng:**
  - Chọn "Nơi báo cáo" từ danh sách đơn vị
  - Tự động tạo mã báo cáo
  - 5 bước điền thông tin
  - Gửi báo cáo trực tiếp

### 2. **Trang đăng nhập (/auth/login)**
- **URL:** `http://localhost:3000/auth/login`
- **Mô tả:** Đăng nhập cho nhân viên y tế và admin

### 3. **Dashboard (/dashboard)**
- **URL:** `http://localhost:3000/dashboard`
- **Yêu cầu:** Đã đăng nhập
- **Mô tả:** Tự động redirect về:
  - Admin → `/admin/departments`
  - User → `/reports`

## 🎨 UI Components

### **PublicHeader**
- Logo hệ thống bên trái
- Nút **"Đăng nhập"** bên phải (nếu chưa đăng nhập)
- Nút **"Vào hệ thống"** (nếu đã đăng nhập)

### **PublicLayout**
- Layout cho trang không cần authentication
- Bao gồm: Header + Content + Footer

## 📊 Luồng hoạt động

### **Người dùng CHƯA đăng nhập:**
```
1. Truy cập / (trang chủ)
   ↓
2. Thấy form báo cáo 5 bước
   ↓
3. Chọn "Nơi báo cáo" → Mã tự động tạo
   ↓
4. Điền thông tin các bước
   ↓
5. Click "Gửi báo cáo"
   ↓
6. Nhận mã báo cáo
   ↓
7. Hoàn thành (có thể tiếp tục báo cáo mới)
```

### **Người dùng ĐÃ đăng nhập:**
```
1. Truy cập / (trang chủ)
   ↓
2. Thấy nút "Vào hệ thống" ở góc phải
   ↓
3. Click vào hệ thống
   ↓
4. Vào dashboard → reports (hoặc admin panel nếu là admin)
```

## 🔐 API Endpoints

### **Public APIs (không cần auth):**
- `GET  /api/public/departments` - Lấy danh sách đơn vị
- `POST /api/public/generate-report-code` - Tạo mã báo cáo
- `POST /api/public/reports` - Gửi báo cáo ADR

### **Authenticated APIs:**
- `GET  /api/reports` - Xem danh sách báo cáo (của mình hoặc tất cả nếu admin)
- `POST /api/reports` - Tạo báo cáo (có reporter_id)

## 📝 Dữ liệu báo cáo

### **Báo cáo Public (không đăng nhập):**
- `reporter_id`: `null`
- `organization`: Từ dropdown "Nơi báo cáo" ở Phần A
- `report_code`: Tự động tạo theo đơn vị
- Báo cáo hợp lệ và có thể sử dụng ngay sau khi nộp; không cần admin duyệt

### **Báo cáo Authenticated:**
- `reporter_id`: ID của user đăng nhập
- `organization`: Vẫn lấy từ dropdown "Nơi báo cáo"
- `report_code`: Tự động tạo
- Báo cáo hợp lệ và có thể sử dụng ngay sau khi nộp; không cần admin duyệt

## 🗄️ Database

### **Constraint đã thay đổi:**
```sql
-- reporter_id có thể NULL (cho báo cáo public)
ALTER TABLE adr_reports 
ALTER COLUMN reporter_id DROP NOT NULL;
```

### **Cách phân biệt báo cáo:**
- Báo cáo public: `reporter_id IS NULL`
- Báo cáo authenticated: `reporter_id IS NOT NULL`

## 🎯 Lợi ích

1. ✅ **Tăng số lượng báo cáo** - Người dân có thể báo cáo dễ dàng
2. ✅ **Không rào cản** - Không cần tạo tài khoản
3. ✅ **Dữ liệu chính xác** - Vẫn lưu đúng đơn vị báo cáo
4. ✅ **Linh hoạt** - Người có tài khoản vẫn đăng nhập được

## 📱 Responsive

- ✅ Desktop: Form đầy đủ với progress bar
- ✅ Mobile: Form thu gọn, điều hướng dễ dàng
- ✅ Tablet: Layout tối ưu

## 🔍 Testing

### **Test flow không đăng nhập:**
1. Xóa cookies/session
2. Truy cập `http://localhost:3000`
3. Thấy form báo cáo
4. Điền và gửi
5. Kiểm tra database xem `reporter_id` có NULL không

### **Test flow đã đăng nhập:**
1. Đăng nhập tại `/auth/login`
2. Truy cập `/` 
3. Click "Vào hệ thống"
4. Vào được dashboard

## 🚀 Deployment

Khi deploy, đảm bảo:
- [ ] Đã chạy SQL migration để cho phép `reporter_id` NULL
- [ ] Environment variables đầy đủ
- [ ] Public APIs có rate limiting (tránh spam)
- [ ] ReCAPTCHA cho form public (khuyến nghị)

## 📞 Support

Nếu có vấn đề, kiểm tra:
1. Database constraint đã update chưa?
2. API public có hoạt động không?
3. Console log có lỗi gì?



