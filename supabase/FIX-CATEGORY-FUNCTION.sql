-- 🔧 FIX CATEGORY COUNT FUNCTION
-- Sửa function update_category_question_count với đúng tên cột

-- =====================================
-- STEP 1: Kiểm tra cấu trúc bảng
-- =====================================
SELECT 'TABLE STRUCTURE CHECK' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quiz_categories' 
AND column_name IN ('question_count', 'total_questions')
ORDER BY column_name;

-- =====================================
-- STEP 2: Drop old function nếu có
-- =====================================
DROP FUNCTION IF EXISTS public.update_category_question_count(UUID);
DROP FUNCTION IF EXISTS public.update_all_category_counts();

-- =====================================
-- STEP 3: Tạo function đúng với cột total_questions
-- =====================================
CREATE OR REPLACE FUNCTION public.update_category_question_count(category_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Cập nhật total_questions trong bảng quiz_categories
    UPDATE quiz_categories 
    SET 
        total_questions = (
            SELECT COUNT(*) 
            FROM quiz_questions 
            WHERE quiz_questions.category_id = update_category_question_count.category_id
            AND is_active = true
            AND review_status = 'approved'
        ),
        updated_at = now()
    WHERE id = update_category_question_count.category_id;
    
    -- Raise notice for debugging
    RAISE NOTICE 'Updated question count for category %', category_id;
END;
$$;

-- =====================================
-- STEP 4: Tạo function cập nhật tất cả categories
-- =====================================
CREATE OR REPLACE FUNCTION public.update_all_category_counts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_count integer := 0;
BEGIN
    -- Cập nhật tất cả categories
    UPDATE quiz_categories 
    SET 
        total_questions = (
            SELECT COUNT(*) 
            FROM quiz_questions 
            WHERE quiz_questions.category_id = quiz_categories.id
            AND is_active = true
            AND review_status = 'approved'
        ),
        updated_at = now();
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    RAISE NOTICE 'Updated % categories', updated_count;
    RETURN updated_count;
END;
$$;

-- =====================================
-- STEP 5: Test functions
-- =====================================
SELECT 'TESTING FUNCTIONS' as section;

-- Test function exists
SELECT 
    'FUNCTIONS CREATED' as test,
    proname as function_name,
    prokind as function_type
FROM pg_proc 
WHERE proname IN ('update_category_question_count', 'update_all_category_counts');

-- Run update all function
SELECT 'RUNNING UPDATE ALL' as test;
SELECT update_all_category_counts() as categories_updated;

-- =====================================
-- STEP 6: Tạo trigger tự động
-- =====================================
CREATE OR REPLACE FUNCTION public.trigger_update_category_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Xử lý khi xóa
    IF TG_OP = 'DELETE' THEN
        PERFORM update_category_question_count(OLD.category_id);
        RETURN OLD;
    END IF;
    
    -- Xử lý khi cập nhật category_id
    IF TG_OP = 'UPDATE' AND OLD.category_id IS DISTINCT FROM NEW.category_id THEN
        PERFORM update_category_question_count(OLD.category_id);
        PERFORM update_category_question_count(NEW.category_id);
        RETURN NEW;
    END IF;
    
    -- Xử lý khi thêm mới hoặc update
    PERFORM update_category_question_count(NEW.category_id);
    RETURN NEW;
END;
$$;

-- Drop trigger cũ nếu có
DROP TRIGGER IF EXISTS update_category_count_trigger ON quiz_questions;

-- Tạo trigger mới
CREATE TRIGGER update_category_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON quiz_questions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_category_count();

SELECT 'TRIGGER CREATED' as status;

-- =====================================
-- STEP 7: Verification
-- =====================================
SELECT 'VERIFICATION RESULTS' as section;

-- Show current category stats
SELECT 
    'CATEGORY STATS AFTER UPDATE' as test,
    c.name as category_name,
    c.total_questions as stored_count,
    COUNT(q.id) as actual_count,
    CASE 
        WHEN c.total_questions = COUNT(q.id) THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM quiz_categories c
LEFT JOIN quiz_questions q ON q.category_id = c.id 
    AND q.is_active = true 
    AND q.review_status = 'approved'
WHERE c.is_active = true
GROUP BY c.id, c.name, c.total_questions
ORDER BY c.name;

-- Test trigger exists
SELECT 
    'TRIGGER CHECK' as test,
    tgname as trigger_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgname = 'update_category_count_trigger';

SELECT '🎉 CATEGORY COUNT FUNCTION FIXED!' as final_status,
       'Function should work properly now when creating questions' as result;






