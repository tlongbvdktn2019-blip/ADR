-- =====================================================
-- THÊM DỮ LIỆU TEST CHO ALLERGY CARD
-- Chỉ chạy nếu không có dữ liệu trong bảng
-- =====================================================

-- Kiểm tra xem đã có user nào chưa
DO $$
DECLARE
  test_user_id UUID;
  test_card_id UUID;
BEGIN
  -- Lấy hoặc tạo user test
  SELECT id INTO test_user_id 
  FROM users 
  WHERE email = 'test@example.com' 
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    -- Tạo user test nếu chưa có
    INSERT INTO users (name, email, password_hash, role, organization)
    VALUES (
      'Test User',
      'test@example.com',
      '$2a$10$testpasswordhash', -- Đây chỉ là example, không dùng được
      'doctor',
      'Test Hospital'
    )
    RETURNING id INTO test_user_id;
    
    RAISE NOTICE 'Created test user with id: %', test_user_id;
  ELSE
    RAISE NOTICE 'Using existing test user with id: %', test_user_id;
  END IF;
  
  -- Tạo allergy card test
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
    'Nguyễn Văn A',
    'BN001',
    35,
    'male',
    'Bệnh viện Đa khoa Trung ương',
    'Khoa Nội',
    'BS. Trần Thị B',
    '0901234567',
    test_user_id,
    'Test Hospital',
    '{"patient":"Nguyễn Văn A","allergies":["Penicillin","Aspirin"]}',
    'Thẻ dị ứng test - Bệnh nhân có tiền sử dị ứng với Penicillin và Aspirin'
  )
  RETURNING id INTO test_card_id;
  
  RAISE NOTICE 'Created test allergy card with id: %', test_card_id;
  
  -- Thêm một số allergies cho card này
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
      'Nổi mẩn đỏ, ngứa',
      'moderate',
      'immediate'
    ),
    (
      test_card_id,
      'Aspirin',
      'suspected',
      'Khó thở, sưng môi',
      'severe',
      'immediate'
    );
  
  RAISE NOTICE 'Added test allergies to card';
END $$;

-- Verify dữ liệu đã tạo
SELECT 
  '✅ Test data created!' as status,
  COUNT(*) as total_cards
FROM allergy_cards
WHERE patient_name = 'Nguyễn Văn A';

-- Kiểm tra view với dữ liệu mới
SELECT 
  'View test with new data' as test_name,
  COUNT(*) as total_records
FROM allergy_cards_with_details;
