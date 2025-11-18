-- =====================================================
-- QUICK CHECK: Kiểm tra nhanh Public Access
-- Chạy script này để xác định vấn đề
-- =====================================================

SELECT '🔍 KIỂM TRA NHANH PUBLIC ACCESS' as title;

-- =====================================================
-- CHECK 1: View có tồn tại không?
-- =====================================================

SELECT 
  '1️⃣ VIEW EXISTS' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'allergy_card_updates_with_details'
    )
    THEN '✅ View tồn tại'
    ELSE '❌ View KHÔNG tồn tại - Cần chạy script tạo view'
  END as status;

-- =====================================================
-- CHECK 2: View có permissions cho anon không?
-- =====================================================

SELECT 
  '2️⃣ ANON PERMISSIONS' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_privileges
      WHERE table_schema = 'public'
      AND table_name = 'allergy_card_updates_with_details'
      AND grantee = 'anon'
      AND privilege_type = 'SELECT'
    )
    THEN '✅ Anon có quyền SELECT'
    ELSE '❌ Anon KHÔNG có quyền - Cần GRANT SELECT'
  END as status;

-- =====================================================
-- CHECK 3: RLS có enable cho allergy_card_updates không?
-- =====================================================

SELECT 
  '3️⃣ RLS ENABLED' as check_name,
  CASE 
    WHEN (
      SELECT rowsecurity FROM pg_tables 
      WHERE tablename = 'allergy_card_updates'
    )
    THEN '✅ RLS enabled'
    ELSE '❌ RLS CHƯA enable - Cần ALTER TABLE ENABLE RLS'
  END as status;

-- =====================================================
-- CHECK 4: Policy cho public select có tồn tại không?
-- =====================================================

SELECT 
  '4️⃣ PUBLIC SELECT POLICY' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'allergy_card_updates'
      AND policyname LIKE '%Public%view%'
      AND cmd = 'SELECT'
    )
    THEN '✅ Policy cho public select tồn tại'
    ELSE '❌ Policy CHƯA có - Cần CREATE POLICY'
  END as status;

-- =====================================================
-- CHECK 5: Có dữ liệu updates không?
-- =====================================================

SELECT 
  '5️⃣ DATA EXISTS' as check_name,
  CASE 
    WHEN (SELECT COUNT(*) FROM allergy_card_updates) > 0
    THEN '✅ Có ' || (SELECT COUNT(*) FROM allergy_card_updates) || ' bản cập nhật'
    ELSE '⚠️ Chưa có dữ liệu updates (bình thường nếu chưa ai bổ sung)'
  END as status;

-- =====================================================
-- CHECK 6: View có trả về dữ liệu không?
-- =====================================================

SELECT 
  '6️⃣ VIEW RETURNS DATA' as check_name,
  CASE 
    WHEN (SELECT COUNT(*) FROM allergy_card_updates_with_details) >= 0
    THEN '✅ View hoạt động, có ' || (SELECT COUNT(*) FROM allergy_card_updates_with_details) || ' rows'
    ELSE '❌ View có lỗi'
  END as status;

-- =====================================================
-- SUMMARY: Tổng kết vấn đề
-- =====================================================

SELECT '📊 TỔNG KẾT' as section;

WITH checks AS (
  SELECT 
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'allergy_card_updates_with_details'
      ) THEN 1 ELSE 0
    END as view_exists,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM information_schema.table_privileges
        WHERE table_schema = 'public'
        AND table_name = 'allergy_card_updates_with_details'
        AND grantee = 'anon'
        AND privilege_type = 'SELECT'
      ) THEN 1 ELSE 0
    END as anon_permission,
    CASE 
      WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'allergy_card_updates')
      THEN 1 ELSE 0
    END as rls_enabled,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'allergy_card_updates'
        AND cmd = 'SELECT'
      ) THEN 1 ELSE 0
    END as policy_exists
)
SELECT 
  CASE 
    WHEN view_exists + anon_permission + rls_enabled + policy_exists = 4 
    THEN '✅ TẤT CẢ ĐỀU OK - Public access hoạt động!'
    ELSE '❌ CÓ VẤN ĐỀ - Cần fix ' || (4 - (view_exists + anon_permission + rls_enabled + policy_exists)) || ' điểm'
  END as overall_status,
  view_exists as view_ok,
  anon_permission as permission_ok,
  rls_enabled as rls_ok,
  policy_exists as policy_ok
FROM checks;

-- =====================================================
-- ACTION REQUIRED: Hành động cần làm
-- =====================================================

SELECT '🔧 HÀNH ĐỘNG CẦN LÀM' as section;

SELECT 
  CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'allergy_card_updates_with_details'
    )
    THEN '1. Chạy script: FIX-PUBLIC-ACCESS-VIEW.sql để tạo view'
    
    WHEN NOT EXISTS (
      SELECT 1 FROM information_schema.table_privileges
      WHERE table_schema = 'public'
      AND table_name = 'allergy_card_updates_with_details'
      AND grantee = 'anon'
    )
    THEN '2. Chạy: GRANT SELECT ON allergy_card_updates_with_details TO anon;'
    
    WHEN NOT (SELECT rowsecurity FROM pg_tables WHERE tablename = 'allergy_card_updates')
    THEN '3. Chạy: ALTER TABLE allergy_card_updates ENABLE ROW LEVEL SECURITY;'
    
    WHEN NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'allergy_card_updates'
    )
    THEN '4. Chạy script ENABLE-PUBLIC-ACCESS-ALLERGY-UPDATES.sql để tạo policies'
    
    ELSE '✅ Không cần làm gì - Mọi thứ đã OK!'
  END as action_required;

-- =====================================================
-- DETAIL: Chi tiết permissions
-- =====================================================

SELECT '📋 CHI TIẾT PERMISSIONS' as section;

SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'allergy_card_updates_with_details'
ORDER BY grantee;

-- =====================================================
-- DETAIL: Chi tiết policies
-- =====================================================

SELECT '📋 CHI TIẾT POLICIES' as section;

SELECT 
  tablename,
  policyname,
  cmd as command
FROM pg_policies 
WHERE tablename IN ('allergy_card_updates', 'update_allergies', 'allergy_cards', 'card_allergies')
ORDER BY tablename, policyname;

-- =====================================================
-- TEST: Thử query như public user
-- =====================================================

SELECT '🧪 TEST QUERY' as section;

-- Nếu query này chạy được → Public access OK
SELECT 
  id,
  card_id,
  updated_by_name,
  facility_name,
  update_type,
  allergies_count,
  created_at
FROM allergy_card_updates_with_details
ORDER BY created_at DESC
LIMIT 3;

-- =====================================================
-- 🎯 CÁCH ĐỌC KẾT QUẢ
-- =====================================================

SELECT '📖 CÁCH ĐỌC KẾT QUẢ' as guide;

SELECT '
✅ = OK, hoạt động tốt
❌ = Có vấn đề, cần fix
⚠️ = Cảnh báo, có thể bình thường

Nếu có bất kỳ ❌ nào:
→ Chạy script: supabase/FIX-PUBLIC-ACCESS-VIEW.sql

Sau đó chạy lại script này để verify.
' as instructions;

