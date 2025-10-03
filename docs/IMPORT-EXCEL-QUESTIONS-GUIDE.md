# Hướng Dẫn Import Câu Hỏi từ Excel

## 📋 Tổng quan

Hệ thống cho phép Admin thêm hàng loạt câu hỏi vào ngân hàng câu hỏi bằng cách import file Excel. Điều này giúp tiết kiệm thời gian so với việc thêm từng câu hỏi một.

## 🚀 Các bước thực hiện

### Bước 1: Truy cập trang Quản lý Quiz

1. Đăng nhập với tài khoản Admin
2. Vào **Dashboard** → **Admin** → **Quiz Management**
3. Chọn tab **Questions**

### Bước 2: Tải Template Excel Mẫu

1. Click nút **"Import Excel"** (màu xanh lá)
2. Trong cửa sổ Import, click **"Tải Template Excel Mẫu"**
3. File `template-cau-hoi-adr.xlsx` sẽ được tải về máy

### Bước 3: Điền thông tin câu hỏi vào Excel

Mở file template và điền thông tin theo các cột:

#### Các cột bắt buộc:

| Cột | Mô tả | Giá trị hợp lệ | Ví dụ |
|-----|-------|----------------|-------|
| **Danh mục** | Tên danh mục (phải tồn tại trong hệ thống) | WHO-UMC, Naranjo, Kiến thức thuốc, v.v. | WHO-UMC |
| **Câu hỏi** | Nội dung câu hỏi | Văn bản tự do | WHO-UMC là gì? |
| **Độ khó** | Mức độ khó của câu hỏi | beginner, intermediate, advanced, expert | beginner |
| **Đáp án A** | Lựa chọn A | Văn bản tự do | World Health Organization |
| **Đáp án B** | Lựa chọn B | Văn bản tự do | World Hospital Organization |
| **Đáp án C** | Lựa chọn C | Văn bản tự do | World Hygiene Organization |
| **Đáp án D** | Lựa chọn D | Văn bản tự do | World Healthcare Organization |
| **Đáp án đúng** | Đáp án chính xác | A, B, C, hoặc D (viết hoa) | A |
| **Giải thích** | Giải thích tại sao đáp án đúng | Văn bản tự do | WHO-UMC là tổ chức giám sát... |
| **Tài liệu tham khảo** | Nguồn tham khảo | Văn bản tự do | WHO Guidelines 2021 |
| **Thời gian (giây)** | Thời gian làm bài | Số nguyên (mặc định: 60) | 60 |
| **Điểm** | Điểm số | Số nguyên (mặc định: 10) | 10 |

#### ⚠️ Lưu ý quan trọng:

1. **Danh mục phải tồn tại**: Tên danh mục phải khớp chính xác với tên trong hệ thống
   - Kiểm tra danh mục có sẵn: Vào tab **Categories** để xem danh sách
   
2. **Độ khó hợp lệ**:
   - `beginner` - Dễ
   - `intermediate` - Trung bình
   - `advanced` - Nâng cao
   - `expert` - Chuyên gia

3. **Đáp án đúng**:
   - Phải viết HOA: A, B, C, hoặc D
   - Phải khớp với một trong các đáp án đã điền

4. **Tối thiểu 2 đáp án**: Mỗi câu hỏi phải có ít nhất 2 lựa chọn

### Bước 4: Upload và Import

1. Sau khi điền xong, lưu file Excel
2. Quay lại cửa sổ Import trong hệ thống
3. Click vào vùng "Click để chọn file..." hoặc kéo thả file vào
4. Click nút **"Upload và Import"**
5. Đợi hệ thống xử lý

### Bước 5: Kiểm tra kết quả

Sau khi import xong, hệ thống sẽ hiển thị:

- ✅ **Tổng số dòng**: Tất cả dòng trong file Excel
- ✅ **Import thành công**: Số câu hỏi đã được thêm vào database
- ⚠️ **Có lỗi**: Số dòng bị lỗi

Nếu có lỗi, chi tiết lỗi sẽ được hiển thị để bạn sửa lại file Excel.

## 📊 Ví dụ dữ liệu Excel

```
Danh mục    | Câu hỏi                      | Độ khó       | Đáp án A           | Đáp án B              | Đáp án C               | Đáp án D                | Đáp án đúng | Giải thích                        | Tài liệu tham khảo | Thời gian | Điểm
------------|------------------------------|--------------|--------------------|-----------------------|------------------------|-------------------------|-------------|-----------------------------------|-------------------|-----------|------
WHO-UMC     | WHO-UMC là gì?              | beginner     | World Health Org   | World Hospital Org    | World Hygiene Org      | World Healthcare Org    | A           | WHO-UMC là tổ chức giám sát...    | WHO Guidelines    | 60        | 10
Naranjo     | Thang điểm Naranjo có bao... | intermediate | 5 câu hỏi          | 10 câu hỏi            | 15 câu hỏi             | 20 câu hỏi              | B           | Thang Naranjo gồm 10 câu hỏi      | Naranjo Paper 1981| 90        | 15
```

## 🔧 Xử lý lỗi thường gặp

### 1. "Không tìm thấy danh mục"

**Nguyên nhân**: Tên danh mục trong Excel không khớp với database

**Giải pháp**:
- Vào tab **Categories** để xem danh sách danh mục chính xác
- Sửa lại tên trong Excel cho khớp (chú ý chữ hoa/thường)

### 2. "Độ khó không hợp lệ"

**Nguyên nhân**: Giá trị độ khó không đúng format

**Giải pháp**:
- Chỉ dùng một trong các giá trị: `beginner`, `intermediate`, `advanced`, `expert`
- Viết thường, không dấu

### 3. "Đáp án đúng không khớp với các lựa chọn"

**Nguyên nhân**: Đáp án đúng không phải A, B, C, hoặc D

**Giải pháp**:
- Kiểm tra cột "Đáp án đúng" phải là A, B, C, hoặc D
- Viết HOA
- Đảm bảo đáp án tương ứng đã được điền

### 4. "Phải có ít nhất 2 đáp án"

**Nguyên nhân**: Chưa điền đủ đáp án

**Giải pháp**:
- Điền ít nhất 2 đáp án (A và B)
- Có thể để trống C và D nếu chỉ có 2 lựa chọn

## 💡 Tips và Best Practices

### 1. Chuẩn bị dữ liệu

- ✅ Tạo file Excel riêng cho từng danh mục để dễ quản lý
- ✅ Kiểm tra kỹ chính tả và nội dung trước khi import
- ✅ Bắt đầu với số lượng nhỏ (5-10 câu) để test

### 2. Quản lý danh mục

- ✅ Tạo đầy đủ danh mục trước khi import
- ✅ Dùng tên danh mục ngắn gọn, rõ ràng
- ✅ Lưu danh sách danh mục để tham khảo

### 3. Viết câu hỏi chất lượng

- ✅ Câu hỏi rõ ràng, không gây nhầm lẫn
- ✅ Đáp án đồng nhất về độ dài và cấu trúc
- ✅ Giải thích chi tiết, có nguồn tham khảo
- ✅ Thời gian phù hợp với độ khó

### 4. Import hiệu quả

- ✅ Import theo batch nhỏ (10-50 câu/lần)
- ✅ Kiểm tra kết quả sau mỗi lần import
- ✅ Sửa lỗi ngay, không để tích lũy

## 🎯 Workflow khuyến nghị

```
1. Tạo danh mục trong hệ thống
   ↓
2. Tải template Excel
   ↓
3. Chuẩn bị 5-10 câu hỏi mẫu
   ↓
4. Import thử nghiệm
   ↓
5. Kiểm tra kết quả
   ↓
6. Điều chỉnh format nếu cần
   ↓
7. Import full danh sách câu hỏi
   ↓
8. Kiểm tra và hoàn thiện
```

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra lại format Excel theo template
2. Xem chi tiết lỗi trong kết quả import
3. Thử import với số lượng nhỏ hơn
4. Liên hệ team support nếu vẫn gặp lỗi

## 🔄 Cập nhật và Bảo trì

- Import không ghi đè câu hỏi cũ
- Câu hỏi mới được thêm vào cuối danh sách
- Có thể import nhiều lần cho cùng một danh mục
- Để sửa câu hỏi đã import, dùng chức năng Edit trong UI

---

**Phiên bản**: 1.0  
**Cập nhật**: October 2025



