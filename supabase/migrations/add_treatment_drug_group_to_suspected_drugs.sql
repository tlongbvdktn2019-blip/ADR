-- Migration: Add treatment_drug_group column to suspected_drugs table
-- Description: Thêm trường nhóm thuốc điều trị vào bảng thuốc nghi ngờ gây ADR
-- Date: 2025-10-05

-- Add the new column
ALTER TABLE public.suspected_drugs 
ADD COLUMN IF NOT EXISTS treatment_drug_group character varying;

-- Add comment to the column
COMMENT ON COLUMN public.suspected_drugs.treatment_drug_group 
IS 'Nhóm thuốc điều trị - Chọn từ bảng treatment_drugs';

-- Create index for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_suspected_drugs_treatment_drug_group 
ON public.suspected_drugs(treatment_drug_group);





