-- 🔧 CREATE MISSING FUNCTIONS
-- Tạo các function bị thiếu để app hoạt động đúng

-- =====================================
-- FUNCTION 1: update_category_question_count
-- =====================================
-- Function để cập nhật số lượng câu hỏi trong category
CREATE OR REPLACE FUNCTION public.update_category_question_count(category_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Cập nhật question_count trong bảng quiz_categories
    UPDATE quiz_categories 
    SET 
        question_count = (
            SELECT COUNT(*) 
            FROM quiz_questions 
            WHERE quiz_questions.category_id = update_category_question_count.category_id
            AND is_active = true
        ),
        updated_at = now()
    WHERE id = update_category_question_count.category_id;
    
    -- Log action (optional)
    RAISE NOTICE 'Updated question count for category %', category_id;
END;
$$;

-- Test function
SELECT 'FUNCTION CREATED: update_category_question_count' as status;

-- =====================================
-- FUNCTION 2: update_all_category_counts
-- =====================================
-- Function để cập nhật tất cả category counts
CREATE OR REPLACE FUNCTION public.update_all_category_counts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    updated_count integer := 0;
    category_record RECORD;
BEGIN
    -- Update all categories
    FOR category_record IN 
        SELECT id FROM quiz_categories
    LOOP
        PERFORM update_category_question_count(category_record.id);
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$;

SELECT 'FUNCTION CREATED: update_all_category_counts' as status;

-- =====================================
-- FUNCTION 3: get_category_stats
-- =====================================
-- Function để lấy thống kê category
CREATE OR REPLACE FUNCTION public.get_category_stats(category_id UUID)
RETURNS TABLE(
    total_questions integer,
    active_questions integer,
    approved_questions integer,
    pending_questions integer,
    draft_questions integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer as total_questions,
        COUNT(CASE WHEN is_active = true THEN 1 END)::integer as active_questions,
        COUNT(CASE WHEN review_status = 'approved' THEN 1 END)::integer as approved_questions,
        COUNT(CASE WHEN review_status = 'pending' THEN 1 END)::integer as pending_questions,
        COUNT(CASE WHEN review_status = 'draft' THEN 1 END)::integer as draft_questions
    FROM quiz_questions 
    WHERE quiz_questions.category_id = get_category_stats.category_id;
END;
$$;

SELECT 'FUNCTION CREATED: get_category_stats' as status;

-- =====================================
-- TRIGGER: Auto update category count
-- =====================================
-- Tạo trigger để tự động update category count khi có thay đổi questions
CREATE OR REPLACE FUNCTION public.trigger_update_category_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update count for old category (if category changed)
    IF TG_OP = 'UPDATE' AND OLD.category_id != NEW.category_id THEN
        PERFORM update_category_question_count(OLD.category_id);
    END IF;
    
    -- Update count for new/current category
    IF TG_OP = 'DELETE' THEN
        PERFORM update_category_question_count(OLD.category_id);
        RETURN OLD;
    ELSE
        PERFORM update_category_question_count(NEW.category_id);
        RETURN NEW;
    END IF;
END;
$$;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS update_category_count_trigger ON quiz_questions;

-- Create trigger
CREATE TRIGGER update_category_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON quiz_questions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_category_count();

SELECT 'TRIGGER CREATED: update_category_count_trigger' as status;

-- =====================================
-- INITIAL DATA UPDATE
-- =====================================
-- Cập nhật tất cả category counts hiện tại
SELECT 'UPDATING ALL CATEGORY COUNTS...' as status;

-- Update all existing categories
UPDATE quiz_categories 
SET 
    question_count = (
        SELECT COUNT(*) 
        FROM quiz_questions 
        WHERE quiz_questions.category_id = quiz_categories.id
        AND is_active = true
    ),
    updated_at = now();

SELECT 'CATEGORY COUNTS UPDATED' as status;

-- =====================================
-- VERIFICATION
-- =====================================
SELECT 'VERIFICATION RESULTS' as section;

-- Check functions exist
SELECT 
    'FUNCTIONS CHECK' as test,
    COUNT(*) as function_count,
    string_agg(proname, ', ') as functions
FROM pg_proc 
WHERE proname IN ('update_category_question_count', 'update_all_category_counts', 'get_category_stats');

-- Check trigger exists
SELECT 
    'TRIGGERS CHECK' as test,
    COUNT(*) as trigger_count
FROM pg_trigger 
WHERE tgname = 'update_category_count_trigger';

-- Show category stats
SELECT 
    'CATEGORY STATS' as test,
    c.name as category_name,
    c.question_count as stored_count,
    COUNT(q.id) as actual_count,
    CASE 
        WHEN c.question_count = COUNT(q.id) THEN '✅ Match'
        ELSE '❌ Mismatch - will be fixed by trigger'
    END as status
FROM quiz_categories c
LEFT JOIN quiz_questions q ON q.category_id = c.id AND q.is_active = true
GROUP BY c.id, c.name, c.question_count
ORDER BY c.name;

SELECT '🎉 ALL FUNCTIONS AND TRIGGERS CREATED!' as final_status,
       'Quiz creation should work properly now' as result;






