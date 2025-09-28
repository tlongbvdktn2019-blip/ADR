-- Insert demo ADR reports
-- Chạy script này sau khi đã có demo users

-- Get user IDs for demo data
DO $$
DECLARE 
    admin_user_id UUID;
    user1_id UUID;
    user2_id UUID;
    report1_id UUID;
    report2_id UUID;
    report3_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE email = 'admin@soyte.gov.vn' 
    LIMIT 1;

    -- Get user IDs
    SELECT id INTO user1_id 
    FROM users 
    WHERE email = 'user@benhvien.gov.vn' 
    LIMIT 1;

    SELECT id INTO user2_id 
    FROM users 
    WHERE email = 'bs.nguyen@bvdahoc.vn' 
    LIMIT 1;

    -- If users don't exist, create them first
    IF user1_id IS NULL THEN
        INSERT INTO users (email, name, role, organization, phone)
        VALUES ('user@benhvien.gov.vn', 'Bác sĩ Nguyễn Văn A', 'user', 'Bệnh viện Đa khoa ABC', '0987654321')
        RETURNING id INTO user1_id;
    END IF;

    IF user2_id IS NULL THEN
        INSERT INTO users (email, name, role, organization, phone)
        VALUES ('bs.nguyen@bvdahoc.vn', 'BS. Nguyễn Thị B', 'user', 'Bệnh viện Đại học Y', '0912345678')
        RETURNING id INTO user2_id;
    END IF;

    -- Demo Report 1: Severe allergic reaction to Penicillin
    INSERT INTO adr_reports (
        reporter_id, organization,
        patient_name, patient_birth_date, patient_age, patient_gender, patient_weight,
        adr_occurrence_date, adr_description, related_tests, medical_history, treatment_response,
        severity_level, outcome_after_treatment,
        causality_assessment, assessment_scale, medical_staff_comment,
        reporter_name, reporter_profession, reporter_phone, reporter_email,
        report_type, report_date
    ) VALUES (
        user1_id, 'Bệnh viện Đa khoa ABC',
        'Trần Văn Nam', '1985-03-15', 38, 'male', 70.5,
        '2023-12-01', 'Bệnh nhân xuất hiện phù mặt, khó thở, nổi ban đỏ toàn thân sau 30 phút tiêm Penicillin G. Mạch nhanh 120 lần/phút, huyết áp giảm 90/60 mmHg.',
        'Xét nghiệm máu: Bạch cầu tăng 15.000/mm3, Eosinophil 8%. Tryptase huyết thanh: 25 ng/ml (bình thường <11.4)',
        'Không có tiền sử dị ứng thuốc. Đã sử dụng Penicillin đường uống trước đây không có vấn đề.',
        'Ngừng Penicillin ngay lập tức. Tiêm Adrenalin 0.5mg, Dexamethasone 8mg, Chlorpheniramine 10mg. Truyền dịch NaCl 0.9%. Theo dõi tích cực.',
        'life_threatening', 'recovered_without_sequelae',
        'certain', 'who', 'Đây là phản ứng phản vệ điển hình với Penicillin. Mối liên quan thời gian rõ ràng, triệu chứng điển hình, cải thiện sau khi ngừng thuốc và điều trị.',
        'Bác sĩ Nguyễn Văn A', 'Bác sĩ', '0987654321', 'bs.nguyen@bvdakhoaabc.vn',
        'initial', '2023-12-02'
    ) RETURNING id INTO report1_id;

    -- Demo Report 2: Hepatotoxicity from Paracetamol overdose
    INSERT INTO adr_reports (
        reporter_id, organization,
        patient_name, patient_birth_date, patient_age, patient_gender, patient_weight,
        adr_occurrence_date, adr_description, related_tests, medical_history, treatment_response,
        severity_level, outcome_after_treatment,
        causality_assessment, assessment_scale, medical_staff_comment,
        reporter_name, reporter_profession, reporter_phone, reporter_email,
        report_type, report_date
    ) VALUES (
        user2_id, 'Bệnh viện Đại học Y',
        'Lê Thị Hoa', '1992-07-20', 31, 'female', 55.0,
        '2023-11-28', 'Bệnh nhân xuất hiện vàng da, vàng mắt, nước tiểu sậm màu, mệt mỏi sau 3 ngày uống Paracetamol liều cao (4g/ngày) để giảm đau đầu.',
        'ALT: 850 U/L (bình thường 5-35), AST: 920 U/L (bình thường 5-35), Bilirubin toàn phần: 8.5 mg/dl, PT: kéo dài 18 giây.',
        'Không có tiền sử bệnh gan. Thường xuyên đau đầu và tự ý mua thuốc giảm đau.',
        'Ngừng Paracetamol. Cho N-acetylcysteine tĩnh mạch. Theo dõi chức năng gan hàng ngày. Tư vấn về liều dùng an toàn.',
        'hospitalization', 'recovered_with_sequelae',
        'probable', 'naranjo', 'Tổn thương gan do Paracetamol liều cao. Cần giáo dục bệnh nhân về liều dùng tối đa 3g/ngày và không uống quá 7 ngày liên tiếp.',
        'BS. Nguyễn Thị B', 'Bác sĩ', '0912345678', 'bs.nguyen@bvdahoc.vn',
        'initial', '2023-11-29'
    ) RETURNING id INTO report2_id;

    -- Demo Report 3: Skin reaction from Cephalexin
    INSERT INTO adr_reports (
        reporter_id, organization,
        patient_name, patient_birth_date, patient_age, patient_gender, patient_weight,
        adr_occurrence_date, adr_description, related_tests, medical_history, treatment_response,
        severity_level, outcome_after_treatment,
        causality_assessment, assessment_scale, medical_staff_comment,
        reporter_name, reporter_profession, reporter_phone, reporter_email,
        report_type, report_date
    ) VALUES (
        user1_id, 'Bệnh viện Đa khoa ABC',
        'Phạm Minh Tuấn', '2010-12-05', 13, 'male', 45.0,
        '2023-12-10', 'Bệnh nhi xuất hiện ban đỏ nổi cao, ngứa nhiều ở tứ chi và thân mình sau 2 ngày uống Cephalexin.',
        'Không có xét nghiệm đặc biệt. Triệu chứng lâm sàng điển hình của phản ứng dị ứng da.',
        'Không có tiền sử dị ứng thuốc. Lần đầu sử dụng kháng sinh nhóm Cephalosporin.',
        'Ngừng Cephalexin. Cho uống Cetirizine 5mg x 2 lần/ngày. Bôi kem Betamethasone vùng ngứa nhiều.',
        'not_serious', 'recovered_without_sequelae',
        'probable', 'who', 'Phản ứng dị ứng da nhẹ với Cephalexin. Cần lưu ý tránh các kháng sinh Beta-lactam trong tương lai.',
        'Bác sĩ Nguyễn Văn A', 'Bác sĩ', '0987654321', 'bs.nguyen@bvdakhoaabc.vn',
        'initial', '2023-12-11'
    ) RETURNING id INTO report3_id;

    -- Insert suspected drugs for Report 1
    INSERT INTO suspected_drugs (
        report_id, drug_name, commercial_name, dosage_form, manufacturer, batch_number,
        dosage_and_frequency, route_of_administration, start_date, end_date, indication,
        reaction_improved_after_stopping, reaction_reoccurred_after_rechallenge
    ) VALUES (
        report1_id, 'Penicillin G', 'Penicillin G Sodium', 'Lọ tiêm 1 triệu đơn vị', 'Công ty Dược ABC', 'PEN230801',
        '1 triệu đơn vị x 4 lần/ngày', 'Tiêm tĩnh mạch', '2023-12-01', '2023-12-01', 'Điều trị viêm phổi',
        'yes', 'not_rechallenged'
    );

    -- Insert suspected drugs for Report 2  
    INSERT INTO suspected_drugs (
        report_id, drug_name, commercial_name, dosage_form, manufacturer, batch_number,
        dosage_and_frequency, route_of_administration, start_date, end_date, indication,
        reaction_improved_after_stopping, reaction_reoccurred_after_rechallenge
    ) VALUES (
        report2_id, 'Paracetamol', 'Panadol', 'Viên nén 500mg', 'GSK', 'PAR230915',
        '1000mg x 4 lần/ngày', 'Uống', '2023-11-25', '2023-11-28', 'Giảm đau đầu',
        'yes', 'no_information'
    );

    -- Insert suspected drugs for Report 3
    INSERT INTO suspected_drugs (
        report_id, drug_name, commercial_name, dosage_form, manufacturer, batch_number,
        dosage_and_frequency, route_of_administration, start_date, end_date, indication,
        reaction_improved_after_stopping, reaction_reoccurred_after_rechallenge
    ) VALUES (
        report3_id, 'Cephalexin', 'Keflex', 'Viên nang 500mg', 'Pharma XYZ', 'CEP231020',
        '500mg x 3 lần/ngày', 'Uống', '2023-12-08', '2023-12-10', 'Điều trị viêm amidan',
        'yes', 'not_rechallenged'
    );

    RAISE NOTICE 'Demo reports created successfully!';
    RAISE NOTICE 'Report 1 ID: %', report1_id;
    RAISE NOTICE 'Report 2 ID: %', report2_id; 
    RAISE NOTICE 'Report 3 ID: %', report3_id;
END $$;


