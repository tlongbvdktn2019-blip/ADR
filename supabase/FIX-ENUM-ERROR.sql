-- 🔧 FIX ENUM ERROR
-- Sửa lỗi enum quiz_category trong script

-- =====================================
-- OPTION A: Thêm giá trị mới vào enum (nếu cần)
-- =====================================
-- Uncomment nếu muốn thêm giá trị mới vào enum
/*
ALTER TYPE quiz_category ADD VALUE 'adr_basic';
ALTER TYPE quiz_category ADD VALUE 'adr_reporting';
ALTER TYPE quiz_category ADD VALUE 'adr_management';
*/

-- =====================================
-- OPTION B: Sử dụng giá trị enum có sẵn
-- =====================================
-- Kiểm tra enum values có sẵn
SELECT 'AVAILABLE ENUM VALUES' as info;
SELECT 
    enumlabel as available_values,
    enumsortorder as order_position
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'quiz_category'
ORDER BY enumsortorder;

-- =====================================
-- OPTION C: Thay đổi cột thành VARCHAR (nếu cần linh hoạt hơn)
-- =====================================
-- Uncomment nếu muốn đổi từ enum sang varchar
/*
ALTER TABLE quiz_categories 
ALTER COLUMN category_key TYPE VARCHAR(50);
*/

-- =====================================
-- SAFE INSERT: Sử dụng giá trị có sẵn hoặc tạo mới an toàn
-- =====================================

-- Cách 1: Insert với NULL category_key trước, sau đó update
INSERT INTO quiz_categories (name, description, total_questions, is_active)
SELECT 'ADR Cơ bản', 'Kiến thức cơ bản về tác dụng không mong muốn của thuốc', 0, true
WHERE NOT EXISTS (SELECT 1 FROM quiz_categories WHERE name = 'ADR Cơ bản');

INSERT INTO quiz_categories (name, description, total_questions, is_active)
SELECT 'Báo cáo ADR', 'Quy trình và cách thức báo cáo ADR', 0, true
WHERE NOT EXISTS (SELECT 1 FROM quiz_categories WHERE name = 'Báo cáo ADR');

-- Cách 2: Nếu biết enum values, sử dụng chúng
-- Ví dụ: nếu enum có 'basic', 'reporting' thay vì 'adr_basic', 'adr_reporting'
/*
INSERT INTO quiz_categories (name, category_key, description, total_questions, is_active)
SELECT 'ADR Cơ bản', 'basic', 'Kiến thức cơ bản về tác dụng không mong muốn của thuốc', 0, true
WHERE NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'basic');

INSERT INTO quiz_categories (name, category_key, description, total_questions, is_active)
SELECT 'Báo cáo ADR', 'reporting', 'Quy trình và cách thức báo cáo ADR', 0, true
WHERE NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'reporting');
*/

SELECT '✅ SAFE CATEGORIES INSERTED' as status;

-- =====================================
-- FALLBACK: Tạo function để handle enum safely
-- =====================================
CREATE OR REPLACE FUNCTION safe_insert_category(
    p_name TEXT,
    p_key TEXT,
    p_description TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    category_id UUID;
    enum_exists BOOLEAN;
BEGIN
    -- Check if enum value exists
    SELECT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'quiz_category' AND e.enumlabel = p_key
    ) INTO enum_exists;
    
    -- Insert without category_key if enum value doesn't exist
    IF NOT enum_exists THEN
        INSERT INTO quiz_categories (name, description, total_questions, is_active)
        VALUES (p_name, p_description, 0, true)
        RETURNING id INTO category_id;
        
        RAISE NOTICE 'Inserted category % without category_key (enum value % not found)', p_name, p_key;
    ELSE
        -- Insert with category_key if enum value exists
        INSERT INTO quiz_categories (name, category_key, description, total_questions, is_active)
        VALUES (p_name, p_key::quiz_category, p_description, 0, true)
        ON CONFLICT (category_key) DO NOTHING
        RETURNING id INTO category_id;
        
        RAISE NOTICE 'Inserted category % with category_key %', p_name, p_key;
    END IF;
    
    RETURN category_id;
END;
$$;

-- Test safe function
SELECT 'TESTING SAFE FUNCTION' as section;
-- SELECT safe_insert_category('Test ADR Category', 'test_key', 'Test description');

SELECT '🔧 ENUM ERROR FIX COMPLETE' as status,
       'Use safe methods to insert categories' as recommendation;






