-- Add columns for Section F: Đánh giá (Assessment)
-- Chỉ lưu 2 kết quả đơn giản

-- Kết quả Đánh giá mức độ nặng
ALTER TABLE public.adr_reports 
ADD COLUMN IF NOT EXISTS severity_assessment_result text;

-- Kết quả đánh giá khả năng phòng tránh
ALTER TABLE public.adr_reports 
ADD COLUMN IF NOT EXISTS preventability_assessment_result text;

-- Add comments for clarity
COMMENT ON COLUMN public.adr_reports.severity_assessment_result IS 'Kết quả Đánh giá mức độ nặng';
COMMENT ON COLUMN public.adr_reports.preventability_assessment_result IS 'Kết quả đánh giá khả năng phòng tránh';

