# ⚡ QUICK FIX: Không hiển thị lịch sử bổ sung khi quét QR

## 🎯 Vấn đề
Quét QR code thẻ dị ứng → Phần "Lịch sử bổ sung" không hiển thị

## 🚀 Fix nhanh 3 bước (5 phút)

### 1. Vào Supabase SQL Editor
```
https://app.supabase.com → Your Project → SQL Editor
```

### 2. Copy & Paste & Run
```sql
-- SCRIPT FIX NHANH
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

-- Grant permissions
GRANT SELECT ON allergy_card_updates_with_details TO anon;
GRANT SELECT ON allergy_card_updates_with_details TO authenticated;

-- Enable RLS
ALTER TABLE allergy_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE allergy_card_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_allergies ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public can view allergy cards" ON allergy_cards;
CREATE POLICY "Public can view allergy cards" ON allergy_cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view card allergies" ON card_allergies;
CREATE POLICY "Public can view card allergies" ON card_allergies FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view allergy card updates" ON allergy_card_updates;
CREATE POLICY "Public can view allergy card updates" ON allergy_card_updates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view update allergies" ON update_allergies;
CREATE POLICY "Public can view update allergies" ON update_allergies FOR SELECT USING (true);

-- Verify
SELECT '✅ DONE!' as status;
```

### 3. Clear Cache & Test
- Xóa cache điện thoại
- Quét lại QR code
- ✅ Lịch sử bổ sung đã hiển thị!

---

## 🔍 Kiểm tra trước khi fix

Chạy trong SQL Editor:
```sql
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'allergy_card_updates_with_details';
```

❌ Nếu không có `anon` → Cần fix  
✅ Nếu có `anon | SELECT` → OK

---

## 🧪 Test API

### Browser Console (F12):
```javascript
fetch('/api/allergy-cards/public/AC-2025-123456')
  .then(r => r.json())
  .then(d => console.log('Updates:', d.updates))
```

### Node.js:
```bash
node scripts/test-public-api.js AC-2025-123456
```

---

## 📚 Đọc thêm

- Chi tiết: `docs/FIX-HIEN-THI-LICH-SU-BO-SUNG.md`
- Script đầy đủ: `supabase/FIX-PUBLIC-ACCESS-VIEW.sql`
- Quick check: `supabase/QUICK-CHECK-PUBLIC-ACCESS.sql`
- Summary: `FIX-HIEN-THI-BO-SUNG-SUMMARY.md`

---

## ✅ Checklist

- [ ] Run SQL script fix
- [ ] Verify: `anon` có SELECT permission
- [ ] Clear browser cache
- [ ] Quét QR code
- [ ] Check "Lịch sử bổ sung" hiển thị
- [ ] Test API response có field `updates`

---

**Fix time:** ~5 phút  
**Ngày:** 2025-11-18

