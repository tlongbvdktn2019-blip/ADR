# 🔧 DEBUG LỖI QUÉT QR - "Thẻ không tồn tại trong hệ thống"

## 🎯 Vấn Đề

Khi quét QR thẻ dị ứng, xuất hiện lỗi: **"Thẻ không tồn tại trong hệ thống"**

## 🔍 Nguyên Nhân

Lỗi này xảy ra khi:
1. ❌ Thẻ dị ứng chưa được tạo trong database
2. ❌ Mã QR không đúng format (phải là `AC-YYYY-XXXXXX`)
3. ❌ Thẻ đã bị xóa hoặc inactive
4. ❌ Database chưa có dữ liệu thẻ dị ứng

## ✅ Giải Pháp

### Bước 1: Kiểm Tra Thẻ Trong Database

**Cách 1: Qua Giao Diện Web**
```
1. Mở trình duyệt
2. Đăng nhập hệ thống
3. Vào "Thẻ Dị Ứng" → Xem danh sách
4. Kiểm tra có thẻ nào không?
```

**Cách 2: Qua SQL (Supabase/Database)**
```sql
-- Kiểm tra thẻ trong database
SELECT 
  card_code,
  patient_name,
  status,
  issued_date,
  expiry_date
FROM allergy_cards
ORDER BY created_at DESC
LIMIT 10;
```

### Bước 2: Tạo Thẻ Test (Nếu Chưa Có)

**Qua Giao Diện:**
1. Đăng nhập hệ thống
2. Vào **"Thẻ Dị Ứng"** → **"Tạo thẻ mới"**
3. Nhập thông tin:
   - Tên bệnh nhân
   - Tuổi, giới tính
   - Bệnh viện
   - Bác sĩ điều trị
   - Thêm ít nhất 1 dị ứng
4. Nhấn **"Tạo thẻ"**

**Qua SQL:**
```sql
-- Chạy script tạo thẻ test
\i scripts/create-test-card.sql

-- Hoặc copy/paste SQL này:
INSERT INTO allergy_cards (
  card_code,
  patient_name,
  patient_age,
  patient_gender,
  hospital_name,
  doctor_name,
  doctor_phone,
  allergies,
  status,
  issued_date,
  expiry_date
) VALUES (
  'AC-2024-000001',
  'Nguyễn Văn Test',
  35,
  'male',
  'Bệnh viện Test',
  'BS. Test',
  '0901234567',
  '[
    {
      "name": "Penicillin",
      "certainty": "confirmed",
      "severity": "severe",
      "symptoms": "Phát ban, ngứa, khó thở"
    }
  ]'::jsonb,
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year'
);
```

### Bước 3: Kiểm Tra Format Mã QR

Mã QR phải có format: **`AC-YYYY-XXXXXX`**

✅ Đúng format:
- `AC-2024-000001`
- `AC-2024-123456`
- `AC-2025-999999`

❌ Sai format:
- `AC2024000001` (thiếu dấu gạch ngang)
- `ac-2024-000001` (chữ thường)
- `AC-24-001` (không đủ số)

### Bước 4: Kiểm Tra Status Thẻ

Thẻ phải có `status = 'active'`:

```sql
-- Kiểm tra và cập nhật status
UPDATE allergy_cards 
SET status = 'active' 
WHERE card_code = 'AC-2024-000001';
```

### Bước 5: Test Quét QR Lại

**Test bằng URL trực tiếp:**
```
http://localhost:3000/allergy-cards/view/AC-2024-000001
```

**Test bằng API:**
```bash
# GET verify
curl http://localhost:3000/api/allergy-cards/verify/AC-2024-000001

# Kết quả mong đợi:
{
  "success": true,
  "cardFound": true,
  "data": {
    "cardCode": "AC-2024-000001",
    "patientName": "Nguyễn Văn Test",
    ...
  }
}
```

**Test bằng giao diện:**
1. Vào **Thẻ Dị Ứng** → **Quét QR**
2. Quét QR hoặc tải ảnh QR lên
3. Xem kết quả

## 🧪 Test Cases

### Test 1: Kiểm Tra Thẻ Tồn Tại
```sql
SELECT COUNT(*) as total_cards 
FROM allergy_cards;

-- Nếu total_cards = 0 → Cần tạo thẻ mới
```

### Test 2: Kiểm Tra Thẻ Active
```sql
SELECT COUNT(*) as active_cards 
FROM allergy_cards 
WHERE status = 'active';

-- Nếu active_cards = 0 → Kích hoạt thẻ
```

### Test 3: Kiểm Tra QR Format
```javascript
const cardCode = 'AC-2024-000001';
const regex = /^AC-\d{4}-\d{6}$/;

if (regex.test(cardCode)) {
  console.log('✅ Format đúng');
} else {
  console.log('❌ Format sai');
}
```

### Test 4: Kiểm Tra API Verify
```bash
# Terminal test
curl -X GET http://localhost:3000/api/allergy-cards/verify/AC-2024-000001 | jq
```

## 🐛 Debug Chi Tiết

### Bật Console Log

**1. Mở DevTools (F12)**
- Chrome: F12 → Console tab
- Safari: Cmd+Opt+C → Console
- Firefox: F12 → Console

**2. Xem Lỗi Chi Tiết**
```
Khi quét QR, kiểm tra:
- Network tab → Tìm request /api/allergy-cards/verify/
- Xem Response → Đọc error message
- Console → Xem log errors
```

**3. Kiểm Tra Request/Response**
```javascript
// Trong Console, chạy:
fetch('/api/allergy-cards/verify/AC-2024-000001')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Kiểm Tra Database Connection

**1. Kiểm Tra Supabase**
```javascript
// Test trong Console
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test query
const { data, error } = await supabase
  .from('allergy_cards')
  .select('*')
  .limit(1);

console.log({ data, error });
```

**2. Kiểm Tra View `allergy_cards_with_details`**
```sql
-- Kiểm tra view có tồn tại không
SELECT * FROM allergy_cards_with_details LIMIT 1;

-- Nếu lỗi → Tạo lại view
CREATE OR REPLACE VIEW allergy_cards_with_details AS
SELECT 
  ac.*,
  u.full_name as created_by_name
FROM allergy_cards ac
LEFT JOIN users u ON ac.created_by = u.id;
```

## 📋 Checklist Khắc Phục

- [ ] 1. Database có kết nối không?
- [ ] 2. Table `allergy_cards` có tồn tại không?
- [ ] 3. Table có dữ liệu không? (SELECT COUNT(*))
- [ ] 4. View `allergy_cards_with_details` có tồn tại không?
- [ ] 5. Thẻ có status = 'active' không?
- [ ] 6. Mã QR đúng format AC-YYYY-XXXXXX không?
- [ ] 7. API endpoint `/api/allergy-cards/verify/[code]` hoạt động không?
- [ ] 8. Server đang chạy không? (npm run dev)
- [ ] 9. Có lỗi CORS/Authentication không?
- [ ] 10. Middleware có chặn request không?

## 🚀 Quick Fix

**Tạo thẻ test nhanh:**
```bash
# 1. Vào Supabase SQL Editor
# 2. Copy/paste:

INSERT INTO allergy_cards (
  card_code, patient_name, patient_age, patient_gender,
  hospital_name, doctor_name, doctor_phone,
  allergies, status, issued_date, expiry_date
) VALUES (
  'AC-2024-000001', 'Test Patient', 30, 'male',
  'Test Hospital', 'Dr. Test', '0901234567',
  '[{"name":"Penicillin","certainty":"confirmed","severity":"severe","symptoms":"Rash"}]'::jsonb,
  'active', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year'
) RETURNING card_code;

# 3. Test với mã: AC-2024-000001
```

**Test QR ngay:**
```
URL: http://localhost:3000/allergy-cards/view/AC-2024-000001
```

## 📞 Hỗ Trợ Thêm

Nếu vẫn lỗi, kiểm tra:

1. **Logs Server**
   ```bash
   npm run dev
   # Xem terminal có lỗi gì không?
   ```

2. **Supabase Dashboard**
   - Table Editor → allergy_cards
   - Có dữ liệu không?

3. **Browser DevTools**
   - F12 → Network → Tìm failed requests
   - Console → Xem error messages

4. **File Route Handler**
   - `app/api/allergy-cards/verify/[code]/route.ts`
   - Kiểm tra logic verify

---

💡 **Mẹo**: Luôn tạo ít nhất 1 thẻ test để debug! Sử dụng mã: `AC-2024-000001`
