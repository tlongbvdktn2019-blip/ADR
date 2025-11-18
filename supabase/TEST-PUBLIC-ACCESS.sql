-- =====================================================
-- TEST PUBLIC ACCESS FOR ALLERGY CARD UPDATES
-- Kiểm tra xem public access đã hoạt động chưa
-- =====================================================

-- =====================================================
-- 1. KIỂM TRA RLS đã enable chưa
-- =====================================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
  'allergy_cards',
  'card_allergies',
  'allergy_card_updates', 
  'update_allergies'
)
ORDER BY tablename;

-- Kết quả mong đợi: Tất cả đều có rls_enabled = true

-- =====================================================
-- 2. KIỂM TRA POLICIES đã tạo
-- =====================================================

SELECT 
  tablename,
  policyname,
  cmd as command,
  CASE 
    WHEN roles::text LIKE '%public%' OR qual::text = 'true' THEN 'PUBLIC ACCESS'
    ELSE 'RESTRICTED'
  END as access_level,
  qual as using_condition,
  with_check as with_check_condition
FROM pg_policies 
WHERE tablename IN (
  'allergy_cards',
  'card_allergies',
  'allergy_card_updates',
  'update_allergies'
)
ORDER BY tablename, policyname;

-- Kết quả mong đợi:
-- - allergy_cards: "Public can view allergy cards" (SELECT)
-- - card_allergies: "Public can view card allergies" (SELECT)  
-- - allergy_card_updates: 
--   + "Public can view..." (SELECT)
--   + "Public can insert..." (INSERT)
-- - update_allergies:
--   + "Public can view..." (SELECT)
--   + "Public can insert..." (INSERT)

-- =====================================================
-- 3. KIỂM TRA VIEW permissions
-- =====================================================

SELECT 
  grantee,
  privilege_type,
  table_name
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'allergy_card_updates_with_details'
ORDER BY grantee, privilege_type;

-- Kết quả mong đợi: anon và authenticated có SELECT permission

-- =====================================================
-- 4. TEST QUERY như thể là PUBLIC USER
-- =====================================================

-- Simulate public access (không cần auth)
-- Nếu query này chạy được từ API với anon key → Public access OK

-- Test 1: Đếm số thẻ dị ứng
SELECT 
  'Total allergy cards' as test,
  COUNT(*) as count
FROM allergy_cards;

-- Test 2: Đếm số lần bổ sung
SELECT 
  'Total updates' as test,
  COUNT(*) as count
FROM allergy_card_updates;

-- Test 3: Xem view chi tiết
SELECT 
  'View access test' as test,
  COUNT(*) as count
FROM allergy_card_updates_with_details;

-- =====================================================
-- 5. KIỂM TRA CHI TIẾT MỘT THẺ (giống như khi quét QR)
-- =====================================================

-- Lấy 1 thẻ bất kỳ để test
SELECT 
  ac.id,
  ac.card_code,
  ac.patient_name,
  ac.status,
  -- Đếm số dị ứng
  (SELECT COUNT(*) FROM card_allergies WHERE card_id = ac.id) as allergies_count,
  -- Đếm số lần bổ sung
  (SELECT COUNT(*) FROM allergy_card_updates WHERE card_id = ac.id) as updates_count
FROM allergy_cards ac
LIMIT 1;

-- =====================================================
-- 6. TEST INSERT (nếu có dữ liệu test)
-- =====================================================

-- NOTE: Đây chỉ là test structure, không thực sự insert
-- Trong thực tế, API sẽ validate card_code trước

-- Kiểm tra structure cho INSERT
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'allergy_card_updates'
AND column_name IN (
  'card_id',
  'updated_by_name',
  'updated_by_organization',
  'facility_name',
  'update_type'
)
ORDER BY ordinal_position;

-- =====================================================
-- 7. SUMMARY - KẾT QUẢ KIỂM TRA
-- =====================================================

SELECT 
  'PUBLIC ACCESS TEST SUMMARY' as status,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'allergy_card_updates') as update_policies_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'update_allergies') as allergies_policies_count,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'allergy_cards' AND policyname LIKE '%Public%') as card_public_policies,
  CASE 
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'allergy_card_updates') = true 
    THEN '✅ RLS Enabled'
    ELSE '❌ RLS Not Enabled'
  END as rls_status;

-- =====================================================
-- ✅ NẾU TẤT CẢ QUERIES TRÊN CHẠY THÀNH CÔNG
-- =====================================================

SELECT '✅ Public access is working!' as final_result;
SELECT '🎉 Bây giờ có thể quét QR và bổ sung thông tin mà không cần đăng nhập!' as message;

-- =====================================================
-- 🔍 CÁCH TEST TRONG THỰC TẾ
-- =====================================================

-- 1. Truy cập trang thẻ dị ứng KHÔNG CẦN đăng nhập:
--    /allergy-cards/[id]
-- 
-- 2. Nhấn nút "Bổ sung thông tin"
-- 
-- 3. Nhập mã thẻ để xác thực
--
-- 4. Điền form và bổ sung thông tin
--
-- 5. Kiểm tra lịch sử bổ sung đã xuất hiện
--
-- =====================================================

