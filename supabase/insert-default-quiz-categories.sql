-- =====================================================
-- INSERT DEFAULT QUIZ CATEGORIES
-- Run this script to create default categories for the quiz system
-- =====================================================

-- Clear existing categories (optional - comment out if you want to keep existing)
-- DELETE FROM quiz_categories;

-- Insert default categories (only if they don't exist)
DO $$
BEGIN
    -- WHO-UMC
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'who_umc') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme, total_questions, is_active) 
        VALUES ('WHO-UMC', 'who_umc', 'Câu hỏi về thang đánh giá WHO-UMC cho mối liên quan thuốc-ADR', 'BeakerIcon', 'blue', 0, true);
    END IF;
    
    -- Naranjo
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'naranjo') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme, total_questions, is_active) 
        VALUES ('Naranjo', 'naranjo', 'Câu hỏi về thang điểm Naranjo và ứng dụng', 'CalculatorIcon', 'green', 0, true);
    END IF;
    
    -- Drug Knowledge
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'drug_knowledge') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme, total_questions, is_active) 
        VALUES ('Drug Knowledge', 'drug_knowledge', 'Kiến thức về thuốc, tác dụng phụ, tương tác', 'CubeIcon', 'purple', 0, true);
    END IF;
    
    -- Case Studies
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'case_studies') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme, total_questions, is_active) 
        VALUES ('Case Studies', 'case_studies', 'Phân tích các trường hợp ADR thực tế', 'DocumentTextIcon', 'orange', 0, true);
    END IF;
    
    -- Regulations
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'regulations') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme, total_questions, is_active) 
        VALUES ('Regulations', 'regulations', 'Quy định pháp lý về ADR tại Việt Nam', 'ScaleIcon', 'red', 0, true);
    END IF;
    
    -- General ADR
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'general') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme, total_questions, is_active) 
        VALUES ('General ADR', 'general', 'Kiến thức tổng quan về Pharmacovigilance', 'BookOpenIcon', 'gray', 0, true);
    END IF;
END $$;

-- Verify insertion
SELECT id, name, category_key, total_questions, is_active 
FROM quiz_categories 
ORDER BY created_at;

-- Done
SELECT 'Quiz categories inserted successfully!' as status;

