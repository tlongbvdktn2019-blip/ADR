-- =====================================================
-- DEBUG ADMIN CHECK
-- Kiểm tra xem user hiện tại có quyền admin không
-- =====================================================

-- 1. Kiểm tra auth.uid()
SELECT 
  'Current auth.uid()' as info,
  auth.uid() as user_id;

-- 2. Kiểm tra user trong bảng users
SELECT 
  'User info from users table' as info,
  id,
  email,
  name,
  role,
  role::TEXT as role_text
FROM public.users
WHERE id = auth.uid();

-- 3. Kiểm tra function is_admin()
SELECT 
  'is_admin() function result' as info,
  is_admin() as result;

-- 4. Kiểm tra tất cả admin users (để so sánh)
SELECT 
  'All admin users' as info,
  id,
  email,
  name,
  role
FROM public.users
WHERE role = 'admin';

-- 5. Kiểm tra policies hiện tại
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('departments', 'units', 'contests')
ORDER BY tablename, policyname;

-- 6. Test manual check (so sánh với function)
SELECT 
  'Manual admin check' as info,
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) as is_admin_manual;

-- Kết quả mong đợi:
-- - auth.uid() phải có giá trị (không null)
-- - User với auth.uid() phải có role = 'admin'
-- - is_admin() phải return true
-- - Manual check phải return true



























