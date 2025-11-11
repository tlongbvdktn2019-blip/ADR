# 🚀 HƯỚNG DẪN NHANH: QR CÔNG KHAI THẺ DỊ ỨNG

## 📌 TL;DR (Too Long; Didn't Read)

**Thẻ dị ứng bây giờ có QR code công khai - quét là xem được ngay, không cần đăng nhập!**

---

## 🎯 Để làm gì?

Cho phép **bất kỳ ai** (bệnh nhân, nhân viên y tế, người nhà) quét QR trên thẻ dị ứng bằng **bất kỳ app QR nào** và xem được thông tin dị ứng **KHÔNG CẦN ĐĂNG NHẬP** vào hệ thống.

---

## ⚙️ Thiết lập ban đầu (QUAN TRỌNG!)

### **Bước 1: Set environment variable**

Thêm vào `.env` hoặc `.env.local`:

```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

**Lưu ý:** 
- Phải là domain **production** (có SSL/HTTPS)
- Không dùng `localhost` (sẽ không hoạt động trên mobile)

### **Bước 2: Deploy lên production**

```bash
# Build và deploy
npm run build
# Deploy lên Vercel/Netlify/server của bạn
```

### **Bước 3: Test**

1. Tạo 1 thẻ dị ứng mới
2. Lấy QR code
3. Quét bằng camera điện thoại
4. Xem có mở được trang thông tin không

---

## 📱 Cách sử dụng

### **Dành cho Bác sĩ/Admin:**

1. **Tạo thẻ dị ứng như bình thường** tại `/allergy-cards/new`
2. Hệ thống **tự động tạo QR công khai**
3. **In thẻ** hoặc export PDF
4. **Giao thẻ** cho bệnh nhân

### **Dành cho Bệnh nhân:**

1. **Nhận thẻ** có QR code từ bác sĩ
2. **Giữ thẻ bên mình** hoặc chụp ảnh lưu
3. Khi đến bệnh viện khác, **cho nhân viên quét QR**
4. Thông tin hiện ra ngay!

### **Dành cho Nhân viên y tế (khác cơ sở):**

1. **Yêu cầu bệnh nhân xuất trình thẻ** dị ứng
2. **Mở Camera** điện thoại (iPhone/Android)
3. **Quét QR code**
4. **Đọc thông tin dị ứng** trước khi điều trị

---

## 🔗 URLs mới

### **API công khai:**
```
GET /api/allergy-cards/public/AC-2024-000001
```
→ Trả về thông tin thẻ (JSON)

### **Trang công khai:**
```
GET /allergy-cards/public/AC-2024-000001
```
→ Hiển thị trang web đẹp với đầy đủ thông tin

### **QR code chứa:**
```
https://your-domain.com/allergy-cards/public/AC-2024-000001
```

---

## ✅ Checklist triển khai

- [ ] Set `NEXT_PUBLIC_APP_URL` trong environment
- [ ] Deploy lên production với HTTPS
- [ ] Test tạo thẻ mới
- [ ] Test quét QR bằng camera điện thoại
- [ ] Test mở được trang public view
- [ ] Test trên nhiều thiết bị (iOS, Android)
- [ ] Hướng dẫn bác sĩ/nhân viên cách sử dụng
- [ ] In thẻ mẫu để demo

---

## 🎨 Giao diện trang công khai

Trang public view có:
- 🚨 Header cảnh báo dị ứng nổi bật (màu đỏ)
- 👤 Thông tin bệnh nhân (tên, tuổi, giới tính)
- 🛡️ Danh sách dị ứng với mức độ nghiêm trọng
- 🏥 Thông tin bệnh viện & bác sĩ
- 📞 Số điện thoại có thể bấm gọi ngay
- 📅 Ngày cấp & ngày hết hạn (nếu có)

**Responsive:** Hiển thị đẹp trên cả mobile và desktop

---

## 🔐 An toàn không?

**CÓ** - Thông tin hiển thị là:
- Thông tin y tế cần thiết cho điều trị
- Không có thông tin nhạy cảm (user ID, password, etc.)
- Chỉ cho phép ĐỌC, không cho phép SỬA/XÓA

**Tương tự như:** Thẻ căn cước, bằng lái xe - ai cũng xem được khi cần

---

## ❓ FAQ

### **Q: QR cũ còn hoạt động không?**
A: CÓ. Thẻ tạo trước đây vẫn hoạt động, nhưng cần đăng nhập. Thẻ mới tạo từ bây giờ sẽ có QR công khai.

### **Q: Có thể re-generate QR cho thẻ cũ không?**
A: CÓ. Edit thẻ và save lại, hoặc contact admin để batch update.

### **Q: Phải có internet mới xem được?**
A: CÓ. Cần internet để load trang. Đang cân nhắc thêm chế độ offline sau.

### **Q: QR có thời hạn không?**
A: KHÔNG. QR không hết hạn, nhưng thẻ có thể có ngày hết hạn. Khi quét QR thẻ hết hạn, sẽ hiện cảnh báo.

### **Q: Làm sao biết ai đã quét QR?**
A: Hiện tại chưa track. Có thể thêm analytics sau nếu cần.

---

## 🐛 Gặp lỗi?

### **Lỗi: "Không tìm thấy thẻ"**
→ Kiểm tra mã thẻ đúng chưa, thẻ có trong DB không

### **Lỗi: QR không mở được**
→ Kiểm tra `NEXT_PUBLIC_APP_URL`, SSL certificate

### **Lỗi: Trang hiển thị lỗi layout**
→ Test trên browser khác, clear cache

---

## 📚 Tài liệu chi tiết

Xem: `docs/PUBLIC-QR-ALLERGY-CARD-GUIDE.md`

---

## 🎉 Xong!

Bây giờ thẻ dị ứng của bạn đã có QR công khai, sẵn sàng sử dụng trong trường hợp khẩn cấp!

**Happy scanning! 🚀**

