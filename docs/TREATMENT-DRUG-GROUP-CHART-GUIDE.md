# Hướng dẫn biểu đồ Top 5 Nhóm thuốc điều trị nghi ngờ

## Tổng quan

Đã thêm biểu đồ **"Top 5 Nhóm thuốc điều trị nghi ngờ gây ADR"** vào dashboard. Biểu đồ này hiển thị 5 nhóm thuốc có nhiều báo cáo nghi ngờ gây ADR nhất.

## Vị trí hiển thị

Biểu đồ xuất hiện trong Dashboard, được đặt sau:
- Top 10 cơ sở có nhiều báo cáo nhất
- Top 10 thuốc nghi ngờ

Và trước:
- Biểu đồ mức độ nghiêm trọng
- Biểu đồ giới tính

## Các thay đổi đã thực hiện

### 1. API Endpoint
**File**: `app/api/dashboard/charts/route.ts`
- Thêm endpoint mới để lấy dữ liệu nhóm thuốc điều trị
- Query từ bảng `suspected_drugs` với trường `treatment_drug_group`
- Hỗ trợ lọc theo organization
- Chỉ lấy top 5 nhóm thuốc (loại bỏ "Chưa xác định")

### 2. Component Chart
**File**: `components/charts/TreatmentDrugGroupChart.tsx`
- Tạo component biểu đồ dạng horizontal bar chart
- Hiển thị:
  - Số lượng báo cáo cho mỗi nhóm thuốc
  - Phần trăm so với tổng
  - Chi tiết top 5 với màu sắc riêng biệt
  - Thông tin phân tích và cảnh báo
- Loading state và empty state

### 3. Dashboard Integration
**File**: `components/charts/DashboardCharts.tsx`
- Import component mới `TreatmentDrugGroupChart`
- Thêm vào interface `ChartData`
- Hiển thị trong cả 2 layout: `grid` và `stacked`
- Export component để có thể sử dụng riêng lẻ

## Dữ liệu hiển thị

Biểu đồ hiển thị:
- **Tên nhóm thuốc**: Từ trường `treatment_drug_group` trong bảng `suspected_drugs`
- **Số lượng**: Tổng số báo cáo có nhóm thuốc đó
- **Phần trăm**: Tỷ lệ so với tổng số báo cáo có thông tin nhóm thuốc
- **Top 5**: Chỉ hiển thị 5 nhóm thuốc có số lượng cao nhất

## Tính năng

### 1. Horizontal Bar Chart
- Sử dụng Recharts để vẽ biểu đồ
- Màu sắc khác nhau cho mỗi nhóm (5 màu: blue, red, green, amber, purple)
- Label hiển thị số lượng ngay trên thanh bar
- Responsive và tự động điều chỉnh kích thước

### 2. Chi tiết danh sách
Dưới biểu đồ có phần chi tiết hiển thị:
- Tên nhóm thuốc
- Số lượng báo cáo
- Phần trăm
- Badge "Cao nhất" cho nhóm thuốc đứng đầu

### 3. Thông tin phân tích
Card màu xanh ở cuối hiển thị:
- Nhóm thuốc có nhiều báo cáo nhất
- Tổng phần trăm của top 5
- Khuyến nghị giám sát

### 4. Tooltip
Khi hover vào bar chart, hiển thị:
- Tên nhóm thuốc
- Số báo cáo
- Tỷ lệ phần trăm

### 5. Empty State
Khi chưa có dữ liệu:
- Hiển thị thông báo thân thiện
- Giải thích lý do (chưa điền thông tin nhóm thuốc)

### 6. Lọc theo Organization
Biểu đồ tự động cập nhật khi người dùng chọn organization khác trên dashboard

## Cách hoạt động

1. Dashboard gọi API `/api/dashboard/charts?organization=...`
2. API query bảng `suspected_drugs` với join `adr_reports` để lọc theo organization
3. Đếm số lượng mỗi nhóm thuốc, tính phần trăm
4. Sắp xếp giảm dần, lấy top 5 (loại bỏ "Chưa xác định")
5. Component nhận dữ liệu và render biểu đồ

## Yêu cầu

- Trường `treatment_drug_group` phải đã được thêm vào bảng `suspected_drugs`
- Người dùng cần điền thông tin nhóm thuốc khi tạo báo cáo
- Dữ liệu từ bảng `treatment_drugs` cần có sẵn

## Ví dụ dữ liệu

```typescript
[
  {
    groupName: "Thuốc kháng sinh",
    count: 45,
    percentage: 35
  },
  {
    groupName: "Thuốc giảm đau",
    count: 32,
    percentage: 25
  },
  {
    groupName: "Thuốc hạ sốt",
    count: 25,
    percentage: 19
  },
  {
    groupName: "Thuốc chống viêm",
    count: 18,
    percentage: 14
  },
  {
    groupName: "Thuốc tim mạch",
    count: 9,
    percentage: 7
  }
]
```

## Màu sắc

Biểu đồ sử dụng 5 màu:
1. Blue (#3b82f6) - Top 1
2. Red (#ef4444) - Top 2
3. Green (#10b981) - Top 3
4. Amber (#f59e0b) - Top 4
5. Purple (#8b5cf6) - Top 5

## Responsive Design

- Desktop (xl): Chiều rộng full (col-span-2)
- Tablet/Mobile: Tự động điều chỉnh
- Chart height: 288px (h-72)
- Loading skeleton tương tự với các biểu đồ khác

## Lợi ích

1. **Giám sát an toàn thuốc**: Xác định nhanh nhóm thuốc có nhiều ADR
2. **Ra quyết định**: Hỗ trợ đưa ra chính sách dược liệu hợp lý
3. **Cảnh báo sớm**: Phát hiện xu hướng ADR theo nhóm thuốc
4. **Báo cáo**: Dễ dàng trích xuất thống kê cho báo cáo định kỳ
5. **Tổng quan**: Hiểu rõ phân bố ADR theo phân loại thuốc

## Khắc phục sự cố

### Biểu đồ không hiển thị dữ liệu
1. Kiểm tra các báo cáo có trường `treatment_drug_group` được điền không
2. Đảm bảo migration đã được chạy
3. Kiểm tra console có lỗi API không

### Dữ liệu không cập nhật khi lọc organization
1. Refresh trang
2. Kiểm tra API response trong Network tab
3. Đảm bảo organization filter được truyền đúng

## Ngày tạo
05/10/2025





