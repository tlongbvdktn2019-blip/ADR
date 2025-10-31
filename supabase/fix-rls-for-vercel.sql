-- =====================================================
-- FIX RLS POLICIES FOR VERCEL/PRODUCTION
-- Vercel sử dụng anonymous users → cần TO anon
-- =====================================================

-- Bước 1: Xem policies hiện tại
SELECT 
  '📋 POLICIES HIỆN TẠI:' as info,
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'contests'
ORDER BY policyname;

-- Bước 2: Drop policies cũ
DROP POLICY IF EXISTS "Public can read active contests" ON contests;
DROP POLICY IF EXISTS "Public read active contests v2" ON contests;
DROP POLICY IF EXISTS "contests_select_policy" ON contests;
DROP POLICY IF EXISTS "public_read_active_contests" ON contests;
DROP POLICY IF EXISTS "allow_public_read_contests" ON contests;

-- Bước 3: Tạo policy MỚI với TO anon, authenticated
CREATE POLICY "allow_public_read_contests" ON contests
  FOR SELECT 
  TO anon, authenticated  -- ← QUAN TRỌNG! Cho phép cả anon và authenticated users
  USING (
    status = 'active' 
    AND is_public = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Bước 4: Verify policy mới
SELECT 
  '✅ POLICY MỚI ĐÃ TẠO:' as info,
  policyname,
  roles,
  qual::text as condition
FROM pg_policies
WHERE tablename = 'contests' 
  AND policyname = 'allow_public_read_contests';

-- Bước 5: Test as anonymous user (giống Vercel)
SET ROLE anon;

SELECT 
  '🧪 TEST AS ANON USER (giống Vercel):' as test,
  COUNT(*) as total_contests_visible
FROM contests 
WHERE status = 'active' AND is_public = true;

SELECT 
  '📋 Các cuộc thi anon user nhìn thấy:' as result,
  id,
  title,
  status,
  is_public,
  start_date,
  end_date
FROM contests 
WHERE status = 'active' AND is_public = true;

RESET ROLE;

-- Bước 6: Test as authenticated user
SET ROLE authenticated;

SELECT 
  '🧪 TEST AS AUTHENTICATED USER:' as test,
  COUNT(*) as total_contests_visible
FROM contests 
WHERE status = 'active' AND is_public = true;

RESET ROLE;

-- Bước 7: Kết quả
SELECT 
  '🎉 KẾT QUẢ:' as summary,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'contests' 
        AND policyname = 'allow_public_read_contests'
        AND 'anon' = ANY(roles)
    )
    THEN '✅ Policy đã có TO anon → Vercel sẽ hoạt động!'
    ELSE '❌ Policy chưa có TO anon → Vercel vẫn lỗi'
  END as status;

-- Bước 8: Debug info
SELECT 
  '🔍 DEBUG INFO:' as info,
  'Run this query after deployment to verify' as instruction,
  'SELECT * FROM contests WHERE status = ''active'' AND is_public = true;' as test_query;

