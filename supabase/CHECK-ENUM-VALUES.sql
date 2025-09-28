-- 🔍 CHECK ENUM VALUES
-- Kiểm tra các enum types và values trong database

-- =====================================
-- STEP 1: Kiểm tra tất cả enum types
-- =====================================
SELECT 'ALL ENUM TYPES' as section;
SELECT 
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typtype = 'e'
GROUP BY t.typname
ORDER BY t.typname;

-- =====================================
-- STEP 2: Kiểm tra cấu trúc bảng quiz_categories
-- =====================================
SELECT 'QUIZ_CATEGORIES STRUCTURE' as section;
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quiz_categories'
ORDER BY ordinal_position;

-- =====================================
-- STEP 3: Kiểm tra data hiện tại trong quiz_categories
-- =====================================
SELECT 'EXISTING CATEGORIES' as section;
SELECT 
    id,
    name,
    category_key,
    description,
    total_questions,
    is_active
FROM quiz_categories
ORDER BY created_at;

-- =====================================
-- STEP 4: Kiểm tra các constraints
-- =====================================
SELECT 'TABLE CONSTRAINTS' as section;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confrelid::regclass as referenced_table,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'quiz_categories'::regclass;

-- =====================================
-- STEP 5: Nếu category_key là enum, kiểm tra values
-- =====================================
SELECT 'CATEGORY_KEY ENUM VALUES' as section;
SELECT 
    enumlabel as valid_category_keys
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'quiz_category'  -- Hoặc tên enum khác
ORDER BY enumsortorder;

-- =====================================
-- STEP 6: Kiểm tra nếu có foreign key references
-- =====================================
SELECT 'FOREIGN KEY INFO' as section;
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'quiz_categories' OR ccu.table_name = 'quiz_categories');

SELECT '🔍 ENUM CHECK COMPLETE' as status,
       'Review the results to understand the enum structure' as next_step;






