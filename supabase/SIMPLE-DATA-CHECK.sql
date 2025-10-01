-- =====================================================
-- KIỂM TRA DỮ LIỆU ĐơN GIẢN
-- =====================================================

-- 1. Đếm số lượng records
SELECT 
  '📊 Tổng số thẻ dị ứng' as metric,
  COUNT(*) as count
FROM allergy_cards
UNION ALL
SELECT 
  '📊 Tổng số allergies',
  COUNT(*)
FROM card_allergies
UNION ALL
SELECT 
  '📊 Tổng số users',
  COUNT(*)
FROM users;

-- 2. Xem thẻ mới nhất (nếu có)
SELECT 
  '🔍 Thẻ dị ứng mới nhất:' as info,
  id,
  patient_name,
  patient_id_number,
  status,
  created_at
FROM allergy_cards
ORDER BY created_at DESC
LIMIT 3;

-- 3. Kiểm tra view
SELECT 
  '✅ Test View:' as info,
  COUNT(*) as total_in_view
FROM allergy_cards_with_details;
