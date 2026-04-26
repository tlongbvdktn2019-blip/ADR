-- Migration: Add "Thuốc cản quang" to treatment_drugs lookup table
-- Description:
--   Thêm nhóm thuốc điều trị "Thuốc cản quang" nếu chưa tồn tại.
-- Date: 2026-04-26

INSERT INTO public.treatment_drugs (name)
VALUES ('Thuốc cản quang')
ON CONFLICT (name) DO NOTHING;
