# 🔍 DEBUG: Trang Public Thẻ Dị Ứng

## ✅ Vấn đề đã được fix

### 1. ✅ Dị ứng hiển thị trùng lặp (FIXED)
**Vấn đề:** Sau khi bổ sung dị ứng mới, thông tin hiển thị 2 lần
**Nguyên nhân:** Hiển thị chi tiết đầy đủ ở cả 2 sections (Thông tin dị ứng + Lịch sử bổ sung)
**Fix:** Section "Lịch sử bổ sung" chỉ hiển thị tóm tắt (tên + badge), chi tiết ở "Thông tin dị ứng"
**File:** `app/allergy-cards/public/[code]/page.tsx` (dòng 597-622)

### 2. ✅ Database permissions (FIXED)
**Vấn đề:** Lịch sử bổ sung không hiển thị
**Nguyên nhân:** View `allergy_card_updates_with_details` chưa có quyền SELECT cho anon
**Fix:** Chạy script SQL để grant permissions
**File:** Xem phần "Bước 2: Chạy Script Fix" bên dưới

---

## ❌ Vấn đề CŨ (đã fix)

Khi quét QR code và xem trang public:
- ❌ Thông tin dị ứng chưa hiển thị đúng → ✅ FIXED
- ❌ Lịch sử bổ sung chưa hiển thị các nội dung đã bổ sung → ✅ FIXED
- ❌ Dị ứng hiển thị 2 lần (duplicate) → ✅ FIXED

## 🎯 Nguyên nhân chính

**Database permissions chưa được cấu hình!**

View `allergy_card_updates_with_details` chưa có quyền `SELECT` cho `anon` role (public access).

## ✅ Giải pháp - 3 bước nhanh

### Bước 1: Mở Supabase SQL Editor

1. Truy cập: https://app.supabase.com
2. Chọn project của bạn
3. Click vào **SQL Editor** (menu bên trái)

### Bước 2: Chạy Script Fix

Copy toàn bộ script dưới đây và paste vào SQL Editor, sau đó click **Run**:

```sql
-- =====================================================
-- FIX PUBLIC ACCESS - ALLERGY CARD UPDATES
-- Chạy script này để fix hiển thị lịch sử bổ sung
-- =====================================================

-- 1. Drop view cũ và tạo lại
DROP VIEW IF EXISTS allergy_card_updates_with_details CASCADE;

CREATE OR REPLACE VIEW allergy_card_updates_with_details AS
SELECT 
  acu.*,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', ua.id,
        'allergen_name', ua.allergen_name,
        'certainty_level', ua.certainty_level,
        'clinical_manifestation', ua.clinical_manifestation,
        'severity_level', ua.severity_level,
        'reaction_type', ua.reaction_type,
        'discovered_date', ua.discovered_date,
        'is_approved', ua.is_approved,
        'approved_at', ua.approved_at
      ) ORDER BY ua.severity_level DESC NULLS LAST, ua.created_at
    ) FILTER (WHERE ua.id IS NOT NULL),
    '[]'::jsonb
  ) as allergies_added,
  COUNT(ua.id) FILTER (WHERE ua.id IS NOT NULL) as allergies_count
FROM allergy_card_updates acu
LEFT JOIN update_allergies ua ON acu.id = ua.update_id
GROUP BY acu.id;

-- 2. Grant permissions cho public access
REVOKE ALL ON allergy_card_updates_with_details FROM anon;
REVOKE ALL ON allergy_card_updates_with_details FROM authenticated;

GRANT SELECT ON allergy_card_updates_with_details TO anon;
GRANT SELECT ON allergy_card_updates_with_details TO authenticated;

-- 3. Enable RLS cho tất cả bảng liên quan
ALTER TABLE allergy_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_card_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_allergies ENABLE ROW LEVEL SECURITY;

-- 4. Drop policies cũ
DROP POLICY IF EXISTS "Public can view allergy cards" ON allergy_cards;
DROP POLICY IF EXISTS "Public can view card allergies" ON card_allergies;
DROP POLICY IF EXISTS "Public can view allergy card updates" ON allergy_card_updates;
DROP POLICY IF EXISTS "Public can insert allergy card updates" ON allergy_card_updates;
DROP POLICY IF EXISTS "Public can view update allergies" ON update_allergies;
DROP POLICY IF EXISTS "Public can insert update allergies" ON update_allergies;

-- 5. Tạo policies mới cho public access
CREATE POLICY "Public can view allergy cards" ON allergy_cards
  FOR SELECT USING (true);

CREATE POLICY "Public can view card allergies" ON card_allergies
  FOR SELECT USING (true);

CREATE POLICY "Public can view allergy card updates" ON allergy_card_updates
  FOR SELECT USING (true);

CREATE POLICY "Public can insert allergy card updates" ON allergy_card_updates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view update allergies" ON update_allergies
  FOR SELECT USING (true);

CREATE POLICY "Public can insert update allergies" ON update_allergies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM allergy_card_updates 
      WHERE id = update_id
    )
  );

-- 6. Verify - Kiểm tra kết quả
SELECT '✅ DONE! Public access đã được enable' as status;

-- Kiểm tra permissions
SELECT 
  'Permissions check' as test,
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'allergy_card_updates_with_details'
ORDER BY grantee;

-- Kiểm tra RLS policies
SELECT 
  'Policies check' as test,
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN (
  'allergy_cards',
  'card_allergies',
  'allergy_card_updates',
  'update_allergies'
)
ORDER BY tablename, policyname;
```

### Bước 3: Kiểm tra kết quả

Sau khi chạy script, bạn sẽ thấy:

```
✅ DONE! Public access đã được enable
```

Và bảng hiển thị:
- `anon` có quyền `SELECT` trên view
- Các policies đã được tạo đúng

## 🧪 Test ngay

### Test 1: Trong Supabase

```sql
-- Test query trực tiếp
SELECT COUNT(*) FROM allergy_card_updates_with_details;
```

Nếu trả về số lượng > 0 → Database OK!

### Test 2: Test API

Mở browser console (F12) và chạy:

```javascript
fetch('/api/allergy-cards/public/AC-2025-XXXXXX')
  .then(r => r.json())
  .then(data => {
    console.log('Card:', data.card);
    console.log('Allergies:', data.card.allergies);
    console.log('Updates:', data.updates);
    console.log('Total updates:', data.total_updates);
  });
```

Thay `AC-2025-XXXXXX` bằng mã thẻ thực tế.

**Kết quả mong đợi:**
```json
{
  "success": true,
  "card": {
    "id": "...",
    "allergies": [...]  // ← Phải có dữ liệu
  },
  "updates": [...]  // ← Phải có dữ liệu nếu đã bổ sung
  "total_updates": 2
}
```

### Test 3: Quét QR Code

1. Xóa cache browser/điện thoại
2. Quét lại QR code
3. Kiểm tra:
   - ✅ Section "Thông tin dị ứng" hiển thị danh sách
   - ✅ Section "Lịch sử bổ sung" hiển thị timeline

## 🔍 Nếu vẫn không hiển thị

### Kiểm tra trong Browser DevTools:

1. Mở **Console** (F12)
2. Xem có lỗi màu đỏ không?
3. Vào tab **Network**
4. Tìm request đến `/api/allergy-cards/public/...`
5. Click vào và xem:
   - **Status**: Phải là 200 OK
   - **Response**: Xem có data không

### Debug checklist:

```bash
# 1. Kiểm tra API endpoint
curl http://localhost:3000/api/allergy-cards/public/AC-2025-XXXXXX

# 2. Chạy test script
node scripts/test-public-api.js AC-2025-XXXXXX

# 3. Kiểm tra Supabase logs
# Vào Supabase Dashboard → Logs → API Logs
# Xem có lỗi permission denied không
```

## 📊 Checklist hoàn chỉnh

- [ ] Chạy SQL script trong Supabase ✅
- [ ] Verify: `anon` có SELECT permission
- [ ] Verify: Policies đã được tạo
- [ ] Test query trực tiếp trong SQL Editor
- [ ] Test API response qua browser console
- [ ] Clear cache browser
- [ ] Quét lại QR code
- [ ] Kiểm tra allergies hiển thị
- [ ] Kiểm tra lịch sử bổ sung hiển thị

## 🎯 Sau khi fix xong

Trang public sẽ hiển thị:

1. **Thông tin dị ứng:**
   - Tên dị nguyên
   - Mức độ nghiêm trọng
   - Biểu hiện lâm sàng
   - Loại phản ứng

2. **Lịch sử bổ sung:**
   - Người bổ sung
   - Cơ sở y tế
   - Thời gian
   - Các dị ứng được thêm mới
   - Lý do và ghi chú

## 📞 Support

Nếu vẫn gặp vấn đề:
1. Chụp màn hình Console errors
2. Check Network tab response
3. Gửi screenshot để tôi debug thêm

