-- Quick Quiz Database Fix
-- Run this in Supabase SQL Editor if you're getting "Not enough questions" error

-- Check if tables exist first
DO $$
BEGIN
    -- Create basic tables if they don't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'quiz_categories') THEN
        CREATE TABLE quiz_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            category_key VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            icon_name VARCHAR(100),
            color_scheme VARCHAR(50),
            total_questions INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
        );
        RAISE NOTICE 'Created quiz_categories table';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'quiz_questions') THEN
        CREATE TABLE quiz_questions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            category_id UUID REFERENCES quiz_categories(id) ON DELETE CASCADE,
            question_text TEXT NOT NULL,
            question_type VARCHAR(20) DEFAULT 'multiple_choice',
            difficulty VARCHAR(20) DEFAULT 'beginner',
            options JSONB NOT NULL,
            correct_answer VARCHAR(10) NOT NULL,
            explanation TEXT,
            reference_source TEXT,
            learning_points TEXT[],
            estimated_time_seconds INTEGER DEFAULT 60,
            points_value INTEGER DEFAULT 10,
            times_answered INTEGER DEFAULT 0,
            times_correct INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            review_status VARCHAR(20) DEFAULT 'approved',
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
        );
        RAISE NOTICE 'Created quiz_questions table';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'quiz_sessions') THEN
        CREATE TABLE quiz_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            category_id UUID REFERENCES quiz_categories(id),
            session_name VARCHAR(255),
            difficulty_level VARCHAR(20),
            total_questions INTEGER NOT NULL,
            time_limit_seconds INTEGER,
            questions_answered INTEGER DEFAULT 0,
            correct_answers INTEGER DEFAULT 0,
            total_score INTEGER DEFAULT 0,
            time_taken_seconds INTEGER,
            completion_percentage DECIMAL(5,2) DEFAULT 0.00,
            status VARCHAR(20) DEFAULT 'in_progress',
            started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
        );
        RAISE NOTICE 'Created quiz_sessions table';
    END IF;
END
$$;

-- Insert categories if they don't exist
DO $$
BEGIN
    -- Insert categories one by one to avoid conflicts
    INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
    SELECT 'WHO-UMC Assessment', 'who_umc', 'Câu hỏi về thang đánh giá WHO-UMC cho mối liên quan thuốc-ADR', 'BeakerIcon', 'blue'
    WHERE NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'who_umc');
    
    INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
    SELECT 'Naranjo Scale', 'naranjo', 'Câu hỏi về thang điểm Naranjo và ứng dụng', 'CalculatorIcon', 'green'
    WHERE NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'naranjo');
    
    INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
    SELECT 'Drug Knowledge', 'drug_knowledge', 'Kiến thức về thuốc, tác dụng phụ, tương tác', 'CubeIcon', 'purple'
    WHERE NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'drug_knowledge');
    
    INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
    SELECT 'Case Studies', 'case_studies', 'Phân tích các trường hợp ADR thực tế', 'DocumentTextIcon', 'orange'
    WHERE NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'case_studies');
    
    INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
    SELECT 'Regulations', 'regulations', 'Quy định pháp lý về ADR tại Việt Nam', 'ScaleIcon', 'red'
    WHERE NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'regulations');
    
    INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
    SELECT 'General ADR', 'general', 'Kiến thức tổng quan về Pharmacovigilance', 'BookOpenIcon', 'gray'
    WHERE NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'general');
    
    RAISE NOTICE 'Categories setup completed';
END $$;

-- Add essential questions for each category  
INSERT INTO quiz_questions (
    category_id,
    question_text,
    difficulty,
    options,
    correct_answer,
    explanation,
    points_value,
    is_active,
    review_status
) VALUES
-- WHO-UMC Questions (5 questions)
(
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Theo thang đánh giá WHO-UMC, mối liên quan "Chắc chắn" (Certain) yêu cầu những tiêu chuẩn nào?',
    'beginner',
    '[{"key": "A", "text": "Chỉ cần có mối liên hệ thời gian hợp lý"}, {"key": "B", "text": "Phải có tái sử dụng thuốc với kết quả dương tính"}, {"key": "C", "text": "Cần có tất cả 5 tiêu chuẩn: thời gian, không thể giải thích khác, cải thiện khi ngừng, phản ứng đã biết, tái xuất hiện"}, {"key": "D", "text": "Chỉ cần bác sĩ xác nhận"}]'::jsonb,
    'C',
    'Theo WHO-UMC, mối liên quan "Chắc chắn" yêu cầu thỏa mãn tất cả 5 tiêu chuẩn.',
    10,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Mức độ "Có khả năng" (Probable) trong thang WHO-UMC khác với "Chắc chắn" như thế nào?',
    'intermediate',
    '[{"key": "A", "text": "Không cần có thông tin về tái sử dụng thuốc"}, {"key": "B", "text": "Chỉ cần 3 tiêu chuẩn thay vì 5"}, {"key": "C", "text": "Không cần cải thiện khi ngừng thuốc"}, {"key": "D", "text": "Tất cả các đáp án trên"}]'::jsonb,
    'A',
    'Mức độ "Có khả năng" không yêu cầu thông tin về tái sử dụng thuốc (rechallenge).',
    15,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'WHO-UMC có bao nhiều mức độ đánh giá mối liên quan thuốc-ADR?',
    'beginner',
    '[{"key": "A", "text": "4 mức độ"}, {"key": "B", "text": "5 mức độ"}, {"key": "C", "text": "6 mức độ"}, {"key": "D", "text": "7 mức độ"}]'::jsonb,
    'C',
    'WHO-UMC có 6 mức độ: Certain, Probable, Possible, Unlikely, Conditional, Unassessable.',
    10,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Mức "Unlikely" trong WHO-UMC có nghĩa là gì?',
    'advanced',
    '[{"key": "A", "text": "Không có mối liên quan"}, {"key": "B", "text": "Mối liên quan khó có thể xảy ra"}, {"key": "C", "text": "Cần thêm thông tin"}, {"key": "D", "text": "Chưa thể đánh giá"}]'::jsonb,
    'B',
    '"Unlikely" có nghĩa là mối liên quan giữa thuốc và ADR là khó có thể xảy ra.',
    20,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Thang WHO-UMC được sử dụng để đánh giá điều gì?',
    'beginner',
    '[{"key": "A", "text": "Mức độ nghiêm trọng của ADR"}, {"key": "B", "text": "Mối liên quan nhân quả giữa thuốc và ADR"}, {"key": "C", "text": "Tần suất xuất hiện ADR"}, {"key": "D", "text": "Chi phí điều trị ADR"}]'::jsonb,
    'B',
    'WHO-UMC được dùng để đánh giá mối liên quan nhân quả giữa thuốc và phản ứng có hại.',
    10,
    true,
    'approved'
),

-- Naranjo Questions (5 questions)
(
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Tổng điểm Naranjo từ 5-8 điểm được phân loại là mức độ nào?',
    'beginner',
    '[{"key": "A", "text": "Chắc chắn (Definite)"}, {"key": "B", "text": "Có khả năng (Probable)"}, {"key": "C", "text": "Có thể (Possible)"}, {"key": "D", "text": "Nghi ngờ (Doubtful)"}]'::jsonb,
    'B',
    'Thang điểm Naranjo: ≥9 = Definite, 5-8 = Probable, 1-4 = Possible, ≤0 = Doubtful.',
    10,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Thang Naranjo có tổng cộng bao nhiều câu hỏi?',
    'beginner',
    '[{"key": "A", "text": "8 câu hỏi"}, {"key": "B", "text": "10 câu hỏi"}, {"key": "C", "text": "12 câu hỏi"}, {"key": "D", "text": "15 câu hỏi"}]'::jsonb,
    'B',
    'Thang đánh giá Naranjo có 10 câu hỏi với thang điểm từ -4 đến +13.',
    10,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Câu hỏi "Phản ứng có xuất hiện sau khi điều trị bằng thuốc nghi ngờ không?" trong Naranjo được chấm điểm như thế nào?',
    'intermediate',
    '[{"key": "A", "text": "Có: +1, Không: 0, Không rõ: 0"}, {"key": "B", "text": "Có: +2, Không: -1, Không rõ: 0"}, {"key": "C", "text": "Có: +3, Không: 0, Không rõ: -1"}, {"key": "D", "text": "Tất cả đều được +1 điểm"}]'::jsonb,
    'B',
    'Câu hỏi về thời gian xuất hiện: Có = +2 điểm, Không = -1 điểm, Không rõ = 0 điểm.',
    15,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Điểm số cao nhất có thể đạt được trong thang Naranjo là bao nhiêu?',
    'advanced',
    '[{"key": "A", "text": "+10 điểm"}, {"key": "B", "text": "+12 điểm"}, {"key": "C", "text": "+13 điểm"}, {"key": "D", "text": "+15 điểm"}]'::jsonb,
    'C',
    'Điểm số Naranjo dao động từ -4 đến +13, với +13 là điểm cao nhất.',
    20,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Thang Naranjo được công bố lần đầu vào năm nào?',
    'expert',
    '[{"key": "A", "text": "1979"}, {"key": "B", "text": "1981"}, {"key": "C", "text": "1983"}, {"key": "D", "text": "1985"}]'::jsonb,
    'B',
    'Thang Naranjo được Naranjo và cộng sự công bố trong Clin Pharmacol Ther năm 1981.',
    25,
    true,
    'approved'
),

-- Drug Knowledge Questions (5 questions)
(
    (SELECT id FROM quiz_categories WHERE category_key = 'drug_knowledge' LIMIT 1),
    'Penicillin G có khả năng cao gây phản ứng dị ứng nào sau đây?',
    'beginner',
    '[{"key": "A", "text": "Phát ban, mày đay"}, {"key": "B", "text": "Sốc phản vệ"}, {"key": "C", "text": "Viêm da tiếp xúc"}, {"key": "D", "text": "Tất cả các phản ứng trên"}]'::jsonb,
    'D',
    'Penicillin G có thể gây tất cả các loại phản ứng dị ứng từ nhẹ đến nặng.',
    10,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'drug_knowledge' LIMIT 1),
    'Thuốc nào sau đây có nguy cơ cao gây viêm gan do thuốc?',
    'intermediate',
    '[{"key": "A", "text": "Paracetamol liều cao"}, {"key": "B", "text": "Isoniazid"}, {"key": "C", "text": "Phenytoin"}, {"key": "D", "text": "Tất cả các thuốc trên"}]'::jsonb,
    'D',
    'Tất cả các thuốc được liệt kê đều có nguy cơ cao gây viêm gan do thuốc.',
    15,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'drug_knowledge' LIMIT 1),
    'Warfarin có thể gây ADR nghiêm trọng nào sau đây?',
    'intermediate',
    '[{"key": "A", "text": "Chảy máu não"}, {"key": "B", "text": "Chảy máu tiêu hóa"}, {"key": "C", "text": "Hoại tử da"}, {"key": "D", "text": "Tất cả đáp án trên"}]'::jsonb,
    'D',
    'Warfarin có thể gây nhiều loại chảy máu nghiêm trọng và hoại tử da hiếm gặp.',
    15,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'drug_knowledge' LIMIT 1),
    'Aminoglycosides (như Gentamicin) có nguy cơ cao gây độc tính nào?',
    'advanced',
    '[{"key": "A", "text": "Độc thận"}, {"key": "B", "text": "Độc tai"}, {"key": "C", "text": "Cả A và B"}, {"key": "D", "text": "Độc gan"}]'::jsonb,
    'C',
    'Aminoglycosides có nguy cơ cao gây độc thận (nephrotoxicity) và độc tai (ototoxicity).',
    20,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'drug_knowledge' LIMIT 1),
    'Vancomycin có thể gây "Red man syndrome" khi nào?',
    'advanced',
    '[{"key": "A", "text": "Khi dùng liều quá cao"}, {"key": "B", "text": "Khi truyền quá nhanh"}, {"key": "C", "text": "Khi dùng đường uống"}, {"key": "D", "text": "Khi ngừng thuốc đột ngột"}]'::jsonb,
    'B',
    '"Red man syndrome" xảy ra khi truyền Vancomycin quá nhanh, gây giải phóng histamine.',
    20,
    true,
    'approved'
),

-- Case Studies Questions (5 questions)
(
    (SELECT id FROM quiz_categories WHERE category_key = 'case_studies' LIMIT 1),
    'Một bệnh nhân 45 tuổi uống Aspirin 500mg và sau 30 phút bị khó thở, phát ban toàn thân. Đây có khả năng là phản ứng gì?',
    'intermediate',
    '[{"key": "A", "text": "Phản ứng dị ứng type I (IgE-mediated)"}, {"key": "B", "text": "Phản ứng dị ứng type IV (T-cell mediated)"}, {"key": "C", "text": "Tác dụng phụ thường gặp của Aspirin"}, {"key": "D", "text": "Nhiễm trùng đường hô hấp"}]'::jsonb,
    'A',
    'Triệu chứng xuất hiện nhanh (30 phút) với khó thở và phát ban là dấu hiệu điển hình của phản ứng dị ứng type I.',
    20,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'case_studies' LIMIT 1),
    'Bệnh nhân uống Warfarin, INR = 8.5, xuất hiện chảy máu não. Theo WHO-UMC, mối liên quan được đánh giá là?',
    'advanced',
    '[{"key": "A", "text": "Certain (Chắc chắn)"}, {"key": "B", "text": "Probable (Có khả năng)"}, {"key": "C", "text": "Possible (Có thể)"}, {"key": "D", "text": "Unlikely (Không chắc chắn)"}]'::jsonb,
    'A',
    'Đây là "Certain" vì có bằng chứng khách quan (INR cao) và chảy máu là ADR đã biết của Warfarin.',
    25,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'case_studies' LIMIT 1),
    'Bệnh nhân dùng Phenytoin, xuất hiện sốt, phát ban, hạch to sau 3 tuần. Chẩn đoán có khả năng là?',
    'advanced',
    '[{"key": "A", "text": "Nhiễm trùng virus"}, {"key": "B", "text": "DRESS syndrome"}, {"key": "C", "text": "Stevens-Johnson syndrome"}, {"key": "D", "text": "Lupus do thuốc"}]'::jsonb,
    'B',
    'DRESS (Drug Reaction with Eosinophilia and Systemic Symptoms) syndrome điển hình với Phenytoin.',
    25,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'case_studies' LIMIT 1),
    'Bệnh nhân dùng ACE inhibitor, ho khan kéo dài. Cơ chế nào giải thích ADR này?',
    'intermediate',
    '[{"key": "A", "text": "Tích tụ bradykinin"}, {"key": "B", "text": "Phản ứng dị ứng"}, {"key": "C", "text": "Độc tính trực tiếp"}, {"key": "D", "text": "Tương tác thuốc"}]'::jsonb,
    'A',
    'ACE inhibitor ngăn phá hủy bradykinin, gây kích ứng đường hô hấp và ho khan.',
    20,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'case_studies' LIMIT 1),
    'Người già dùng Digoxin, xuất hiện buồn nôn, nhìn vàng, rối loạn nhịp. Nguyên nhân có thể là?',
    'intermediate',
    '[{"key": "A", "text": "Liều quá thấp"}, {"key": "B", "text": "Ngộ độc Digoxin"}, {"key": "C", "text": "Tương tác với thức ăn"}, {"key": "D", "text": "Dị ứng thuốc"}]'::jsonb,
    'B',
    'Triệu chứng tiêu hóa, thị giác và tim mạch là dấu hiệu điển hình của ngộ độc Digoxin.',
    20,
    true,
    'approved'
),

-- Regulations Questions (5 questions)
(
    (SELECT id FROM quiz_categories WHERE category_key = 'regulations' LIMIT 1),
    'Theo quy định của Việt Nam, ai có trách nhiệm báo cáo ADR?',
    'beginner',
    '[{"key": "A", "text": "Chỉ có bác sĩ"}, {"key": "B", "text": "Chỉ có dược sĩ"}, {"key": "C", "text": "Tất cả nhân viên y tế"}, {"key": "D", "text": "Chỉ có Trung tâm Quốc gia về Thông tin thuốc và ADR"}]'::jsonb,
    'C',
    'Theo Thông tư 07/2018/TT-BYT, tất cả nhân viên y tế đều có trách nhiệm báo cáo ADR.',
    10,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'regulations' LIMIT 1),
    'Thời hạn báo cáo ADR nghiêm trọng tới Trung tâm Quốc gia là bao lâu?',
    'intermediate',
    '[{"key": "A", "text": "24 giờ"}, {"key": "B", "text": "48 giờ"}, {"key": "C", "text": "72 giờ"}, {"key": "D", "text": "7 ngày"}]'::jsonb,
    'C',
    'Theo Thông tư 07/2018/TT-BYT, ADR nghiêm trọng phải báo cáo trong 72 giờ.',
    15,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'regulations' LIMIT 1),
    'ADR không nghiêm trọng phải được báo cáo trong thời gian bao lâu?',
    'intermediate',
    '[{"key": "A", "text": "7 ngày"}, {"key": "B", "text": "15 ngày"}, {"key": "C", "text": "30 ngày"}, {"key": "D", "text": "60 ngày"}]'::jsonb,
    'B',
    'ADR không nghiêm trọng có thể báo cáo trong vòng 15 ngày.',
    15,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'regulations' LIMIT 1),
    'Thông tư nào quy định về báo cáo ADR tại Việt Nam?',
    'beginner',
    '[{"key": "A", "text": "Thông tư 07/2018/TT-BYT"}, {"key": "B", "text": "Thông tư 15/2018/TT-BYT"}, {"key": "C", "text": "Thông tư 20/2019/TT-BYT"}, {"key": "D", "text": "Thông tư 25/2020/TT-BYT"}]'::jsonb,
    'A',
    'Thông tư 07/2018/TT-BYT quy định về hoạt động dược cảnh báo và báo cáo ADR.',
    10,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'regulations' LIMIT 1),
    'Cơ quan nào chịu trách nhiệm thu thập và phân tích ADR ở Việt Nam?',
    'beginner',
    '[{"key": "A", "text": "Bộ Y tế"}, {"key": "B", "text": "Trung tâm Quốc gia về Thông tin thuốc và ADR"}, {"key": "C", "text": "Cục Quản lý Dược"}, {"key": "D", "text": "Tất cả đáp án trên"}]'::jsonb,
    'B',
    'Trung tâm Quốc gia về Thông tin thuốc và ADR là đơn vị chuyên trách về dược cảnh báo.',
    10,
    true,
    'approved'
),

-- General ADR Questions (5 questions)
(
    (SELECT id FROM quiz_categories WHERE category_key = 'general' LIMIT 1),
    'Định nghĩa ADR (Adverse Drug Reaction) theo WHO là gì?',
    'beginner',
    '[{"key": "A", "text": "Bất kỳ tác dụng có hại nào của thuốc"}, {"key": "B", "text": "Phản ứng có hại, không mong muốn xảy ra ở liều điều trị bình thường"}, {"key": "C", "text": "Chỉ bao gồm phản ứng dị ứng"}, {"key": "D", "text": "Chỉ xảy ra khi dùng thuốc quá liều"}]'::jsonb,
    'B',
    'Theo WHO, ADR là phản ứng có hại và không mong muốn ở liều điều trị bình thường.',
    10,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'general' LIMIT 1),
    'Pharmacovigilance là gì?',
    'beginner',
    '[{"key": "A", "text": "Chỉ là việc thu thập báo cáo ADR"}, {"key": "B", "text": "Khoa học và hoạt động liên quan đến phát hiện, đánh giá, hiểu biết và phòng ngừa tác dụng bất lợi của thuốc"}, {"key": "C", "text": "Chỉ áp dụng cho thuốc mới"}, {"key": "D", "text": "Chỉ do công ty dược phẩm thực hiện"}]'::jsonb,
    'B',
    'Pharmacovigilance là khoa học toàn diện về an toàn thuốc, không chỉ thu thập báo cáo.',
    10,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'general' LIMIT 1),
    'Phản ứng ADR type A (Augmented) có đặc điểm gì?',
    'intermediate',
    '[{"key": "A", "text": "Không thể dự đoán được"}, {"key": "B", "text": "Liều-phụ thuộc và có thể dự đoán"}, {"key": "C", "text": "Chỉ xảy ra ở người dị ứng"}, {"key": "D", "text": "Luôn nghiêm trọng"}]'::jsonb,
    'B',
    'ADR type A là liều-phụ thuộc, có thể dự đoán dựa trên tác dụng dược lý của thuốc.',
    15,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'general' LIMIT 1),
    'Phản ứng ADR type B (Bizarre) có đặc điểm gì?',
    'intermediate',
    '[{"key": "A", "text": "Liều-phụ thuộc"}, {"key": "B", "text": "Có thể dự đoán được"}, {"key": "C", "text": "Không liều-phụ thuộc và không thể dự đoán"}, {"key": "D", "text": "Chỉ xảy ra với liều cao"}]'::jsonb,
    'C',
    'ADR type B không liền quan đến liều và khó dự đoán, thường do đặc điểm cá thể.',
    15,
    true,
    'approved'
), (
    (SELECT id FROM quiz_categories WHERE category_key = 'general' LIMIT 1),
    'Mục đích chính của hệ thống dược cảnh báo là gì?',
    'beginner',
    '[{"key": "A", "text": "Tăng doanh thu cho công ty dược"}, {"key": "B", "text": "Giảm chi phí y tế"}, {"key": "C", "text": "Đảm bảo an toàn và hiệu quả của thuốc"}, {"key": "D", "text": "Thay thế thử nghiệm lâm sàng"}]'::jsonb,
    'C',
    'Mục đích chính của pharmacovigilance là đảm bảo sử dụng thuốc an toàn và hiệu quả.',
    10,
    true,
    'approved'
);

-- Update category question counts
UPDATE quiz_categories SET total_questions = (
    SELECT COUNT(*) FROM quiz_questions 
    WHERE quiz_questions.category_id = quiz_categories.id 
    AND is_active = true
    AND review_status = 'approved'
);

-- Verify the setup
SELECT 
  c.name as category_name,
  c.category_key,
  c.total_questions,
  COUNT(q.id) as actual_questions
FROM quiz_categories c
LEFT JOIN quiz_questions q ON c.id = q.category_id 
  AND q.is_active = true 
  AND q.review_status = 'approved'
GROUP BY c.id, c.name, c.category_key, c.total_questions
ORDER BY c.name;
