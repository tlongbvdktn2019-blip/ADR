# Hướng dẫn Biểu đồ Dashboard

## Tổng quan

Dashboard hiển thị các biểu đồ phân tích chi tiết về dữ liệu báo cáo ADR (Adverse Drug Reaction). Tất cả các biểu đồ được tự động cập nhật dựa trên dữ liệu thực tế từ hệ thống.

## Các Biểu đồ Hiện có

### 1. **Xu hướng báo cáo theo tháng** 📊
- **Loại**: Biểu đồ đường/cột theo thời gian
- **Component**: `ReportsByDateChart`
- **Dữ liệu**: Số lượng báo cáo theo từng tháng, phân loại nghiêm trọng/không nghiêm trọng
- **Mục đích**: Theo dõi xu hướng và tăng trưởng báo cáo theo thời gian

### 2. **Top 5 Nơi báo cáo có số lượng nhiều nhất** 🏥
- **Loại**: Biểu đồ cột ngang (Horizontal Bar Chart)
- **Component**: `Top10FacilitiesChart`
- **Dữ liệu**: Top cơ sở y tế có nhiều báo cáo ADR nhất
- **Hiển thị**: 
  - Top 10 trên biểu đồ
  - Chi tiết Top 5 với số lượng và tỷ lệ phần trăm
  - Thông tin phân tích tổng quan

### 3. **Top 5 Thuốc nghi ngờ** 💊
- **Loại**: Biểu đồ cột ngang (Horizontal Bar Chart)
- **Component**: `TopDrugsChart`
- **Dữ liệu**: Các thuốc được nghi ngờ gây ADR nhiều nhất
- **Hiển thị**:
  - Tên thuốc chung và tên thương mại
  - Số lượng báo cáo và tỷ lệ phần trăm
  - Top 10 trên biểu đồ, chi tiết Top 5

### 4. **Số lượng và tỷ lệ báo cáo mức độ nghiêm trọng** ⚠️
- **Loại**: Biểu đồ tròn (Pie Chart)
- **Component**: `SeverityLevelChart`
- **Dữ liệu**: Phân bố mức độ nghiêm trọng của ADR
- **Các mức độ**:
  - Tử vong
  - Nguy hiểm tính mạng
  - Nhập viện
  - Kéo dài nằm viện
  - Tàn tật
  - Dị tật bẩm sinh
  - Quan trọng khác
  - Không nghiêm trọng
- **Cảnh báo**: Hiển thị cảnh báo nếu có trường hợp nghiêm trọng

### 5. **Số lượng và tỷ lệ theo Giới tính** 👥
- **Loại**: Biểu đồ tròn (Pie Chart)
- **Component**: `GenderDistributionChart`
- **Dữ liệu**: Phân bố báo cáo theo giới tính bệnh nhân
- **Hiển thị**:
  - Tỷ lệ Nam/Nữ
  - Phân tích xu hướng giới tính
  - Số lượng và phần trăm chi tiết

### 6. **Độ tuổi được báo cáo** 👶👴
- **Loại**: Biểu đồ cột (Bar Chart)
- **Component**: `AgeDistributionChart`
- **Dữ liệu**: Phân bố độ tuổi bệnh nhân
- **Nhóm tuổi**:
  - 0-18 tuổi
  - 19-30 tuổi
  - 31-50 tuổi
  - 51-65 tuổi
  - 66+ tuổi
- **Hiển thị**: Số lượng và tỷ lệ phần trăm cho mỗi nhóm tuổi

### 7. **Tỷ lệ theo Nghề nghiệp của người báo cáo** 👨‍⚕️
- **Loại**: Biểu đồ cột ngang (Horizontal Bar Chart)
- **Component**: `OccupationAnalysisChart`
- **Dữ liệu**: Phân bố nghề nghiệp của người báo cáo ADR
- **Hiển thị**: 
  - Danh sách đầy đủ các nghề nghiệp
  - Số lượng báo cáo và tỷ lệ phần trăm
  - Phân tích về vai trò của từng nhóm nghề nghiệp

### 8. **Kết quả sau điều trị** 🏥
- **Loại**: Biểu đồ tròn (Pie Chart)
- **Component**: `OutcomeDistributionChart`
- **Dữ liệu**: Kết quả điều trị sau khi có ADR
- **Các kết quả**:
  - Hoàn toàn khỏi
  - Đang hồi phục
  - Chưa khỏi
  - Khỏi có di chứng
  - Tử vong

## API Endpoints

### GET `/api/dashboard/stats`
Lấy thống kê tổng quan cho dashboard
```json
{
  "totalReports": 150,
  "newReportsThisMonth": 25,
  "criticalReports": 10,
  "previousMonthReports": 20,
  "growthRate": 25.0
}
```

### GET `/api/dashboard/charts`
Lấy dữ liệu cho tất cả các biểu đồ

**Query Parameters:**
- `type` (optional): Lọc theo loại biểu đồ cụ thể
  - `age` - Độ tuổi
  - `severity` - Mức độ nghiêm trọng
  - `trends` - Xu hướng theo tháng
  - `drugs` - Thuốc
  - `outcomes` - Kết quả điều trị
  - `facilities` - Cơ sở báo cáo
  - `topDrugs` - Top thuốc chi tiết
  - `occupation` - Nghề nghiệp
  - `reportsByDate` - Báo cáo theo ngày
  - `gender` - Giới tính

**Response:**
```json
{
  "success": true,
  "data": {
    "ageDistribution": [...],
    "severityDistribution": [...],
    "genderDistribution": [...],
    "topFacilities": [...],
    "topDrugs": [...],
    "occupationAnalysis": [...],
    "monthlyTrends": [...],
    "reportsByDate": [...]
  }
}
```

## Cách sử dụng Components

### Sử dụng tất cả biểu đồ
```tsx
import DashboardCharts from '@/components/charts/DashboardCharts';

<DashboardCharts layout="grid" showAll={true} />
```

### Sử dụng từng biểu đồ riêng lẻ
```tsx
import { 
  GenderDistributionChart,
  SeverityLevelChart,
  AgeDistributionChart 
} from '@/components/charts/DashboardCharts';

// Tự load dữ liệu
const [chartData, setChartData] = useState({});

<GenderDistributionChart 
  data={chartData.genderDistribution || []} 
  isLoading={false} 
/>
```

## Layout Options

### Grid Layout (Mặc định)
```tsx
<DashboardCharts layout="grid" showAll={true} />
```
- Hiển thị biểu đồ trong lưới 2 cột responsive
- Một số biểu đồ chiếm toàn bộ chiều rộng (full width)

### Stacked Layout
```tsx
<DashboardCharts layout="stacked" showAll={true} />
```
- Hiển thị các biểu đồ xếp chồng theo chiều dọc
- Phù hợp cho màn hình nhỏ hoặc mobile

## Tính năng

### ✅ Đã triển khai
- ✅ Top 5 Nơi báo cáo có số lượng nhiều nhất
- ✅ Top 5 thuốc nghi ngờ  
- ✅ Độ tuổi được báo cáo
- ✅ Số lượng và tỷ lệ theo Giới tính
- ✅ Tỷ lệ theo Nghề nghiệp của người báo cáo
- ✅ Xu hướng báo cáo theo tháng
- ✅ Số lượng và tỷ lệ báo cáo mức độ nghiêm trọng
- ✅ Loading states cho tất cả biểu đồ
- ✅ Empty states khi không có dữ liệu
- ✅ Tooltips chi tiết
- ✅ Responsive design
- ✅ Export individual charts

### 🎨 Màu sắc và Design
- Sử dụng màu sắc phù hợp với từng loại dữ liệu
- Màu đỏ cho các trường hợp nghiêm trọng
- Màu xanh cho nam giới, màu hồng cho nữ giới
- Gradients và shadows hiện đại
- Animations mượt mà

## Performance

- **Lazy loading**: Dữ liệu được load khi cần thiết
- **Caching**: Dữ liệu được cache để giảm số lần gọi API
- **Responsive**: Tự động điều chỉnh theo kích thước màn hình
- **Error handling**: Xử lý lỗi gracefully với retry button

## Bảo mật

- ✅ Yêu cầu authentication
- ✅ Session validation
- ✅ RLS (Row Level Security) trên Supabase
- ✅ API rate limiting ready

## Troubleshooting

### Biểu đồ không hiển thị dữ liệu
1. Kiểm tra console log để xem có lỗi API không
2. Đảm bảo user đã đăng nhập
3. Kiểm tra RLS policies trên Supabase
4. Verify dữ liệu trong database

### Loading quá lâu
1. Kiểm tra kết nối internet
2. Check Supabase dashboard để xem database health
3. Monitor API response time

### Styling issues
1. Đảm bảo Tailwind CSS được cấu hình đúng
2. Check recharts dependencies
3. Clear cache và rebuild

## Tương lai

Các cải tiến có thể thêm:
- [ ] Export biểu đồ ra PDF/PNG
- [ ] Filters theo thời gian
- [ ] Compare periods
- [ ] Real-time updates với Supabase Realtime
- [ ] Custom date ranges
- [ ] Dashboard templates
- [ ] Save/share dashboard views

---

**Cập nhật lần cuối**: 2025-10-03
**Phiên bản**: 1.0.0

