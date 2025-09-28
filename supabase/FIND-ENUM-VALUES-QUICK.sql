-- ⚡ QUICK: Tìm enum values có sẵn
-- Chạy ngay để biết có thể dùng giá trị enum nào

-- Kiểm tra enum quiz_category có những giá trị gì
SELECT 'AVAILABLE ENUM VALUES FOR quiz_category' as info;
SELECT 
    enumlabel as available_enum_values,
    enumsortorder as order_position
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'quiz_category'
ORDER BY enumsortorder;

-- Kiểm tra constraints trên bảng
SELECT 'CONSTRAINTS ON quiz_categories' as info;
SELECT 
    conname as constraint_name,
    contype as type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'quiz_categories'::regclass;

-- Kiểm tra existing categories
SELECT 'EXISTING CATEGORIES' as info;
SELECT 
    name,
    category_key,
    description,
    is_active
FROM quiz_categories
ORDER BY created_at;

-- Nếu không có enum type, kiểm tra column info
SELECT 'COLUMN INFO' as info;
SELECT 
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'quiz_categories' AND column_name = 'category_key';






