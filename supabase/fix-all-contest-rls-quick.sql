-- =====================================================
-- QUICK FIX - TẤT CẢ RLS POLICIES CHO CONTEST
-- Cho phép anonymous users tham gia cuộc thi
-- =====================================================

-- 1. CONTEST_PARTICIPANTS
DROP POLICY IF EXISTS "Anyone can register as participant" ON contest_participants;
DROP POLICY IF EXISTS "Public can read participants" ON contest_participants;
DROP POLICY IF EXISTS "Public can read own participant info" ON contest_participants;

CREATE POLICY "Anyone can register" ON contest_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read participants" ON contest_participants
  FOR SELECT USING (true);

-- 2. CONTEST_SUBMISSIONS  
DROP POLICY IF EXISTS "Anyone can submit" ON contest_submissions;
DROP POLICY IF EXISTS "Public can read completed submissions" ON contest_submissions;
DROP POLICY IF EXISTS "Anyone can submit contest answers" ON contest_submissions;
DROP POLICY IF EXISTS "Public can read contest submissions for leaderboard" ON contest_submissions;
DROP POLICY IF EXISTS "Admin can manage submissions" ON contest_submissions;
DROP POLICY IF EXISTS "Anyone can create submission" ON contest_submissions;
DROP POLICY IF EXISTS "Anyone can read completed submissions" ON contest_submissions;
DROP POLICY IF EXISTS "Anyone can update own submission" ON contest_submissions;

CREATE POLICY "Anyone can insert submission" ON contest_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read submissions" ON contest_submissions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update submission" ON contest_submissions
  FOR UPDATE USING (true) WITH CHECK (true);

-- 3. CONTEST_ANSWERS
DROP POLICY IF EXISTS "Anyone can insert answers" ON contest_answers;
DROP POLICY IF EXISTS "Public can read answers" ON contest_answers;

CREATE POLICY "Anyone can insert answer" ON contest_answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read answers" ON contest_answers
  FOR SELECT USING (true);

-- Verify
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies
WHERE tablename IN ('contest_participants', 'contest_submissions', 'contest_answers')
ORDER BY tablename, policyname;

SELECT 'All Contest RLS Policies Fixed - Anonymous users can now participate!' as status;


