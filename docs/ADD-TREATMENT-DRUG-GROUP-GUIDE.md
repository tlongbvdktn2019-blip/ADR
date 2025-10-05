# Hướng dẫn thêm trường "Nhóm thuốc điều trị"

## Tổng quan

Đã thêm trường mới **"Nhóm thuốc điều trị"** vào Phần C của form báo cáo ADR. Trường này cho phép người dùng chọn nhóm thuốc điều trị từ dữ liệu có sẵn trong bảng `treatment_drugs`.

## Vị trí trường mới

Trường "Nhóm thuốc điều trị" được thêm vào **sau trường "Đường dùng"** trong form thuốc nghi ngờ gây ADR.

## Các thay đổi đã thực hiện

### 1. Database Migration
- **File**: `supabase/migrations/add_treatment_drug_group_to_suspected_drugs.sql`
- Thêm cột `treatment_drug_group` vào bảng `suspected_drugs`
- Tạo index cho hiệu suất tìm kiếm

### 2. API Endpoint
- **File**: `app/api/treatment-drugs/route.ts`
- Endpoint mới: `GET /api/treatment-drugs`
- Lấy danh sách nhóm thuốc điều trị từ bảng `treatment_drugs`

### 3. Type Definitions
- **File**: `types/report.ts`
- Thêm trường `treatment_drug_group: string | null` vào interface `SuspectedDrug`

### 4. Form Component
- **File**: `components/forms/SuspectedDrugsSection.tsx`
- Thêm dropdown select cho "Nhóm thuốc điều trị"
- Tự động load danh sách từ API khi component mount
- Hiển thị loading state khi đang tải dữ liệu

### 5. Report Display
- **File**: `components/reports/ReportDetail.tsx`
- Hiển thị trường "Nhóm thuốc điều trị" khi xem chi tiết báo cáo

**Lưu ý**: Trường này **không được thêm vào**:
- Email template (`lib/email-templates/adr-report.ts`)
- PDF Export (`app/api/reports/[id]/export-pdf/route.ts`)

## Cài đặt

### Bước 1: Chạy Migration
```bash
# Nếu sử dụng Supabase CLI
supabase db push

# Hoặc chạy trực tiếp SQL trong Supabase Dashboard
# Copy nội dung từ file supabase/migrations/add_treatment_drug_group_to_suspected_drugs.sql
# và chạy trong SQL Editor
```

### Bước 2: Đảm bảo có dữ liệu trong bảng treatment_drugs
```sql
-- Kiểm tra dữ liệu
SELECT * FROM treatment_drugs;

-- Nếu chưa có dữ liệu, thêm ví dụ:
INSERT INTO treatment_drugs (name) VALUES 
  ('Thuốc kháng sinh'),
  ('Thuốc giảm đau'),
  ('Thuốc hạ sốt'),
  ('Thuốc chống viêm');
```

### Bước 3: Khởi động lại ứng dụng (nếu cần)
```bash
npm run dev
```

## Sử dụng

1. Khi tạo hoặc chỉnh sửa báo cáo ADR
2. Trong Phần C - Thuốc nghi ngờ gây ADR
3. Sau khi nhập "Đường dùng", sẽ thấy dropdown "Nhóm thuốc điều trị"
4. Chọn nhóm thuốc từ danh sách hoặc để trống

## Lưu ý

- Trường này là **không bắt buộc** (optional)
- Dữ liệu được lấy từ bảng `treatment_drugs`
- Cần đảm bảo bảng `treatment_drugs` có dữ liệu trước khi sử dụng
- Trường sẽ được hiển thị trong:
  - Form tạo/chỉnh sửa báo cáo
  - Trang chi tiết báo cáo
  - **Không** hiển thị trong email thông báo
  - **Không** hiển thị trong file PDF xuất ra

## Khắc phục sự cố

### Dropdown không hiển thị dữ liệu
1. Kiểm tra console browser có lỗi API không
2. Đảm bảo đã đăng nhập (endpoint yêu cầu authentication)
3. Kiểm tra bảng `treatment_drugs` có dữ liệu

### Lỗi khi lưu báo cáo
1. Đảm bảo đã chạy migration thêm cột
2. Kiểm tra schema database khớp với code

## Ngày tạo
05/10/2025

