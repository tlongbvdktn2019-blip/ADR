-- =====================================================
-- XEM CẤU TRÚC BẢNG ALLERGY_CARDS
-- =====================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'allergy_cards'
  AND table_schema = 'public'
ORDER BY ordinal_position;


