-- Migration: Thêm 2 trường riêng biệt cho liều dùng và số lần dùng
-- Description: Tách dosage_and_frequency thành dosage và frequency
-- Date: 2025-10-05

-- Thêm cột mới cho liều dùng
ALTER TABLE public.suspected_drugs 
ADD COLUMN IF NOT EXISTS dosage text;

-- Thêm cột mới cho số lần dùng
ALTER TABLE public.suspected_drugs 
ADD COLUMN IF NOT EXISTS frequency text;

-- Thêm comment cho các cột
COMMENT ON COLUMN public.suspected_drugs.dosage 
IS 'Liều dùng - VD: 500mg, 1 viên, 2 viên';

COMMENT ON COLUMN public.suspected_drugs.frequency 
IS 'Số lần dùng - VD: 3 lần/ngày, 2 lần/ngày, mỗi 8 giờ';

-- Tạo index để tối ưu tìm kiếm (optional)
CREATE INDEX IF NOT EXISTS idx_suspected_drugs_dosage 
ON public.suspected_drugs(dosage);

CREATE INDEX IF NOT EXISTS idx_suspected_drugs_frequency 
ON public.suspected_drugs(frequency);

-- Lưu ý: Không xóa cột dosage_and_frequency cũ để giữ dữ liệu hiện có
-- Có thể migrate dữ liệu sau này nếu cần






