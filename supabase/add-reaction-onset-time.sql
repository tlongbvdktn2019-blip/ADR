-- Migration: Add reaction_onset_time column to adr_reports table
-- This column stores the time it takes for reaction to appear after taking the drug

-- Add the new column
ALTER TABLE adr_reports 
ADD COLUMN reaction_onset_time TEXT;

-- Add comment to the column for documentation
COMMENT ON COLUMN adr_reports.reaction_onset_time IS 'Thời gian từ lúc sử dụng thuốc đến khi xuất hiện phản ứng (ví dụ: 30 phút, 2 giờ, 3 ngày)';

-- Update demo data with sample values (optional)
UPDATE adr_reports SET reaction_onset_time = '2 giờ' WHERE id IN (
    SELECT id FROM adr_reports LIMIT 1
);

UPDATE adr_reports SET reaction_onset_time = '30 phút' WHERE id IN (
    SELECT id FROM adr_reports OFFSET 1 LIMIT 1
);

UPDATE adr_reports SET reaction_onset_time = '1 ngày' WHERE id IN (
    SELECT id FROM adr_reports OFFSET 2 LIMIT 1
);









