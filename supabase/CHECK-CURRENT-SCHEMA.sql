-- =====================================================
-- KIỂM TRA CẤU TRÚC HIỆN TẠI CỦA BẢNG ALLERGY_CARDS
-- =====================================================

-- 1. Kiểm tra tất cả các cột trong bảng allergy_cards
SELECT 
  '=== ALLERGY_CARDS COLUMNS ===' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'allergy_cards'
ORDER BY ordinal_position;

-- 2. Kiểm tra tất cả các cột trong bảng card_allergies  
SELECT 
  '=== CARD_ALLERGIES COLUMNS ===' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'card_allergies'
ORDER BY ordinal_position;

-- 3. Kiểm tra tất cả các cột trong bảng users
SELECT 
  '=== USERS COLUMNS ===' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 4. Kiểm tra xem có view nào đang tồn tại
SELECT 
  '=== EXISTING VIEWS ===' as info,
  table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE '%allergy%';

-- 5. Nếu view tồn tại, xem định nghĩa của nó
SELECT 
  '=== VIEW DEFINITION ===' as info,
  view_definition
FROM information_schema.views
WHERE table_name = 'allergy_cards_with_details'
AND table_schema = 'public';


