-- =====================================================
-- FIX HOÀN CHỈNH: Sửa tất cả vấn đề cuộc thi
-- Chạy script này trong Supabase SQL Editor
-- =====================================================

-- Bước 1: Kiểm tra trạng thái hiện tại
DO $$
DECLARE
  contest_count INTEGER;
  question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO contest_count FROM contests WHERE status = 'active';
  SELECT COUNT(*) INTO question_count FROM contest_questions WHERE is_active = true;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'TRẠNG THÁI HIỆN TẠI:';
  RAISE NOTICE 'Số cuộc thi active: %', contest_count;
  RAISE NOTICE 'Số câu hỏi active: %', question_count;
  RAISE NOTICE '==========================================';
END $$;

-- Bước 2: Xem chi tiết cuộc thi hiện tại
SELECT 
  '🔍 TRƯỚC KHI FIX' as stage,
  id,
  title,
  status,
  is_public,
  start_date,
  end_date,
  number_of_questions,
  created_at,
  CASE
    WHEN status IS NULL THEN '❌ Status = NULL'
    WHEN status != 'active' THEN '❌ Status = ' || status
    WHEN is_public IS NULL THEN '❌ is_public = NULL'
    WHEN is_public != true THEN '❌ is_public = false'
    WHEN start_date IS NOT NULL AND start_date > NOW() THEN '❌ Chưa bắt đầu'
    WHEN end_date IS NOT NULL AND end_date < NOW() THEN '❌ ĐÃ KẾT THÚC'
    ELSE '✅ OK'
  END as problem
FROM contests
ORDER BY created_at DESC
LIMIT 5;

-- Bước 3: Thêm cột is_public nếu chưa có
ALTER TABLE contests 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Bước 4: Fix tất cả cuộc thi "Kiến thức ADR"
UPDATE contests
SET 
  status = 'active',
  is_public = true,
  start_date = NULL,
  end_date = NULL,
  updated_at = NOW()
WHERE title ILIKE '%kiến thức%adr%' 
   OR title ILIKE '%adr%'
   OR id = '7286bfd2-97f4-429b-808a-d554a48f50df';

-- Bước 5: Xem lại sau khi fix
SELECT 
  '✅ SAU KHI FIX' as stage,
  id,
  title,
  status,
  is_public,
  start_date,
  end_date,
  number_of_questions,
  created_at,
  CASE
    WHEN status != 'active' THEN '❌ Status không active'
    WHEN is_public != true THEN '❌ is_public không true'
    WHEN start_date IS NOT NULL AND start_date > NOW() THEN '❌ Chưa bắt đầu'
    WHEN end_date IS NOT NULL AND end_date < NOW() THEN '❌ Đã kết thúc'
    ELSE '✅ HOÀN HẢO'
  END as status_check
FROM contests
WHERE title ILIKE '%adr%'
ORDER BY created_at DESC;

-- Bước 6: Drop và tạo lại RLS policies
DROP POLICY IF EXISTS "Public can read active contests" ON contests;
DROP POLICY IF EXISTS "Public read active contests v2" ON contests;
DROP POLICY IF EXISTS "contests_select_policy" ON contests;
DROP POLICY IF EXISTS "public_read_active_contests" ON contests;
DROP POLICY IF EXISTS "allow_public_read_contests" ON contests;

-- Tạo policy mới đơn giản và rõ ràng
CREATE POLICY "allow_public_read_contests" ON contests
  FOR SELECT 
  USING (
    status = 'active' 
    AND is_public = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Bước 7: Test query giống API sẽ dùng
SELECT 
  '🧪 TEST - API SẼ TRẢ VỀ:' as test_label,
  id,
  title,
  status,
  is_public,
  start_date,
  end_date,
  number_of_questions,
  '✅ Cuộc thi này sẽ hiển thị cho user' as result
FROM contests 
WHERE status = 'active' 
  AND is_public = true
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW())
ORDER BY created_at DESC
LIMIT 1;

-- Bước 8: Kiểm tra số lượng câu hỏi
SELECT 
  '📊 THỐNG KÊ CÂU HỎI' as info,
  COUNT(*) as total_questions_active,
  (SELECT number_of_questions FROM contests WHERE status = 'active' ORDER BY created_at DESC LIMIT 1) as questions_needed,
  CASE 
    WHEN COUNT(*) >= (SELECT COALESCE(number_of_questions, 0) FROM contests WHERE status = 'active' ORDER BY created_at DESC LIMIT 1)
    THEN '✅ Đủ câu hỏi'
    ELSE '❌ Thiếu câu hỏi'
  END as questions_status
FROM contest_questions 
WHERE is_active = true;

-- Bước 9: Fix RLS cho các bảng liên quan
DROP POLICY IF EXISTS "Anyone can register" ON contest_participants;
DROP POLICY IF EXISTS "Anyone can read participants" ON contest_participants;

CREATE POLICY "anyone_can_register" ON contest_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "anyone_can_read_participants" ON contest_participants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert submission" ON contest_submissions;
DROP POLICY IF EXISTS "Anyone can read submissions" ON contest_submissions;
DROP POLICY IF EXISTS "Anyone can update submission" ON contest_submissions;

CREATE POLICY "anyone_insert_submission" ON contest_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "anyone_read_submissions" ON contest_submissions
  FOR SELECT USING (true);

CREATE POLICY "anyone_update_submission" ON contest_submissions
  FOR UPDATE USING (true) WITH CHECK (true);

-- Bước 10: Kiểm tra các policies đã tạo
SELECT 
  '🔐 POLICIES HIỆN TẠI' as info,
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ Cho phép đọc'
    WHEN cmd = 'INSERT' THEN '✅ Cho phép tạo'
    WHEN cmd = 'UPDATE' THEN '✅ Cho phép sửa'
    ELSE cmd
  END as action
FROM pg_policies
WHERE tablename IN ('contests', 'contest_participants', 'contest_submissions')
ORDER BY tablename, policyname;

-- Bước 11: Kết quả cuối cùng
SELECT 
  '🎉 KẾT QUẢ CUỐI CÙNG' as summary,
  (SELECT COUNT(*) FROM contests WHERE status = 'active' AND is_public = true) as active_public_contests,
  (SELECT COUNT(*) FROM contest_questions WHERE is_active = true) as active_questions,
  CASE 
    WHEN (SELECT COUNT(*) FROM contests WHERE status = 'active' AND is_public = true) > 0 
     AND (SELECT COUNT(*) FROM contest_questions WHERE is_active = true) >= 10
    THEN '✅✅✅ HOÀN THÀNH - Người dùng có thể vào cuộc thi!'
    WHEN (SELECT COUNT(*) FROM contests WHERE status = 'active' AND is_public = true) = 0
    THEN '❌ Không có cuộc thi active + public'
    ELSE '❌ Thiếu câu hỏi'
  END as final_status;

-- Hiển thị cuộc thi sẽ hiển thị
SELECT 
  '🏆 CUỘC THI SẼ HIỂN THỊ CHO NGƯỜI DÙNG:' as announcement,
  id,
  title,
  description,
  number_of_questions,
  time_per_question,
  status,
  is_public,
  start_date,
  end_date
FROM contests 
WHERE status = 'active' 
  AND is_public = true
  AND (start_date IS NULL OR start_date <= NOW())
  AND (end_date IS NULL OR end_date >= NOW())
ORDER BY created_at DESC;

