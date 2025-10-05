-- Migration: Fix treatment_drugs public access and add sample data
-- Description: 
--   1. Tạo bảng treatment_drugs nếu chưa có
--   2. Disable RLS để form public có thể truy cập
--   3. Thêm dữ liệu mẫu các nhóm thuốc điều trị phổ biến
-- Date: 2025-10-05

-- Step 1: Create treatment_drugs table if not exists
CREATE TABLE IF NOT EXISTS public.treatment_drugs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying NOT NULL UNIQUE,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 2: Disable RLS (because this is a lookup/reference table)
-- Public users need to read this data for the report form
ALTER TABLE public.treatment_drugs DISABLE ROW LEVEL SECURITY;

-- Step 3: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_treatment_drugs_name 
ON public.treatment_drugs(name);

-- Step 4: Add sample data (only if table is empty)
DO $$
BEGIN
    -- Only insert if table is empty
    IF NOT EXISTS (SELECT 1 FROM public.treatment_drugs LIMIT 1) THEN
        INSERT INTO public.treatment_drugs (name) VALUES
        ('Thuốc kháng sinh'),
        ('Thuốc giảm đau'),
        ('Thuốc hạ sốt'),
        ('Thuốc chống viêm'),
        ('Thuốc chống dị ứng'),
        ('Thuốc tim mạch'),
        ('Thuốc hạ huyết áp'),
        ('Thuốc điều trị đái tháo đường'),
        ('Thuốc corticosteroid'),
        ('Thuốc kháng virus'),
        ('Thuốc kháng nấm'),
        ('Thuốc trị loét dạ dày'),
        ('Thuốc an thần, ngủ'),
        ('Thuốc chống trầm cảm'),
        ('Thuốc chống co giật'),
        ('Thuốc chống ung thư'),
        ('Thuốc chống đông máu'),
        ('Thuốc điều hòa lipid máu'),
        ('Thuốc kháng histamine'),
        ('Thuốc vitamin và khoáng chất')
        ON CONFLICT (name) DO NOTHING;
        
        RAISE NOTICE 'Đã thêm % nhóm thuốc điều trị', (SELECT COUNT(*) FROM public.treatment_drugs);
    ELSE
        RAISE NOTICE 'Bảng treatment_drugs đã có dữ liệu: % bản ghi', (SELECT COUNT(*) FROM public.treatment_drugs);
    END IF;
END $$;

-- Step 5: Grant permissions for authenticated and anon users
GRANT SELECT ON public.treatment_drugs TO anon;
GRANT SELECT ON public.treatment_drugs TO authenticated;

-- Step 6: Add comment to table
COMMENT ON TABLE public.treatment_drugs 
IS 'Danh sách nhóm thuốc điều trị - Bảng tham chiếu cho form báo cáo ADR';

-- Verify the data
SELECT 
    'treatment_drugs' as table_name,
    COUNT(*) as total_records,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ OK'
        ELSE '❌ EMPTY'
    END as status
FROM public.treatment_drugs;

