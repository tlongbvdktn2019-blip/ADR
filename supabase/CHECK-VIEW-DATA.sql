-- =====================================================
-- KIỂM TRA DỮ LIỆU TRONG CÁC BẢNG
-- Để debug tại sao view trả về 0 records
-- =====================================================

-- 1. Kiểm tra số lượng records trong allergy_cards
SELECT 
  'Bảng allergy_cards' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_records,
  COUNT(CASE WHEN status != 'active' THEN 1 END) as inactive_records
FROM allergy_cards;

-- 2. Kiểm tra số lượng records trong card_allergies
SELECT 
  'Bảng card_allergies' as table_name,
  COUNT(*) as total_records
FROM card_allergies;

-- 3. Kiểm tra số lượng records trong users
SELECT 
  'Bảng users' as table_name,
  COUNT(*) as total_records
FROM users;

-- 4. Kiểm tra một số records mẫu từ allergy_cards
SELECT 
  'Sample allergy_cards' as info,
  id,
  patient_name,
  issued_by_user_id,
  status,
  created_at
FROM allergy_cards
ORDER BY created_at DESC
LIMIT 5;

-- 5. Kiểm tra JOIN giữa allergy_cards và users
SELECT 
  'JOIN test: allergy_cards + users' as info,
  ac.id as card_id,
  ac.patient_name,
  ac.issued_by_user_id,
  u.id as user_id,
  u.name as user_name,
  u.email as user_email
FROM allergy_cards ac
LEFT JOIN users u ON ac.issued_by_user_id = u.id
LIMIT 5;

-- 6. Kiểm tra view với điều kiện đơn giản hơn
SELECT 
  'View simple test' as info,
  id,
  patient_name,
  issued_by_name,
  issued_by_email
FROM allergy_cards_with_details
LIMIT 5;

-- 7. Kiểm tra cấu trúc của view
SELECT 
  'View columns' as info,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'allergy_cards_with_details'
ORDER BY ordinal_position;
