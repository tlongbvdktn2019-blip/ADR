# 🔧 FIX LỖI DATABASE SAU KHI XÓA QR CODE

## ❌ VẤN ĐỀ

Sau khi xóa toàn bộ chức năng QR code, khi tạo thẻ mới xuất hiện lỗi:

```
null value in column "qr_code_data" of relation "allergy_cards" 
violates not-null constraint
```

## 🔍 NGUYÊN NHÂN

1. Code đã xóa logic tạo QR code
2. Nhưng database vẫn có constraint `NOT NULL` cho cột `qr_code_data`
3. Khi tạo thẻ mới, giá trị NULL vi phạm constraint

## ✅ GIẢI PHÁP

### Cách 1: Chạy Migration SQL (KHUYẾN NGHỊ)

**Bước 1:** Mở Supabase SQL Editor

**Bước 2:** Chạy file `supabase/fix-qr-columns-nullable.sql`

```sql
-- Xóa NOT NULL constraint
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_data DROP NOT NULL;

ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_url DROP NOT NULL;
```

**Bước 3:** Kiểm tra kết quả

```sql
SELECT 
    column_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'allergy_cards' 
  AND column_name IN ('qr_code_data', 'qr_code_url');
```

Kết quả mong đợi:
```
qr_code_data | YES
qr_code_url  | YES
```

### Cách 2: Xóa Cột (Tùy Chọn - CẨN THẬN!)

Nếu bạn chắc chắn **KHÔNG BAO GIỜ** cần QR code nữa:

```sql
-- ⚠️ CẢNH BÁO: Không thể rollback!
ALTER TABLE allergy_cards 
DROP COLUMN qr_code_data,
DROP COLUMN qr_code_url;
```

## 🧪 TEST SAU KHI FIX

1. **Thử tạo thẻ mới:**
   ```
   - Vào /allergy-cards/new
   - Nhập thông tin
   - Nhấn "Tạo thẻ"
   - ✅ Không còn lỗi
   ```

2. **Kiểm tra database:**
   ```sql
   SELECT card_code, qr_code_data, qr_code_url 
   FROM allergy_cards 
   ORDER BY created_at DESC 
   LIMIT 5;
   
   -- Các thẻ mới sẽ có qr_code_data = NULL, qr_code_url = NULL
   ```

## 📋 CHECKLIST

- [ ] Chạy migration SQL trong Supabase
- [ ] Kiểm tra constraint đã được xóa
- [ ] Test tạo thẻ mới
- [ ] Test update thẻ cũ
- [ ] Không còn lỗi NULL constraint

## 🔄 ROLLBACK (Nếu Cần)

Nếu muốn bật lại NOT NULL constraint:

```sql
-- Set giá trị default trước
UPDATE allergy_cards 
SET qr_code_data = '{}'::jsonb 
WHERE qr_code_data IS NULL;

UPDATE allergy_cards 
SET qr_code_url = '' 
WHERE qr_code_url IS NULL;

-- Sau đó thêm lại constraint
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_data SET NOT NULL;

ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_url SET NOT NULL;
```

---

**⚡ QUICK FIX:**

```sql
-- Copy và chạy trong Supabase SQL Editor:
ALTER TABLE allergy_cards 
ALTER COLUMN qr_code_data DROP NOT NULL,
ALTER COLUMN qr_code_url DROP NOT NULL;
```

Sau đó thử tạo thẻ lại!


