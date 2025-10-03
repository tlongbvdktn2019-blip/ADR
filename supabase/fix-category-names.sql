-- =====================================================
-- FIX CATEGORY NAMES TO MATCH EXCEL TEMPLATE
-- Cập nhật tên danh mục để khớp với template Excel
-- =====================================================

-- Update existing categories to match expected names
UPDATE quiz_categories SET name = 'WHO-UMC' WHERE category_key = 'who_umc';
UPDATE quiz_categories SET name = 'Naranjo' WHERE category_key = 'naranjo';
UPDATE quiz_categories SET name = 'Drug Knowledge' WHERE category_key = 'drug_knowledge';
UPDATE quiz_categories SET name = 'Case Studies' WHERE category_key = 'case_studies';
UPDATE quiz_categories SET name = 'Regulations' WHERE category_key = 'regulations';
UPDATE quiz_categories SET name = 'General ADR' WHERE category_key = 'general';

-- Verify changes
SELECT id, name, category_key, total_questions, is_active 
FROM quiz_categories 
ORDER BY created_at;

-- Done
SELECT 'Category names updated successfully!' as status;



