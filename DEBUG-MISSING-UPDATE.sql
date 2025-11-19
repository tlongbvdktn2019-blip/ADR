-- =====================================================
-- DEBUG: Tìm update bị thiếu
-- =====================================================

-- 1. Liệt kê TẤT CẢ 5 updates từ bảng gốc
SELECT 
  'All 5 updates in database' as info,
  id,
  card_id,
  update_type,
  updated_by_name,
  updated_by_organization,
  updated_by_role,
  updated_by_phone,
  facility_name,
  facility_department,
  reason_for_update,
  update_notes,
  is_verified,
  created_at,
  updated_at
FROM allergy_card_updates
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
ORDER BY created_at DESC;

-- 2. Kiểm tra xem có update nào có NULL trong các fields quan trọng không
SELECT 
  'Check for NULL values' as info,
  id,
  updated_by_name,
  CASE 
    WHEN updated_by_name IS NULL THEN '❌ NULL name'
    WHEN updated_by_organization IS NULL THEN '⚠️ NULL org'
    WHEN facility_name IS NULL THEN '⚠️ NULL facility'
    ELSE '✅ OK'
  END as status,
  created_at
FROM allergy_card_updates
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
ORDER BY created_at DESC;

-- 3. Kiểm tra allergies được join
SELECT 
  'Check allergies join' as info,
  acu.id as update_id,
  acu.updated_by_name,
  acu.created_at,
  COUNT(ua.id) as allergies_count,
  jsonb_agg(ua.allergen_name) FILTER (WHERE ua.id IS NOT NULL) as allergen_names
FROM allergy_card_updates acu
LEFT JOIN update_allergies ua ON acu.id = ua.update_id
WHERE acu.card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
GROUP BY acu.id, acu.updated_by_name, acu.created_at
ORDER BY acu.created_at DESC;

-- 4. Test query giống như API (nested select)
SELECT 
  'API-style query' as info,
  COUNT(*) as total_updates
FROM allergy_card_updates
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021');

-- 5. Kiểm tra RLS policies có block không
SET ROLE anon;  -- Giả lập public access

SELECT 
  'As anon role' as info,
  COUNT(*) as visible_updates
FROM allergy_card_updates
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021');

RESET ROLE;  -- Reset về admin

-- =====================================================
-- KẾT QUẢ MONG ĐỢI:
-- =====================================================
-- Query 1-4: Phải thấy 5 updates
-- Query 5: Nếu < 5 → RLS policies đang block
-- =====================================================

