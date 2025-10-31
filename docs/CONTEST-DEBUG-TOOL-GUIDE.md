# 🔍 Hướng dẫn sử dụng công cụ Debug Cuộc thi

## 📌 Tổng quan

Công cụ Debug Cuộc thi giúp Admin phát hiện và khắc phục lỗi **"Cuộc thi không tồn tại hoặc đã kết thúc"** một cách nhanh chóng và trực quan.

## 🚀 Cách truy cập

### Cách 1: Từ trang quản lý cuộc thi
1. Đăng nhập với tài khoản Admin
2. Truy cập `/admin/contest-management`
3. Click nút **🔍 Debug** (màu tím) ở góc phải trên

### Cách 2: Truy cập trực tiếp
- URL: `/admin/debug-contest`

## 🎯 Chức năng chính

### 1. **Hiển thị thời gian Server**
- Thời gian hiện tại của server (ISO format)
- Dùng để so sánh với `start_date` và `end_date` của cuộc thi

### 2. **Kiểm tra cuộc thi công khai**
- Hiển thị cuộc thi đang được phục vụ từ API `/api/contest/active`
- ✅ **Có cuộc thi công khai**: Màu xanh, người dùng có thể tham gia
- ❌ **Không có cuộc thi công khai**: Màu đỏ, người dùng thấy lỗi "không tồn tại"

### 3. **Phân tích chi tiết từng cuộc thi**
Mỗi cuộc thi trong database sẽ được phân tích với:

#### ✅ Cuộc thi OK (màu xanh)
- Tất cả điều kiện đều đạt
- Đang được hiển thị công khai

#### ❌ Cuộc thi LỖI (màu đỏ)
- Có ít nhất 1 điều kiện không đạt
- KHÔNG được hiển thị công khai

### 4. **Kiểm tra chi tiết các trường**

#### **Thông tin chính:**
| Trường | Yêu cầu | Mô tả |
|--------|---------|-------|
| `status` | = `"active"` | Trạng thái cuộc thi phải là "active" |
| `is_public` | = `true` | Cuộc thi phải được công khai |
| `id` | - | UUID của cuộc thi |

#### **Kiểm tra ngày:**
| Trường | Điều kiện OK | Mô tả |
|--------|--------------|-------|
| `start_date` | `NULL` HOẶC `<= now` | Cuộc thi đã bắt đầu hoặc không giới hạn |
| `end_date` | `NULL` HOẶC `>= now` | Cuộc thi chưa kết thúc hoặc không giới hạn |

### 5. **Nút hành động**

#### 🔧 **Fix: Set is_public = true**
- Hiện khi `is_public = false`
- Click để tự động sửa thành `true`
- Cần xác nhận trước khi thực hiện

#### **Xem chi tiết**
- Chuyển đến trang chi tiết & thống kê cuộc thi

## 🔧 Các lỗi thường gặp và cách khắc phục

### ❌ Lỗi 1: `is_public = false`

**Triệu chứng:**
```
is_public: false ❌ Phải là true
```

**Nguyên nhân:**
- Khi tạo cuộc thi, trường `is_public` không được set
- Hoặc đã bị sửa thành `false` trong quá trình chỉnh sửa

**Cách khắc phục:**
1. Click nút **🔧 Fix: Set is_public = true**
2. Xác nhận trong dialog
3. Reload trang để kiểm tra

**Hoặc fix thủ công:**
1. Vào trang sửa cuộc thi
2. Đảm bảo checkbox "Công khai" được tích
3. Lưu lại

---

### ❌ Lỗi 2: `status != "active"`

**Triệu chứng:**
```
status: draft ❌ Phải là "active"
```

**Nguyên nhân:**
- Cuộc thi chưa được kích hoạt
- Hoặc đã bị chuyển sang trạng thái khác (ended, archived)

**Cách khắc phục:**
1. Quay lại trang `/admin/contest-management`
2. Tìm cuộc thi
3. Click nút **"Kích hoạt"** (nếu status = draft)

---

### ❌ Lỗi 3: Ngày bắt đầu chưa tới

**Triệu chứng:**
```
start_date: 2025-12-01T00:00 ❌ Chưa tới
Hiện tại:   2025-10-31T10:30:00.000Z
```

**Nguyên nhân:**
- `start_date` lớn hơn thời gian hiện tại
- Cuộc thi chưa đến ngày bắt đầu

**Cách khắc phục:**

**Giải pháp 1: Xóa start_date (khuyến nghị nếu muốn bắt đầu ngay)**
1. Sửa cuộc thi
2. Xóa trống trường "Ngày bắt đầu"
3. Lưu lại
→ Cuộc thi sẽ bắt đầu ngay lập tức

**Giải pháp 2: Sửa start_date thành quá khứ**
1. Sửa cuộc thi
2. Đặt "Ngày bắt đầu" = ngày hôm nay hoặc trước đó
3. Lưu lại

---

### ❌ Lỗi 4: Ngày kết thúc đã qua

**Triệu chứng:**
```
end_date:   2025-01-12T00:00 ❌ Đã hết hạn
Hiện tại:   2025-10-31T10:30:00.000Z
```

**Nguyên nhân:**
- `end_date` nhỏ hơn thời gian hiện tại
- Cuộc thi đã hết hạn

**Lưu ý về định dạng ngày:**
- Nếu nhập `1/10/2025` → có thể bị hiểu là `10/1/2025` (January 10)
- Nếu nhập `1/12/2025` → có thể bị hiểu là `12/1/2025` (January 12)
- Khi hiện tại là 31/10/2025 → cuộc thi đã hết hạn từ tháng 1!

**Cách khắc phục:**

**Giải pháp 1: Xóa end_date (khuyến nghị cho cuộc thi không giới hạn)**
1. Sửa cuộc thi
2. Xóa trống trường "Ngày kết thúc"
3. Lưu lại
→ Cuộc thi không bao giờ hết hạn

**Giải pháp 2: Gia hạn end_date**
1. Sửa cuộc thi
2. Đặt "Ngày kết thúc" = ngày trong tương lai
3. **CHÚ Ý**: Dùng định dạng `YYYY-MM-DD` để tránh nhầm lẫn
   - Ví dụ: `2025-12-31T23:59` thay vì `31/12/2025`
4. Lưu lại

---

### ❌ Lỗi 5: Nhiều lỗi cùng lúc

**Triệu chứng:**
```
⚠️ Lý do không hiện:
• Status không phải "active" (hiện tại: draft)
• is_public không phải true (hiện tại: false)
• Cuộc thi đã kết thúc (end_date < now)
```

**Cách khắc phục:**
Xử lý từng lỗi theo thứ tự:
1. Fix `is_public` (dùng nút Fix)
2. Kích hoạt cuộc thi (set status = active)
3. Sửa ngày tháng nếu cần

---

## 📊 Ví dụ thực tế

### Case 1: Cuộc thi vừa tạo nhưng không hiện

**Tình huống:**
- Admin vừa tạo cuộc thi
- Click "Kích hoạt"
- Nhưng người dùng vẫn thấy "Cuộc thi không tồn tại"

**Debug:**
1. Vào `/admin/debug-contest`
2. Kiểm tra cuộc thi mới tạo
3. Thấy: `is_public: null ❌`

**Nguyên nhân:**
- Khi tạo cuộc thi, có thể `is_public` không được set đúng

**Khắc phục:**
- Click nút **🔧 Fix: Set is_public = true**
- Reload trang
- Cuộc thi hiện thành công ✅

---

### Case 2: Cuộc thi "đột nhiên" biến mất

**Tình huống:**
- Cuộc thi đang hoạt động bình thường
- Hôm sau không ai vào được
- Thông báo: "Cuộc thi không tồn tại"

**Debug:**
1. Vào `/admin/debug-contest`
2. Kiểm tra cuộc thi
3. Thấy: `end_date: 2025-01-12T00:00 ❌ Đã hết hạn`

**Nguyên nhân:**
- Khi tạo cuộc thi, admin nhập: "1/12/2025"
- Hệ thống hiểu là: **12 tháng 1 năm 2025** (January 12)
- Hiện tại là 31/10/2025 → cuộc thi đã hết hạn từ lâu!

**Khắc phục:**
1. Sửa cuộc thi
2. Đổi `end_date` thành `2025-12-01` (December 1)
3. Hoặc xóa trống để không giới hạn
4. Lưu lại
5. Cuộc thi hoạt động trở lại ✅

---

### Case 3: Cuộc thi test

**Tình huống:**
- Tạo cuộc thi để test
- Nhưng không muốn hiển thị công khai ngay
- Chỉ admin test trước

**Cách làm:**
1. Tạo cuộc thi với `is_public = false` (thủ công qua DB hoặc API)
2. Kích hoạt để test nội bộ
3. Debug tool sẽ báo: `is_public: false ❌`
4. Khi sẵn sàng công khai → Click nút Fix

---

## 💡 Best Practices

### 1. **Tạo cuộc thi đúng cách**
```typescript
{
  title: "Cuộc thi kiến thức ADR",
  status: "draft",           // Tạo draft trước
  is_public: true,            // ✅ Nhớ set true
  start_date: null,           // ✅ Để null nếu bắt đầu ngay
  end_date: null              // ✅ Để null nếu không giới hạn
}
```

### 2. **Quy trình tạo cuộc thi chuẩn**
1. ✅ Tạo cuộc thi (status = draft, is_public = true)
2. ✅ Import câu hỏi
3. ✅ Vào Debug tool kiểm tra
4. ✅ Kích hoạt (status = active)
5. ✅ Test trên trình duyệt ẩn danh
6. ✅ Công bố cho người dùng

### 3. **Định dạng ngày khuyến nghị**
- ✅ **Dùng**: `YYYY-MM-DD` hoặc `YYYY-MM-DDTHH:mm`
- ❌ **Tránh**: `DD/MM/YYYY` (dễ nhầm lẫn)

**Ví dụ:**
- ✅ Đúng: `2025-12-31T23:59`
- ❌ Sai: `31/12/2025`

### 4. **Checklist trước khi công bố cuộc thi**
- [ ] Status = "active"
- [ ] is_public = true
- [ ] start_date = null HOẶC đã qua
- [ ] end_date = null HOẶC chưa tới
- [ ] Đã import đủ câu hỏi
- [ ] Test thử trên `/contest`
- [ ] Kiểm tra trên debug tool (tất cả màu xanh ✅)

---

## 🐛 Troubleshooting nâng cao

### Vẫn không fix được?

#### Bước 1: Xem full JSON
1. Trong debug tool, mở phần "📄 Xem toàn bộ JSON"
2. Copy toàn bộ JSON
3. Paste vào công cụ format JSON online
4. Kiểm tra từng trường

#### Bước 2: Kiểm tra trong Supabase
1. Vào Supabase Dashboard
2. Table Editor → `contests`
3. Tìm cuộc thi theo `id`
4. Kiểm tra trực tiếp:
   - `status` = "active"
   - `is_public` = `true` (checkbox tích)
   - `start_date` và `end_date` đúng format ISO

#### Bước 3: Test API trực tiếp
```bash
# Test API công khai
curl https://your-domain.com/api/contest/active

# Kiểm tra response
# ✅ OK: { "success": true, "data": {...} }
# ❌ Lỗi: { "success": true, "data": null }
```

#### Bước 4: Kiểm tra console log
1. Mở DevTools (F12)
2. Tab Console
3. Reload trang `/contest`
4. Xem log từ API calls

---

## 📝 Lưu ý quan trọng

### 1. **Timezone**
- Server lưu thời gian theo UTC (ISO format)
- Khi so sánh, đảm bảo timezone đúng
- Debug tool hiển thị thời gian server chính xác

### 2. **Cache**
- Sau khi fix, hard refresh (Ctrl+Shift+R)
- Hoặc dùng trình duyệt ẩn danh để test

### 3. **Multiple contests**
- Hệ thống chỉ hiển thị **1 cuộc thi công khai** tại 1 thời điểm
- Nếu có nhiều cuộc thi active + public, lấy cuộc thi **mới nhất** (created_at DESC)

### 4. **Auto-end contests**
- API admin tự động chuyển cuộc thi sang "ended" nếu `end_date < now`
- Điều này xảy ra mỗi khi admin load trang

---

## 🎓 Kết luận

Công cụ Debug Cuộc thi giúp Admin:
- ✅ Phát hiện lỗi nhanh chóng
- ✅ Hiểu rõ nguyên nhân
- ✅ Khắc phục 1-click cho một số lỗi phổ biến
- ✅ Xem chi tiết toàn bộ dữ liệu

**Khi gặp lỗi "Cuộc thi không tồn tại":**
1. Vào `/admin/debug-contest`
2. Tìm cuộc thi màu đỏ ❌
3. Đọc phần "Lý do không hiện"
4. Click nút Fix hoặc sửa thủ công
5. Reload và kiểm tra lại

---

**Ngày tạo:** 31/10/2025  
**Version:** 1.0  
**Tác giả:** AI Assistant

