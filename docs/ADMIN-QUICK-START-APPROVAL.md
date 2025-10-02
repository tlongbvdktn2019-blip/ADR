# 🚀 Hướng dẫn nhanh: Duyệt báo cáo ADR (Dành cho Admin)

## 📋 Tổng quan nhanh

Bạn là admin và cần duyệt các báo cáo ADR? Đây là hướng dẫn nhanh!

## 🎯 Các trạng thái báo cáo

| Trạng thái | Ý nghĩa | Icon |
|-----------|---------|------|
| 🟡 **Chưa duyệt** | Báo cáo mới, chưa được xem xét | 🕐 |
| ✅ **Đã duyệt** | Bạn đã phê duyệt báo cáo này | ✅ |
| ❌ **Từ chối** | Bạn đã từ chối báo cáo này | ❌ |

## 📖 Cách sử dụng

### 1️⃣ Xem danh sách báo cáo cần duyệt

1. Đăng nhập vào hệ thống
2. Vào menu **"Báo cáo ADR"** 
3. Bạn sẽ thấy tất cả báo cáo với cột **"Trạng thái"**

```
┌──────────────────────────────────────────────────────┐
│  Mã BC    │ Bệnh nhân  │ Mức độ  │ Trạng thái       │
├──────────────────────────────────────────────────────┤
│ 2025-0001 │ Nguyễn A   │ Nghiêm  │ 🟡 Chưa duyệt   │ <- CẦN DUYỆT
│ 2025-0002 │ Trần B     │ Nhẹ     │ ✅ Đã duyệt     │
│ 2025-0003 │ Lê C       │ Trung bì│ ❌ Từ chối      │
└──────────────────────────────────────────────────────┘
```

### 2️⃣ Duyệt báo cáo

**Cách 1: Từ danh sách**

1. Tìm báo cáo có trạng thái 🟡 **Chưa duyệt**
2. Click nút **[Duyệt]** (màu xanh) bên cạnh báo cáo
3. Xác nhận trong dialog popup
4. ✅ Xong! Trạng thái sẽ đổi thành **Đã duyệt**

**Cách 2: Từ trang chi tiết**

1. Click **[Xem]** để mở chi tiết báo cáo
2. Đọc kỹ thông tin báo cáo
3. Click nút **[Duyệt báo cáo]** (màu xanh) ở góc trên bên phải
4. Xác nhận
5. ✅ Hoàn tất!

### 3️⃣ Từ chối báo cáo

**Khi nào nên từ chối?**
- Thông tin không đầy đủ
- Dữ liệu không chính xác
- Báo cáo trùng lặp
- Vi phạm quy định

**Các bước từ chối:**

1. Tìm báo cáo cần từ chối
2. Click nút **[Từ chối]** (màu đỏ)
3. Xác nhận trong dialog
4. ❌ Báo cáo sẽ có trạng thái **Từ chối**

> 💡 **Tip:** Trong tương lai, bạn có thể thêm ghi chú lý do từ chối!

### 4️⃣ Thay đổi quyết định

Bạn có thể thay đổi trạng thái duyệt bất cứ lúc nào:

- **Từ "Đã duyệt"** → Click **[Từ chối]**
- **Từ "Từ chối"** → Click **[Duyệt]**
- Cả hai → Có thể về **"Chưa duyệt"** (liên hệ developer)

## 🖥️ Giao diện

### Trang danh sách
![Approval in List](../public/screenshots/approval-list.png)

Bạn sẽ thấy:
- ✅ Cột **Trạng thái** với icon màu sắc
- ✅ Nút **Duyệt** (xanh) và **Từ chối** (đỏ)
- ✅ Các nút tự động ẩn khi không cần thiết

### Trang chi tiết
![Approval in Detail](../public/screenshots/approval-detail.png)

Header hiển thị:
```
📋 2025-0001  [Nghiêm trọng]  [🟡 Chưa duyệt]
                                    ↑
                            Badge trạng thái

[Duyệt báo cáo] [Từ chối] [Chỉnh sửa] [In] [PDF]
      ↑            ↑
   Nút duyệt    Nút từ chối
```

## ⚡ Shortcuts & Tips

### ⌨️ Workflow nhanh

```
1. Vào /reports
2. Tìm báo cáo 🟡 Chưa duyệt
3. Click [Xem] → Đọc nhanh
4. Click [Duyệt] → Xác nhận
5. Tự động quay về danh sách
```

### 🎯 Prioritize

**Duyệt theo mức độ ưu tiên:**

1. **Nghiêm trọng** (🔴 Đỏ) - Duyệt ngay
2. **Trung bình** (🟠 Cam) - Duyệt trong ngày
3. **Nhẹ** (🟢 Xanh) - Có thể duyệt sau

### 📊 Xem thống kê

Trong tương lai sẽ có dashboard hiển thị:
- Số báo cáo chưa duyệt
- Tỷ lệ duyệt/từ chối
- Thời gian duyệt trung bình

## ❓ FAQ - Câu hỏi thường gặp

### Q: Tôi không thấy nút Duyệt/Từ chối?

**A:** Kiểm tra:
- ✅ Bạn đã đăng nhập với tài khoản admin chưa?
- ✅ Tài khoản của bạn có role = 'admin' trong database chưa?
- ✅ Thử logout và login lại

### Q: Sau khi duyệt, trạng thái không đổi?

**A:** 
- Chờ vài giây, có thể đang load
- Refresh trang (F5)
- Kiểm tra kết nối internet

### Q: Tôi duyệt nhầm, phải làm sao?

**A:** Đừng lo! Bạn có thể:
- Click nút **[Từ chối]** để đổi sang từ chối
- Hoặc liên hệ developer để reset về "Chưa duyệt"

### Q: User thường có thấy tôi duyệt không?

**A:** 
- User **CHỈ** thấy trạng thái (Đã duyệt/Chưa duyệt/Từ chối)
- User **KHÔNG** thấy nút duyệt/từ chối
- User **KHÔNG** biết ai là người duyệt (hiện tại)

### Q: Tôi có thể duyệt hàng loạt không?

**A:** Chưa có tính năng này. Hiện tại phải duyệt từng báo cáo một.
_(Tính năng bulk approval sẽ được thêm trong tương lai)_

### Q: Có thể xem lịch sử duyệt không?

**A:** Hiện tại chưa có UI hiển thị, nhưng dữ liệu đã được lưu:
- Người duyệt (`approved_by`)
- Thời gian duyệt (`approved_at`)

_(Tính năng approval history sẽ được thêm trong tương lai)_

## 🚨 Lưu ý quan trọng

### ⚠️ Trước khi duyệt

Hãy kiểm tra:
- [ ] Thông tin bệnh nhân đầy đủ
- [ ] Mô tả ADR rõ ràng
- [ ] Thuốc nghi ngờ được khai báo
- [ ] Thẩm định được thực hiện
- [ ] Người báo cáo có thông tin liên hệ

### ⚠️ Trước khi từ chối

- [ ] Đã liên hệ người báo cáo chưa?
- [ ] Có thể yêu cầu bổ sung thay vì từ chối?
- [ ] Đã ghi chú lý do từ chối? (tính năng sắp có)

### ⚠️ Bảo mật

- 🔒 **KHÔNG** chia sẻ tài khoản admin
- 🔒 **KHÔNG** duyệt báo cáo khi chưa đọc kỹ
- 🔒 **LOGOUT** khi rời khỏi máy tính

## 📞 Liên hệ hỗ trợ

Gặp vấn đề? Liên hệ:
- **Email:** support@yourcompany.com
- **Hotline:** 1900-xxxx
- **Developer Team:** dev@yourcompany.com

## 📚 Tài liệu chi tiết

Muốn tìm hiểu sâu hơn?
- [Hướng dẫn đầy đủ](./APPROVAL-FEATURE-GUIDE.md)
- [Changelog](../CHANGELOG-APPROVAL-FEATURE.md)
- [API Documentation](./APPROVAL-FEATURE-GUIDE.md#api-endpoints)

---

**🎉 Chúc bạn duyệt báo cáo hiệu quả!**

_Phiên bản: 1.0.0 | Cập nhật: 2025-10-02_




