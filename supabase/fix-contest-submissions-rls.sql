-- =====================================================
-- FIX RLS POLICIES - CONTEST SUBMISSIONS
-- Cho phép anonymous users tạo submissions khi thi
-- =====================================================

-- Drop các policies cũ
DROP POLICY IF EXISTS "Anyone can submit" ON contest_submissions;
DROP POLICY IF EXISTS "Public can read completed submissions" ON contest_submissions;
DROP POLICY IF EXISTS "Admin can manage submissions" ON contest_submissions;
DROP POLICY IF EXISTS "Anyone can submit contest answers" ON contest_submissions;
DROP POLICY IF EXISTS "Public can read contest submissions for leaderboard" ON contest_submissions;

-- Tạo lại policies mới
-- 1. Cho phép BẤT KỲ AI (kể cả anonymous) insert submission
CREATE POLICY "Anyone can create submission" ON contest_submissions
  FOR INSERT 
  WITH CHECK (true);

-- 2. Cho phép đọc completed submissions (cho leaderboard)
CREATE POLICY "Anyone can read completed submissions" ON contest_submissions
  FOR SELECT 
  USING (status = 'completed');

-- 3. Cho phép update submission của chính mình (khi nộp bài)
CREATE POLICY "Anyone can update own submission" ON contest_submissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 4. Admin có thể làm mọi thứ
CREATE POLICY "Admin can manage all submissions" ON contest_submissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'contest_submissions';

SELECT 'Contest Submissions RLS Policies Fixed!' as status;





