-- =====================================================
-- XEM CẤU TRÚC CHI TIẾT CỦA ALLERGY CARDS
-- =====================================================

-- 1. Xem tất cả các cột trong allergy_cards
SELECT 
  '=== ALLERGY_CARDS COLUMNS ===' as info;

SELECT 
  ordinal_position as "#",
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'allergy_cards'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Xem số lượng dữ liệu hiện có
SELECT 
  '' as separator,
  '=== DỮ LIỆU HIỆN TẠI ===' as info;

SELECT 
  'Tổng số thẻ dị ứng' as metric,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive
FROM allergy_cards;

SELECT 
  'Tổng số allergies' as metric,
  COUNT(*) as count
FROM card_allergies;

-- 3. Xem view definition
SELECT 
  '' as separator,
  '=== VIEW DEFINITION ===' as info;

SELECT 
  table_name,
  'exists' as status
FROM information_schema.views
WHERE table_name = 'allergy_cards_with_details'
  AND table_schema = 'public';

-- 4. Test view (nếu có dữ liệu)
SELECT 
  '' as separator,
  '=== TEST VIEW ===' as info;

SELECT 
  COUNT(*) as records_in_view
FROM allergy_cards_with_details;


