# 🚀 HƯỚNG DẪN FIX NHANH - Người dùng không vào được cuộc thi

## ⚡ CÁCH FIX NHANH NHẤT (30 GIÂY)

### **Bước 1: Mở Supabase SQL Editor**
1. Vào [Supabase Dashboard](https://supabase.com/dashboard)
2. Chọn project `Codex-ADR`
3. Mở **SQL Editor** (biểu tượng </> ở sidebar bên trái)

### **Bước 2: Copy và chạy script**
Copy toàn bộ nội dung file `supabase/fix-contest-complete.sql` và paste vào SQL Editor, sau đó nhấn **Run**.

### **Bước 3: Xem kết quả**
Kéo xuống cuối kết quả, bạn sẽ thấy:

```
✅✅✅ HOÀN THÀNH - Người dùng có thể vào cuộc thi!
```

### **Bước 4: Test ngay**
1. Mở trình duyệt ẩn danh
2. Truy cập: `https://adr-liart.vercel.app/contest`
3. ✅ Cuộc thi sẽ hiển thị!

---

## 🔍 KIỂM TRA CHI TIẾT

### **Test API trực tiếp:**
Mở URL này trong trình duyệt:
```
https://adr-liart.vercel.app/api/contest/active
```

**Kết quả đúng:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Kiến thức ADR",
    "status": "active",
    "is_public": true,
    "start_date": null,
    "end_date": null,
    ...
  }
}
```

**Nếu thấy `"data": null`** → Script chưa chạy hoặc có lỗi

---

## 🐛 NẾU VẪN LỖI

### **1. Kiểm tra logs trên server**
Nếu bạn deploy trên Vercel:
1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project `adr-liart`
3. Vào tab **Logs**
4. Xem logs khi truy cập `/api/contest/active`

Với code mới, bạn sẽ thấy logs như:
```
🔍 DEBUG - Active contests found: 1
📋 Contest: Kiến thức ADR { status: 'active', is_public: true, ... }
✅ Contest "Kiến thức ADR" hợp lệ
```

### **2. Kiểm tra environment variables**
Đảm bảo Vercel có đầy đủ env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### **3. Redeploy sau khi update code**
Nếu đã update API code, cần deploy lại:
```bash
git add .
git commit -m "fix: improve contest active API with debug logging"
git push
```

Vercel sẽ tự động deploy.

---

## 📊 CHECKLIST ĐẦY ĐỦ

Đánh dấu ✅ khi hoàn thành:

- [ ] **Database:**
  - [ ] Chạy script `fix-contest-complete.sql`
  - [ ] Có ít nhất 1 cuộc thi với `status = 'active'`
  - [ ] Cuộc thi có `is_public = true`
  - [ ] `start_date = NULL` hoặc < hiện tại
  - [ ] `end_date = NULL` hoặc > hiện tại
  - [ ] Có ít nhất 10 câu hỏi active trong `contest_questions`

- [ ] **RLS Policies:**
  - [ ] Policy `allow_public_read_contests` đã tạo
  - [ ] Policy cho `contest_participants` đã tạo
  - [ ] Policy cho `contest_submissions` đã tạo

- [ ] **API:**
  - [ ] `/api/contest/active` trả về cuộc thi (không null)
  - [ ] Code đã có debug logging
  - [ ] Đã redeploy lên Vercel

- [ ] **Frontend:**
  - [ ] Trang `/contest` hiển thị cuộc thi
  - [ ] Form đăng ký hoạt động
  - [ ] Có thể vào làm bài

---

## 🎯 CÁC VẤN ĐỀ THƯỜNG GẶP

| Triệu chứng | Nguyên nhân | Cách fix |
|-------------|-------------|----------|
| `"data": null` | Cuộc thi đã kết thúc | Set `end_date = NULL` |
| `"data": null` | RLS policy chặn | Chạy lại phần tạo policies |
| `"error": "..."` | Lỗi database/permissions | Kiểm tra Supabase logs |
| Alert: "Không có cuộc thi" | Frontend không load được | Check browser console |
| 404 Not Found | API route không tồn tại | Kiểm tra deployment |

---

## 💡 TIPS

1. **Luôn để `start_date` và `end_date` = NULL** cho cuộc thi không giới hạn thời gian
2. **Test trên Incognito** để tránh cache
3. **Xem Vercel logs** để debug API issues
4. **Dùng `/api/contest/test-status`** để kiểm tra nhanh

---

**Cập nhật:** 31/10/2025  
**Version:** 3.0

