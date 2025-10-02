-- =====================================================
-- FIX RLS POLICIES - CONTEST MODULE
-- Sửa lỗi permission denied for table users
-- =====================================================

-- Bước 1: Xóa các policies cũ có vấn đề
DROP POLICY IF EXISTS "Admin can manage departments" ON departments;
DROP POLICY IF EXISTS "Admin can manage units" ON units;
DROP POLICY IF EXISTS "Admin can manage contests" ON contests;

-- Bước 2: Tạo function để check user role từ users table của hệ thống
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check từ bảng users của hệ thống (không phải auth.users)
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()
    AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bước 3: Tạo lại policies với function mới
-- Policy cho departments
CREATE POLICY "Admin can manage departments" ON departments
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Cho phép public read departments active
CREATE POLICY "Public read active departments v2" ON departments
  FOR SELECT
  USING (is_active = true OR is_admin());

-- Policy cho units  
CREATE POLICY "Admin can manage units" ON units
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Cho phép public read units active
CREATE POLICY "Public read active units v2" ON units
  FOR SELECT
  USING (is_active = true OR is_admin());

-- Policy cho contests
CREATE POLICY "Admin can manage contests" ON contests
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Cho phép public read active contests
CREATE POLICY "Public read active contests v2" ON contests
  FOR SELECT
  USING ((status = 'active' AND is_public = true) OR is_admin());

-- Bước 4: Nếu function không hoạt động, dùng cách đơn giản hơn
-- Comment out function trên và dùng cách này:

/*
-- CÁCH 2: Đơn giản - Cho phép authenticated users manage (check role ở API)

DROP POLICY IF EXISTS "Admin can manage departments" ON departments;
DROP POLICY IF EXISTS "Admin can manage units" ON units;
DROP POLICY IF EXISTS "Admin can manage contests" ON contests;

-- Departments
CREATE POLICY "Authenticated can manage departments" ON departments
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Units
CREATE POLICY "Authenticated can manage units" ON units
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Contests
CREATE POLICY "Authenticated can manage contests" ON contests
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
*/

-- Bước 5: Grant execute permission cho function
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO anon;
GRANT EXECUTE ON FUNCTION is_admin() TO service_role;

-- Đảm bảo users table có RLS policy cho việc đọc own record
-- Điều này an toàn hơn là grant select trực tiếp
DO $$
BEGIN
  -- Enable RLS nếu chưa có
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  
  -- Tạo policy cho phép user đọc record của chính mình
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read own record'
  ) THEN
    CREATE POLICY "Users can read own record" ON public.users
      FOR SELECT
      USING (id = auth.uid());
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Kết thúc
COMMENT ON FUNCTION is_admin() IS 'Check if current user is admin from users table';

-- Test function (chỉ để debug, có thể xóa sau)
-- SELECT is_admin();

