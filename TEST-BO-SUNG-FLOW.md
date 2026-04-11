# 🧪 TEST: Quy trình bổ sung thông tin dị ứng

## 🎯 Mục tiêu test

Đảm bảo sau khi bổ sung thông tin mới:
1. ✅ **Lịch sử bổ sung** hiển thị update mới
2. ✅ **Thông tin dị ứng** hiển thị dị ứng mới
3. ✅ Cả trang public và nội bộ đều đồng bộ

---

## 📋 Test Case: Bổ sung 1 dị ứng mới

### **Bước 1: Ghi nhận trạng thái hiện tại**

**Trang public hiện tại:**
- Thông tin dị ứng: 8 items
- Lịch sử bổ sung: 5 updates

**Ghi chú số lượng:**
```
Before: 8 allergies, 5 updates
```

---

### **Bước 2: Thực hiện bổ sung mới**

1. **Quét QR code** hoặc truy cập:
   ```
   https://adr-liart.vercel.app/allergy-cards/public/AC-2025-000021
   ```

2. Click nút **"Bổ sung mới"**

3. **Điền form:**
   - Loại cập nhật: **Phát hiện dị ứng mới**
   - Họ tên người bổ sung: `Nguyễn Văn Test`
   - Tổ chức: `Bệnh viện Test`
   - Vai trò: `Dược sĩ`
   - Cơ sở y tế: `Bệnh viện Test`
   - Lý do: `Phát hiện phản ứng dị ứng khi điều trị`
   
   **Thêm dị ứng:**
   - Tên dị ứng: `Aspirin 100mg`
   - Mức độ chắc chắn: **Chắc chắn**
   - Mức độ nghiêm trọng: **Nghiêm trọng**
   - Biểu hiện lâm sàng: `Phát ban, ngứa`

4. Click **"Xác nhận bổ sung"**

---

### **Bước 3: Kiểm tra kết quả ngay lập tức**

**Sau khi submit thành công:**

1. **Tự động redirect** về trang chi tiết thẻ
2. **Reload trang** (hoặc quét lại QR)

**Kiểm tra:**

#### A. Lịch sử bổ sung
```
Lịch sử bổ sung (6)  ← Tăng từ 5 lên 6

[MỚI] Phát hiện dị ứng mới
Nguyễn Văn Test • Dược sĩ • Bệnh viện Test
🔴 Đã bổ sung 1 dị ứng: Aspirin 100mg
```

#### B. Thông tin dị ứng
```
Thông tin dị ứng (9)  ← Tăng từ 8 lên 9

[MỚI] Aspirin 100mg
• Chắc chắn
• Nghiêm trọng
• Biểu hiện: Phát ban, ngứa
```

---

### **Bước 4: Kiểm tra trên trang nội bộ**

1. **Đăng nhập** hệ thống
2. **Truy cập trang nội bộ** cùng thẻ:
   ```
   https://adr-liart.vercel.app/allergy-cards/[id]
   ```

**Kiểm tra:**
- ✅ Lịch sử bổ sung: **6 updates** (giống public)
- ✅ Thông tin dị ứng: **9 allergies** (giống public)

---

### **Bước 5: Kiểm tra Database**

**Chạy SQL trong Supabase:**

```sql
-- 1. Kiểm tra update mới nhất
SELECT 
  'Latest update' as info,
  id,
  updated_by_name,
  updated_by_organization,
  update_type,
  created_at
FROM allergy_card_updates
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
ORDER BY created_at DESC
LIMIT 1;

-- 2. Kiểm tra dị ứng mới nhất trong update_allergies
SELECT 
  'Update allergies' as info,
  ua.allergen_name,
  ua.severity_level,
  ua.created_at,
  acu.updated_by_name
FROM update_allergies ua
JOIN allergy_card_updates acu ON ua.update_id = acu.id
WHERE acu.card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
ORDER BY ua.created_at DESC
LIMIT 1;

-- 3. Kiểm tra dị ứng mới nhất trong card_allergies
SELECT 
  'Card allergies' as info,
  allergen_name,
  severity_level,
  created_at
FROM card_allergies
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
ORDER BY created_at DESC
LIMIT 1;

-- 4. So sánh tổng số
SELECT 
  'Total counts' as info,
  (SELECT COUNT(*) FROM allergy_card_updates 
   WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')) as total_updates,
  (SELECT COUNT(*) FROM card_allergies 
   WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')) as total_allergies;
```

**Kết quả mong đợi:**
- Query 1: Thấy `Nguyễn Văn Test`
- Query 2: Thấy `Aspirin 100mg` trong `update_allergies`
- Query 3: Thấy `Aspirin 100mg` trong `card_allergies`
- Query 4: `total_updates = 6, total_allergies = 9`

---

## ✅ Test Pass Criteria

### **PASS nếu:**
- ✅ Lịch sử bổ sung: 5 → 6
- ✅ Thông tin dị ứng: 8 → 9
- ✅ Update mới hiển thị đầy đủ thông tin
- ✅ Dị ứng mới hiển thị với đúng severity, certainty
- ✅ Trang public = Trang nội bộ
- ✅ Database: có record trong cả 3 bảng

### **FAIL nếu:**
- ❌ Lịch sử bổ sung không tăng
- ❌ Thông tin dị ứng không có dị ứng mới
- ❌ Dị ứng mới chỉ có trong 1 trong 2 (update_allergies hoặc card_allergies)
- ❌ Public và nội bộ khác nhau

---

## 🐛 Nếu có vấn đề

### Vấn đề 1: Lịch sử bổ sung có, nhưng Thông tin dị ứng không có

**Nguyên nhân:** Logic insert vào `card_allergies` bị lỗi

**Kiểm tra:**
```sql
-- Xem update_allergies có không
SELECT * FROM update_allergies 
WHERE update_id = (SELECT id FROM allergy_card_updates ORDER BY created_at DESC LIMIT 1);

-- Xem card_allergies có không
SELECT * FROM card_allergies
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
  AND allergen_name = 'Aspirin 100mg';
```

**Fix:** Kiểm tra file `app/api/allergy-cards/[id]/updates/route.ts` - phần insert vào `card_allergies`

---

### Vấn đề 2: Cả 2 đều không có

**Nguyên nhân:** API bổ sung bị lỗi

**Kiểm tra:**
- Xem network tab (F12) có lỗi không
- Xem Vercel logs có error không
- Test API trực tiếp bằng Postman/curl

---

### Vấn đề 3: Duplicate - dị ứng bị thêm 2 lần

**Nguyên nhân:** Logic check duplicate không hoạt động

**Kiểm tra:**
```sql
-- Tìm duplicates
SELECT allergen_name, COUNT(*) as count
FROM card_allergies
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
GROUP BY allergen_name
HAVING COUNT(*) > 1;
```

**Fix:** Kiểm tra logic check duplicate trong API

---

## 📝 Ghi nhận kết quả

**Ngày test:** _______
**Người test:** _______

**Kết quả:**
- [ ] PASS - Tất cả đều OK
- [ ] FAIL - Ghi rõ vấn đề:

**Số lượng sau test:**
- Lịch sử bổ sung: _____ (mong đợi: 6)
- Thông tin dị ứng: _____ (mong đợi: 9)

**Screenshots:**
- [ ] Lịch sử bổ sung (hiển thị update mới)
- [ ] Thông tin dị ứng (hiển thị Aspirin 100mg)

---

## 🔄 Test lặp lại

**Sau khi test xong, để cleanup:**

```sql
-- Xóa test data (nếu cần)
-- CẢNH BÁO: Chỉ xóa record test, không xóa data thật!

DELETE FROM update_allergies
WHERE update_id IN (
  SELECT id FROM allergy_card_updates
  WHERE updated_by_name = 'Nguyễn Văn Test'
);

DELETE FROM card_allergies
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
  AND allergen_name = 'Aspirin 100mg';

DELETE FROM allergy_card_updates
WHERE updated_by_name = 'Nguyễn Văn Test';
```

Sau đó có thể test lại từ đầu.

---

**✅ Test completed successfully!**


