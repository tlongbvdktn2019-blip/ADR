# Tính năng Lọc Dashboard theo Nơi Báo Cáo

## Tổng quan

Tính năng này cho phép người dùng xem dashboard và thống kê được lọc theo từng nơi báo cáo (department/organization). Người dùng có thể chọn xem tất cả dữ liệu hoặc chỉ xem dữ liệu của một nơi báo cáo cụ thể.

## Tính năng

### 1. Dropdown Filter
- Vị trí: Góc trên bên phải của dashboard, bên cạnh tiêu đề
- Icon: Biểu tượng phễu (FunnelIcon) để dễ nhận biết
- Tùy chọn:
  - "Tất cả nơi báo cáo" (mặc định) - Hiển thị toàn bộ dữ liệu
  - Các department cụ thể - Chỉ hiển thị dữ liệu của department đã chọn

### 2. Dữ liệu được lọc

Khi chọn một nơi báo cáo cụ thể, các thành phần sau sẽ được lọc:

#### Thống kê tổng quan:
- Tổng số báo cáo
- Báo cáo tháng này
- Báo cáo nghiêm trọng
- Tăng trưởng so với tháng trước

#### Biểu đồ:
1. **Phân bố độ tuổi** - Chỉ hiển thị độ tuổi bệnh nhân từ nơi báo cáo đã chọn
2. **Mức độ nghiêm trọng** - Phân tích mức độ nghiêm trọng theo nơi báo cáo
3. **Xu hướng theo tháng** - Xu hướng báo cáo 12 tháng gần nhất của nơi báo cáo
4. **Phân bố thuốc** - Top 10 thuốc nghi ngờ tại nơi báo cáo
5. **Kết quả điều trị** - Kết quả sau điều trị tại nơi báo cáo
6. **Top cơ sở** - Danh sách cơ sở (khi chọn tất cả) hoặc chỉ nơi báo cáo đã chọn
7. **Top thuốc nghi ngờ** - Top 10 thuốc chi tiết tại nơi báo cáo
8. **Phân tích nghề nghiệp** - Phân tích người báo cáo theo nghề nghiệp tại nơi báo cáo
9. **Báo cáo theo ngày** - Xu hướng báo cáo theo ngày của nơi báo cáo
10. **Phân bố giới tính** - Phân bố giới tính bệnh nhân tại nơi báo cáo

### 3. Indicator

Khi một nơi báo cáo được chọn (không phải "Tất cả"), một badge sẽ hiển thị:
- Vị trí: Bên phải tiêu đề "Thống kê và phân tích"
- Nội dung: "Lọc theo: [Tên nơi báo cáo]"
- Màu sắc: Nền xanh nhạt với chữ xanh đậm

## Cách sử dụng

### Bước 1: Truy cập Dashboard
```
Đăng nhập → Dashboard
```

### Bước 2: Chọn nơi báo cáo
1. Nhìn vào góc trên bên phải của trang
2. Tìm dropdown có icon phễu và text "Tất cả nơi báo cáo"
3. Click vào dropdown
4. Chọn nơi báo cáo muốn xem

### Bước 3: Xem kết quả
- Tất cả thống kê và biểu đồ sẽ tự động cập nhật
- Badge "Lọc theo" sẽ xuất hiện để xác nhận filter đang active

### Bước 4: Xem lại tất cả
- Chọn "Tất cả nơi báo cáo" từ dropdown để quay lại xem toàn bộ dữ liệu

## Kiến trúc kỹ thuật

### 1. Frontend

#### Dashboard Page (`app/dashboard/page.tsx`)
```typescript
// State management
const [departments, setDepartments] = useState<Department[]>([]);
const [selectedOrganization, setSelectedOrganization] = useState<string>('all');

// Load departments từ API
const loadDepartments = async () => {
  const response = await fetch('/api/public/departments');
  const result = await response.json();
  if (result.success) {
    setDepartments(result.data);
  }
};

// Load stats với organization filter
const loadStats = async () => {
  const url = selectedOrganization !== 'all'
    ? `/api/dashboard/stats?organization=${encodeURIComponent(selectedOrganization)}`
    : '/api/dashboard/stats';
  const response = await fetch(url);
  // ...
};
```

#### DashboardCharts Component
```typescript
interface DashboardChartsProps {
  organization?: string;  // New prop
}

// Pass organization filter to API
const url = organization && organization !== 'all' 
  ? `/api/dashboard/charts?organization=${encodeURIComponent(organization)}`
  : '/api/dashboard/charts';
```

### 2. Backend

#### Stats API (`app/api/dashboard/stats/route.ts`)
```typescript
export async function GET(request: NextRequest) {
  // Get organization filter from query params
  const { searchParams } = new URL(request.url);
  const organization = searchParams.get('organization');
  
  // Apply filter
  let reportsQuery = supabase.from('adr_reports').select('*');
  if (organization && organization !== 'all') {
    reportsQuery = reportsQuery.eq('organization', organization);
  }
  // ...
}
```

#### Charts API (`app/api/dashboard/charts/route.ts`)
```typescript
export async function GET(request: NextRequest) {
  const organization = searchParams.get('organization');
  
  // Helper function
  const addOrgFilter = (query: any) => {
    if (organization && organization !== 'all') {
      return query.eq('organization', organization);
    }
    return query;
  };
  
  // Apply to all queries
  let query = supabase.from('adr_reports').select('...');
  query = addOrgFilter(query);
  
  // For suspected_drugs (với join)
  let query = supabase
    .from('suspected_drugs')
    .select('drug_name, adr_reports!inner(organization)');
  if (organization && organization !== 'all') {
    query = query.eq('adr_reports.organization', organization);
  }
}
```

### 3. Data Flow

```
User selects organization
    ↓
Dashboard state updates
    ↓
Triggers re-fetch of stats and charts
    ↓
API receives organization parameter
    ↓
Supabase queries filtered by organization
    ↓
Data returned and displayed
```

## Lưu ý kỹ thuật

### 1. Performance
- Filter được thực hiện ở database level (Supabase)
- Không cần load toàn bộ data rồi filter ở client
- Queries được optimize với indexes trên cột `organization`

### 2. Data Consistency
- Sử dụng bảng `departments` để lấy danh sách nơi báo cáo hợp lệ
- Filter theo trường `organization` trong bảng `adr_reports`
- Đảm bảo tên organization phải khớp chính xác (case-sensitive)

### 3. Join Queries
- Với `suspected_drugs` và `concurrent_drugs`, cần join với `adr_reports` để filter
- Sử dụng `!inner` join để chỉ lấy records có report tương ứng
- Syntax: `.select('field, adr_reports!inner(organization)')`

### 4. Default Behavior
- Mặc định hiển thị "Tất cả nơi báo cáo"
- Parameter `organization=all` hoặc không có parameter = không filter

## Testing

### Test Case 1: View All
1. Mở dashboard
2. Verify dropdown hiển thị "Tất cả nơi báo cáo"
3. Verify stats hiển thị tất cả data
4. Verify không có badge "Lọc theo"

### Test Case 2: Filter by Organization
1. Chọn một department từ dropdown
2. Verify stats thay đổi
3. Verify badge "Lọc theo" hiển thị
4. Verify tất cả charts cập nhật
5. So sánh số liệu với database

### Test Case 3: Switch Organizations
1. Chọn department A
2. Note số liệu
3. Chọn department B
4. Verify số liệu khác nhau
5. Chọn lại "Tất cả"
6. Verify quay về tất cả data

### Test Case 4: Empty Results
1. Chọn department không có báo cáo nào
2. Verify hiển thị "0" trong stats
3. Verify charts hiển thị empty state
4. Không có error

## Troubleshooting

### Issue 1: Dropdown không hiển thị departments
**Nguyên nhân**: API `/api/public/departments` không hoạt động
**Giải pháp**:
- Kiểm tra bảng `departments` có dữ liệu
- Kiểm tra RLS policies cho bảng `departments`
- Check console logs

### Issue 2: Filter không hoạt động
**Nguyên nhân**: Organization name không khớp
**Giải pháp**:
- Kiểm tra tên organization trong `adr_reports` khớp với `departments`
- Sử dụng script fix-organizations nếu cần
- Verify case-sensitivity

### Issue 3: Charts không cập nhật
**Nguyên nhân**: Component không re-render
**Giải pháp**:
- Kiểm tra useEffect dependencies
- Verify organization prop được truyền đúng
- Check network tab để xem API có được gọi với đúng params

## Future Enhancements

### 1. Multi-select
Cho phép chọn nhiều nơi báo cáo cùng lúc để so sánh

### 2. Date Range Filter
Kết hợp filter organization với filter theo khoảng thời gian

### 3. Save Preferences
Lưu lựa chọn organization của user để lần sau tự động load

### 4. Export
Xuất báo cáo đã filter ra PDF/Excel

### 5. Comparison View
Hiển thị 2-3 organizations cạnh nhau để so sánh

## API Documentation

### GET /api/dashboard/stats
**Query Parameters:**
- `organization` (optional): Tên organization để filter. Nếu không có hoặc = 'all' thì không filter

**Response:**
```json
{
  "totalReports": 100,
  "newReportsThisMonth": 20,
  "criticalReports": 5,
  "previousMonthReports": 15,
  "growthRate": 33.3,
  "totalUsers": 50
}
```

### GET /api/dashboard/charts
**Query Parameters:**
- `organization` (optional): Tên organization để filter
- `type` (optional): Loại chart cụ thể (age, severity, trends, etc.)

**Response:**
```json
{
  "success": true,
  "data": {
    "ageDistribution": [...],
    "severityDistribution": [...],
    "monthlyTrends": [...],
    "drugDistribution": [...],
    "outcomeDistribution": [...],
    "topFacilities": [...],
    "topDrugs": [...],
    "occupationAnalysis": [...],
    "reportsByDate": [...],
    "genderDistribution": [...]
  }
}
```

## Changelog

### Version 1.0.0 (2025-10-04)
- ✨ Initial release
- ✨ Add organization dropdown filter
- ✨ Filter stats by organization
- ✨ Filter all charts by organization
- ✨ Add filter indicator badge
- 🔧 Optimize database queries with organization filter
- 📚 Add comprehensive documentation

---

**Developed by**: AI Assistant
**Date**: October 4, 2025
**Version**: 1.0.0





