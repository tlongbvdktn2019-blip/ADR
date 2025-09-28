-- =====================================================
-- SAMPLE ADR DATA FOR DASHBOARD TESTING
-- Script để thêm dữ liệu mẫu cho dashboard
-- =====================================================

-- Thêm dữ liệu mẫu vào bảng adr_reports
INSERT INTO adr_reports (
  reporter_id,
  patient_age,
  patient_gender,
  severity_level,
  outcome_after_treatment,
  organization,
  reporter_profession,
  report_date,
  reaction_onset_time,
  created_at,
  updated_at
) VALUES 
-- Dữ liệu mẫu 1
(
  (SELECT id FROM users ORDER BY created_at DESC LIMIT 1),
  25,
  'female',
  'hospitalization',
  'recovering',
  'Bệnh viện Đại học Y Hà Nội',
  'Bác sĩ',
  CURRENT_DATE - INTERVAL '5 days',
  '2 giờ',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),
-- Dữ liệu mẫu 2
(
  (SELECT id FROM users ORDER BY created_at DESC LIMIT 1),
  45,
  'male',
  'not_serious',
  'completely_recovered',
  'Bệnh viện Bạch Mai',
  'Dược sĩ',
  CURRENT_DATE - INTERVAL '3 days',
  '30 phút',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
),
-- Dữ liệu mẫu 3
(
  (SELECT id FROM users ORDER BY created_at DESC LIMIT 1),
  67,
  'female',
  'life_threatening',
  'not_recovered',
  'Bệnh viện Chợ Rẫy',
  'Bác sĩ',
  CURRENT_DATE - INTERVAL '1 day',
  '1 giờ',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
-- Dữ liệu mẫu 4
(
  (SELECT id FROM users ORDER BY created_at DESC LIMIT 1),
  32,
  'male',
  'hospitalization',
  'recovering',
  'Bệnh viện K',
  'Y tá',
  CURRENT_DATE - INTERVAL '7 days',
  '4 giờ',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days'
),
-- Dữ liệu mẫu 5
(
  (SELECT id FROM users ORDER BY created_at DESC LIMIT 1),
  19,
  'female',
  'other_important',
  'completely_recovered',
  'Bệnh viện Việt Đức',
  'Bác sĩ',
  CURRENT_DATE - INTERVAL '10 days',
  '1 ngày',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
),
-- Dữ liệu mẫu 6
(
  (SELECT id FROM users ORDER BY created_at DESC LIMIT 1),
  78,
  'male',
  'death',
  'death',
  'Bệnh viện 103',
  'Bác sĩ',
  CURRENT_DATE - INTERVAL '15 days',
  '12 giờ',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '15 days'
),
-- Dữ liệu mẫu 7
(
  (SELECT id FROM users ORDER BY created_at DESC LIMIT 1),
  35,
  'female',
  'not_serious',
  'completely_recovered',
  'Bệnh viện Đại học Y Hà Nội',
  'Dược sĩ',
  CURRENT_DATE - INTERVAL '2 days',
  '3 giờ',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
-- Dữ liệu mẫu 8
(
  (SELECT id FROM users ORDER BY created_at DESC LIMIT 1),
  55,
  'male',
  'hospitalization',
  'recovered_with_sequelae',
  'Bệnh viện Hữu nghị Việt Đức',
  'Bác sĩ',
  CURRENT_DATE - INTERVAL '8 days',
  '6 giờ',
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days'
);

-- Thêm dữ liệu thuốc nghi ngờ cho mỗi báo cáo
INSERT INTO suspected_drugs (
  adr_report_id,
  drug_name,
  commercial_name,
  dosage,
  route_of_administration,
  indication,
  start_date,
  end_date,
  created_at,
  updated_at
)
SELECT 
  ar.id,
  CASE 
    WHEN ar.patient_age < 30 THEN 'Paracetamol'
    WHEN ar.patient_age < 50 THEN 'Aspirin'
    WHEN ar.patient_age < 70 THEN 'Ibuprofen'
    ELSE 'Amoxicillin'
  END as drug_name,
  CASE 
    WHEN ar.patient_age < 30 THEN 'Efferalgan'
    WHEN ar.patient_age < 50 THEN 'Aspirin 325mg'
    WHEN ar.patient_age < 70 THEN 'Brufen'
    ELSE 'Augmentin'
  END as commercial_name,
  '500mg',
  'Uống',
  'Giảm đau, hạ sốt',
  ar.report_date - INTERVAL '3 days',
  ar.report_date,
  ar.created_at,
  ar.updated_at
FROM adr_reports ar
WHERE ar.created_at >= NOW() - INTERVAL '20 days';

-- Thêm thêm một số thuốc khác để có đa dạng dữ liệu
INSERT INTO suspected_drugs (
  adr_report_id,
  drug_name,
  commercial_name,
  dosage,
  route_of_administration,
  indication,
  start_date,
  end_date,
  created_at,
  updated_at
)
SELECT 
  ar.id,
  CASE 
    WHEN RANDOM() < 0.3 THEN 'Metformin'
    WHEN RANDOM() < 0.6 THEN 'Amlodipine'
    ELSE 'Atorvastatin'
  END as drug_name,
  CASE 
    WHEN RANDOM() < 0.3 THEN 'Glucophage'
    WHEN RANDOM() < 0.6 THEN 'Norvasc'
    ELSE 'Lipitor'
  END as commercial_name,
  CASE 
    WHEN RANDOM() < 0.3 THEN '850mg'
    WHEN RANDOM() < 0.6 THEN '5mg'
    ELSE '20mg'
  END as dosage,
  'Uống',
  CASE 
    WHEN RANDOM() < 0.3 THEN 'Điều trị đái tháo đường'
    WHEN RANDOM() < 0.6 THEN 'Điều trị tăng huyết áp'
    ELSE 'Điều trị rối loạn lipid máu'
  END as indication,
  ar.report_date - INTERVAL '5 days',
  ar.report_date + INTERVAL '1 day',
  ar.created_at,
  ar.updated_at
FROM adr_reports ar
WHERE ar.created_at >= NOW() - INTERVAL '20 days'
AND RANDOM() < 0.5; -- Chỉ thêm cho 50% số báo cáo

-- Kiểm tra dữ liệu đã thêm
SELECT 
  'adr_reports' as table_name,
  COUNT(*) as record_count
FROM adr_reports
WHERE created_at >= NOW() - INTERVAL '20 days'

UNION ALL

SELECT 
  'suspected_drugs' as table_name,
  COUNT(*) as record_count
FROM suspected_drugs
WHERE created_at >= NOW() - INTERVAL '20 days';

-- Hiển thị thống kê nhanh
SELECT 
  'Tổng số báo cáo' as metric,
  COUNT(*) as value
FROM adr_reports

UNION ALL

SELECT 
  'Báo cáo trong 30 ngày qua' as metric,
  COUNT(*) as value
FROM adr_reports 
WHERE created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
  'Tổng số thuốc nghi ngờ' as metric,
  COUNT(*) as value
FROM suspected_drugs;









