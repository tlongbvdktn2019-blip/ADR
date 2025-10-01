-- =====================================================
-- TEST NHANH: Thêm dữ liệu test cho Allergy Card
-- Dựa trên schema thực tế từ data.md
-- =====================================================

-- Bước 1: Lấy một user ID để test (hoặc dùng user hiện tại)
DO $$
DECLARE
  test_user_id UUID;
  test_card_id UUID;
BEGIN
  -- Lấy user đầu tiên từ bảng users
  SELECT id INTO test_user_id FROM users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy user nào! Vui lòng tạo user trước.';
  END IF;
  
  RAISE NOTICE 'Sử dụng user_id: %', test_user_id;
  
  -- Tạo allergy card
  INSERT INTO allergy_cards (
    patient_name,
    patient_id_number,
    patient_age,
    patient_gender,
    hospital_name,
    department,
    doctor_name,
    doctor_phone,
    issued_by_user_id,
    organization,
    qr_code_data,
    notes
  )
  VALUES (
    'Nguyễn Văn Test',
    'TEST001',
    30,
    'male',
    'Bệnh viện Test',
    'Khoa Nội',
    'BS. Test',
    '0900000000',
    test_user_id,
    'Bệnh viện Test',
    '{"patient":"Nguyễn Văn Test","allergies":["Penicillin"]}',
    'Thẻ test'
  )
  RETURNING id INTO test_card_id;
  
  RAISE NOTICE 'Đã tạo allergy card với ID: %', test_card_id;
  
  -- Thêm allergies
  INSERT INTO card_allergies (
    card_id,
    allergen_name,
    certainty_level,
    clinical_manifestation,
    severity_level,
    reaction_type
  )
  VALUES 
    (
      test_card_id,
      'Penicillin',
      'confirmed',
      'Nổi mẩn đỏ, ngứa khắp người',
      'moderate',
      'skin_reaction'
    ),
    (
      test_card_id,
      'Aspirin',
      'suspected',
      'Khó thở nhẹ',
      'mild',
      'respiratory'
    );
  
  RAISE NOTICE 'Đã thêm allergies cho card';
END $$;

-- Kiểm tra kết quả
SELECT 
  '✅ Tổng số thẻ:' as status,
  COUNT(*) as total
FROM allergy_cards;

SELECT 
  '✅ Thẻ mới tạo:' as status,
  id,
  patient_name,
  hospital_name,
  issued_date
FROM allergy_cards
ORDER BY created_at DESC
LIMIT 1;

SELECT 
  '✅ View test:' as status,
  COUNT(*) as total_in_view
FROM allergy_cards_with_details;


