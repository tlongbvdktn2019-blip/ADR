-- =====================================================
-- KIỂM TRA TÍNH NĂNG LỊCH SỬ BỔ SUNG THẺ DỊ ỨNG
-- Script để kiểm tra các bảng, views, triggers đã được tạo chưa
-- =====================================================

-- 1. Kiểm tra bảng allergy_card_updates
SELECT 
  'Table: allergy_card_updates' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'allergy_card_updates'
    ) THEN '✅ EXISTS'
    ELSE '❌ NOT FOUND'
  END as status;

-- 2. Kiểm tra bảng update_allergies
SELECT 
  'Table: update_allergies' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'update_allergies'
    ) THEN '✅ EXISTS'
    ELSE '❌ NOT FOUND'
  END as status;

-- 3. Kiểm tra view allergy_card_updates_with_details
SELECT 
  'View: allergy_card_updates_with_details' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'allergy_card_updates_with_details'
    ) THEN '✅ EXISTS'
    ELSE '❌ NOT FOUND'
  END as status;

-- 4. Kiểm tra trigger auto_add_approved_allergies
SELECT 
  'Trigger: trigger_auto_add_approved_allergies' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'trigger_auto_add_approved_allergies'
    ) THEN '✅ EXISTS'
    ELSE '❌ NOT FOUND'
  END as status;

-- 5. Kiểm tra function auto_add_approved_allergies
SELECT 
  'Function: auto_add_approved_allergies' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc 
      WHERE proname = 'auto_add_approved_allergies'
    ) THEN '✅ EXISTS'
    ELSE '❌ NOT FOUND'
  END as status;

-- 6. Kiểm tra indexes
SELECT 
  'Index: idx_card_updates_card' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND indexname = 'idx_card_updates_card'
    ) THEN '✅ EXISTS'
    ELSE '❌ NOT FOUND'
  END as status;

-- 7. Đếm số bản ghi trong các bảng
SELECT 
  'Data: allergy_card_updates' as table_name,
  COUNT(*) as record_count
FROM allergy_card_updates;

SELECT 
  'Data: update_allergies' as table_name,
  COUNT(*) as record_count
FROM update_allergies;

-- 8. Xem cấu trúc bảng allergy_card_updates
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'allergy_card_updates'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Xem cấu trúc bảng update_allergies
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'update_allergies'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Kiểm tra foreign keys
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('allergy_card_updates', 'update_allergies');

-- Kết quả
SELECT '=== CHECK COMPLETED ===' as status;

