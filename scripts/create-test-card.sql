-- =====================================================
-- TẠO THẺ DỊ ỨNG MẪU ĐỂ TEST QR
-- =====================================================

-- Xóa thẻ test cũ (nếu có)
DELETE FROM allergy_cards WHERE card_code LIKE 'AC-2024-TEST%';

-- Tạo thẻ test mới
INSERT INTO allergy_cards (
  card_code,
  patient_name,
  patient_age,
  patient_gender,
  hospital_name,
  doctor_name,
  doctor_phone,
  allergies,
  status,
  issued_date,
  expiry_date,
  created_by
) VALUES (
  'AC-2024-TEST01',
  'Nguyễn Văn Test',
  35,
  'male',
  'Bệnh viện Test',
  'BS. Test Demo',
  '0901234567',
  jsonb_build_array(
    jsonb_build_object(
      'name', 'Penicillin',
      'certainty', 'confirmed',
      'severity', 'severe',
      'symptoms', 'Phát ban, ngứa, khó thở'
    ),
    jsonb_build_object(
      'name', 'Aspirin',
      'certainty', 'suspected',
      'severity', 'moderate',
      'symptoms', 'Đau dạ dày, buồn nôn'
    )
  ),
  'active',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '1 year',
  (SELECT id FROM users WHERE email LIKE '%admin%' LIMIT 1)
);

-- Kiểm tra kết quả
SELECT 
  card_code,
  patient_name,
  status,
  jsonb_array_length(allergies) as num_allergies,
  issued_date,
  expiry_date
FROM allergy_cards 
WHERE card_code = 'AC-2024-TEST01';

-- In QR URL
SELECT 
  card_code,
  CONCAT('QR URL: http://localhost:3000/allergy-cards/view/', card_code) as qr_url
FROM allergy_cards 
WHERE card_code = 'AC-2024-TEST01';
