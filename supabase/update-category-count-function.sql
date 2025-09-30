-- Function to update quiz category question counts
-- This function recalculates the total_questions count for a given category

CREATE OR REPLACE FUNCTION update_category_question_count(category_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE quiz_categories 
    SET total_questions = (
        SELECT COUNT(*) 
        FROM quiz_questions 
        WHERE quiz_questions.category_id = update_category_question_count.category_id 
        AND is_active = true 
        AND review_status = 'approved'
    )
    WHERE id = category_id;
END;
$$;

-- Function to update all category question counts
CREATE OR REPLACE FUNCTION update_all_category_counts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE quiz_categories 
    SET total_questions = (
        SELECT COUNT(*) 
        FROM quiz_questions 
        WHERE quiz_questions.category_id = quiz_categories.id 
        AND is_active = true 
        AND review_status = 'approved'
    );
END;
$$;

-- Run the function to update all counts initially
SELECT update_all_category_counts();






















