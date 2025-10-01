-- =====================================================
-- XEM CHI TIẾT THẺ DỊ ỨNG
-- =====================================================

-- 1. Xem thông tin cơ bản của thẻ
SELECT 
  '📋 THÔNG TIN THẺ DỊ ỨNG:' as info,
  id,
  card_code,
  patient_name,
  patient_age,
  patient_gender,
  hospital_name,
  doctor_name,
  issued_date,
  status
FROM allergy_cards
ORDER BY created_at DESC;

-- 2. Xem các allergies của thẻ
SELECT 
  '🔴 DANH SÁCH DỊ ỨNG:' as info,
  ca.allergen_name,
  ca.certainty_level,
  ca.severity_level,
  ca.clinical_manifestation,
  ca.reaction_type,
  ac.patient_name
FROM card_allergies ca
JOIN allergy_cards ac ON ca.card_id = ac.id
ORDER BY 
  CASE ca.severity_level 
    WHEN 'life_threatening' THEN 1
    WHEN 'severe' THEN 2
    WHEN 'moderate' THEN 3
    WHEN 'mild' THEN 4
    ELSE 5
  END;

-- 3. Xem dữ liệu từ VIEW (đã aggregate)
SELECT 
  '✅ DỮ LIỆU TỪ VIEW:' as info,
  patient_name,
  hospital_name,
  issued_by_name,
  issued_by_email,
  allergies
FROM allergy_cards_with_details
ORDER BY created_at DESC;


