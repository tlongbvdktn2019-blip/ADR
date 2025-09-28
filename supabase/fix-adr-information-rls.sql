-- =====================================================
-- FIX ADR Information RLS Policies
-- =====================================================

-- First, drop existing policies to start clean
DROP POLICY IF EXISTS "Admins can view all information" ON adr_information;
DROP POLICY IF EXISTS "Admins can manage information" ON adr_information;
DROP POLICY IF EXISTS "Users can view published information" ON adr_information;
DROP POLICY IF EXISTS "Users can view their own views" ON information_views;
DROP POLICY IF EXISTS "Users can create views" ON information_views;
DROP POLICY IF EXISTS "Admins can view all views" ON information_views;
DROP POLICY IF EXISTS "Users can view all likes" ON information_likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON information_likes;
DROP POLICY IF EXISTS "Admins can manage all likes" ON information_likes;

-- Disable RLS temporarily
ALTER TABLE adr_information DISABLE ROW LEVEL SECURITY;
ALTER TABLE information_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE information_likes DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE adr_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE information_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE information_likes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SIMPLER RLS POLICIES
-- =====================================================

-- Policy 1: Admin can do everything on adr_information
CREATE POLICY "admin_all_access" ON adr_information
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role::text = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role::text = 'admin'
    )
  );

-- Policy 2: Regular users can only view published content
CREATE POLICY "user_view_published" ON adr_information
  FOR SELECT TO authenticated
  USING (
    status::text = 'published' 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      target_audience IS NULL 
      OR target_audience = '{}' 
      OR 'user' = ANY(target_audience)
      OR 'public' = ANY(target_audience)
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (
          users.organization = ANY(target_audience)
          OR users.role::text = ANY(target_audience)
        )
      )
    )
  );

-- =====================================================
-- INFORMATION_VIEWS policies
-- =====================================================

-- Admin can manage all views
CREATE POLICY "admin_manage_views" ON information_views
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role::text = 'admin'
    )
  );

-- Users can manage their own views
CREATE POLICY "user_own_views" ON information_views
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- INFORMATION_LIKES policies
-- =====================================================

-- Everyone can view likes (for counts)
CREATE POLICY "view_all_likes" ON information_likes
  FOR SELECT TO authenticated
  USING (true);

-- Admin can manage all likes
CREATE POLICY "admin_manage_likes" ON information_likes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role::text = 'admin'
    )
  );

-- Users can manage their own likes
CREATE POLICY "user_own_likes" ON information_likes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_delete_own_likes" ON information_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- TEST DATA - Clean up any existing test data first
-- =====================================================
DELETE FROM adr_information WHERE title LIKE 'Test Information%' OR title LIKE '%test%';

-- Insert sample data (this should work now)
INSERT INTO adr_information (
  title,
  summary,
  content,
  type,
  priority,
  tags,
  status,
  published_at,
  created_by_user_id,
  author_name,
  author_organization,
  target_audience,
  is_pinned,
  show_on_homepage
) 
SELECT 
  'Hướng dẫn báo cáo ADR mới nhất 2024',
  'Cập nhật hướng dẫn và quy trình báo cáo tác dụng không mong muốn của thuốc theo thông tư mới nhất.',
  '<h2>Hướng dẫn báo cáo ADR năm 2024</h2><p>Nội dung chi tiết về quy trình báo cáo ADR...</p>',
  'guideline',
  1,
  ARRAY['ADR', 'báo cáo', 'hướng dẫn', '2024'],
  'published',
  timezone('utc', now()),
  u.id,
  u.name,
  u.organization,
  ARRAY['admin', 'user'],
  true,
  true
FROM users u 
WHERE u.role::text = 'admin' 
LIMIT 1
ON CONFLICT (title) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS FOR TESTING
-- =====================================================

-- Function to get current user ID (for debugging)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to test admin check
CREATE OR REPLACE FUNCTION test_admin_check()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role::text = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('adr_information', 'information_views', 'information_likes')
ORDER BY tablename, policyname;

-- Check admin users
SELECT id, name, email, role, organization 
FROM users 
WHERE role::text = 'admin';

-- Test basic access
SELECT COUNT(*) as admin_count FROM users WHERE role::text = 'admin';
SELECT COUNT(*) as info_count FROM adr_information;

-- =====================================================

-- First, drop existing policies to start clean
DROP POLICY IF EXISTS "Admins can view all information" ON adr_information;
DROP POLICY IF EXISTS "Admins can manage information" ON adr_information;
DROP POLICY IF EXISTS "Users can view published information" ON adr_information;
DROP POLICY IF EXISTS "Users can view their own views" ON information_views;
DROP POLICY IF EXISTS "Users can create views" ON information_views;
DROP POLICY IF EXISTS "Admins can view all views" ON information_views;
DROP POLICY IF EXISTS "Users can view all likes" ON information_likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON information_likes;
DROP POLICY IF EXISTS "Admins can manage all likes" ON information_likes;

-- Disable RLS temporarily
ALTER TABLE adr_information DISABLE ROW LEVEL SECURITY;
ALTER TABLE information_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE information_likes DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE adr_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE information_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE information_likes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SIMPLER RLS POLICIES
-- =====================================================

-- Policy 1: Admin can do everything on adr_information
CREATE POLICY "admin_all_access" ON adr_information
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role::text = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role::text = 'admin'
    )
  );

-- Policy 2: Regular users can only view published content
CREATE POLICY "user_view_published" ON adr_information
  FOR SELECT TO authenticated
  USING (
    status::text = 'published' 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      target_audience IS NULL 
      OR target_audience = '{}' 
      OR 'user' = ANY(target_audience)
      OR 'public' = ANY(target_audience)
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND (
          users.organization = ANY(target_audience)
          OR users.role::text = ANY(target_audience)
        )
      )
    )
  );

-- =====================================================
-- INFORMATION_VIEWS policies
-- =====================================================

-- Admin can manage all views
CREATE POLICY "admin_manage_views" ON information_views
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role::text = 'admin'
    )
  );

-- Users can manage their own views
CREATE POLICY "user_own_views" ON information_views
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- INFORMATION_LIKES policies
-- =====================================================

-- Everyone can view likes (for counts)
CREATE POLICY "view_all_likes" ON information_likes
  FOR SELECT TO authenticated
  USING (true);

-- Admin can manage all likes
CREATE POLICY "admin_manage_likes" ON information_likes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role::text = 'admin'
    )
  );

-- Users can manage their own likes
CREATE POLICY "user_own_likes" ON information_likes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_delete_own_likes" ON information_likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- TEST DATA - Clean up any existing test data first
-- =====================================================
DELETE FROM adr_information WHERE title LIKE 'Test Information%' OR title LIKE '%test%';

-- Insert sample data (this should work now)
INSERT INTO adr_information (
  title,
  summary,
  content,
  type,
  priority,
  tags,
  status,
  published_at,
  created_by_user_id,
  author_name,
  author_organization,
  target_audience,
  is_pinned,
  show_on_homepage
) 
SELECT 
  'Hướng dẫn báo cáo ADR mới nhất 2024',
  'Cập nhật hướng dẫn và quy trình báo cáo tác dụng không mong muốn của thuốc theo thông tư mới nhất.',
  '<h2>Hướng dẫn báo cáo ADR năm 2024</h2><p>Nội dung chi tiết về quy trình báo cáo ADR...</p>',
  'guideline',
  1,
  ARRAY['ADR', 'báo cáo', 'hướng dẫn', '2024'],
  'published',
  timezone('utc', now()),
  u.id,
  u.name,
  u.organization,
  ARRAY['admin', 'user'],
  true,
  true
FROM users u 
WHERE u.role::text = 'admin' 
LIMIT 1
ON CONFLICT (title) DO NOTHING;

-- =====================================================
-- HELPER FUNCTIONS FOR TESTING
-- =====================================================

-- Function to get current user ID (for debugging)
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to test admin check
CREATE OR REPLACE FUNCTION test_admin_check()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role::text = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('adr_information', 'information_views', 'information_likes')
ORDER BY tablename, policyname;

-- Check admin users
SELECT id, name, email, role, organization 
FROM users 
WHERE role::text = 'admin';

-- Test basic access
SELECT COUNT(*) as admin_count FROM users WHERE role::text = 'admin';
SELECT COUNT(*) as info_count FROM adr_information;
