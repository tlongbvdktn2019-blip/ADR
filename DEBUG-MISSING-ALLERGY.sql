-- =====================================================
-- DEBUG: Tìm dị ứng bị thiếu trong Thông tin dị ứng
-- =====================================================

-- 1. Đếm tổng số dị ứng trong card_allergies
SELECT 
  'Total in card_allergies' as info,
  COUNT(*) as total_allergies
FROM card_allergies
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021');

-- 2. Liệt kê TẤT CẢ dị ứng trong card_allergies
SELECT 
  'All card allergies' as info,
  id,
  allergen_name,
  certainty_level,
  severity_level,
  clinical_manifestation,
  created_at
FROM card_allergies
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
ORDER BY created_at ASC;

-- 3. So sánh với update_allergies
SELECT 
  'Compare sources' as info,
  'card_allergies' as source,
  COUNT(*) as count
FROM card_allergies
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')

UNION ALL

SELECT 
  'Compare sources' as info,
  'update_allergies' as source,
  COUNT(DISTINCT ua.allergen_name) as count
FROM update_allergies ua
JOIN allergy_card_updates acu ON ua.update_id = acu.id
WHERE acu.card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021');

-- 4. Tìm dị ứng có trong update_allergies nhưng CHƯA có trong card_allergies
SELECT 
  'Missing in card_allergies' as info,
  ua.allergen_name,
  ua.severity_level,
  ua.created_at,
  acu.updated_by_name as added_by
FROM update_allergies ua
JOIN allergy_card_updates acu ON ua.update_id = acu.id
WHERE acu.card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
  AND NOT EXISTS (
    SELECT 1 
    FROM card_allergies ca 
    WHERE ca.card_id = acu.card_id 
      AND LOWER(TRIM(ca.allergen_name)) = LOWER(TRIM(ua.allergen_name))
  )
ORDER BY ua.created_at;

-- 5. Kiểm tra duplicate trong card_allergies
SELECT 
  'Check duplicates' as info,
  allergen_name,
  COUNT(*) as count
FROM card_allergies
WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
GROUP BY allergen_name
HAVING COUNT(*) > 1;

-- 6. Liệt kê tất cả allergies từ cả 2 nguồn (merged)
WITH all_allergies AS (
  -- Từ card_allergies
  SELECT DISTINCT
    LOWER(TRIM(allergen_name)) as allergen_key,
    allergen_name,
    'card_allergies' as source,
    created_at
  FROM card_allergies
  WHERE card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
  
  UNION
  
  -- Từ update_allergies
  SELECT DISTINCT
    LOWER(TRIM(ua.allergen_name)) as allergen_key,
    ua.allergen_name,
    'update_allergies' as source,
    ua.created_at
  FROM update_allergies ua
  JOIN allergy_card_updates acu ON ua.update_id = acu.id
  WHERE acu.card_id = (SELECT id FROM allergy_cards WHERE card_code = 'AC-2025-000021')
)
SELECT 
  'All unique allergies' as info,
  allergen_key,
  string_agg(DISTINCT source, ', ') as sources,
  MIN(created_at) as first_added
FROM all_allergies
GROUP BY allergen_key
ORDER BY first_added;

-- =====================================================
-- KẾT QUẢ MONG ĐỢI:
-- =====================================================
-- Query 1: Phải = 8 (hoặc 7 nếu thiếu)
-- Query 4: Nếu có kết quả → dị ứng này bị thiếu
-- Query 6: Phải thấy 8 dị ứng unique
-- =====================================================

SELECT '✅ Script completed! Check results above.' as status;

