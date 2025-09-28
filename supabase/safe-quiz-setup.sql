-- Safe Quiz Database Setup
-- This version avoids all ON CONFLICT issues

-- Step 1: Create tables only if they don't exist
CREATE TABLE IF NOT EXISTS quiz_categories (
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

CREATE TABLE IF NOT EXISTS quiz_questions (
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

CREATE TABLE IF NOT EXISTS quiz_sessions (
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

CREATE TABLE IF NOT EXISTS quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id),
    selected_answer VARCHAR(10),
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    time_taken_seconds INTEGER,
    was_skipped BOOLEAN DEFAULT false,
    hint_used BOOLEAN DEFAULT false,
    explanation_viewed BOOLEAN DEFAULT false,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Step 2: Insert categories safely
DO $$
DECLARE
    who_umc_id UUID;
    naranjo_id UUID;
    drug_knowledge_id UUID;
    case_studies_id UUID;
    regulations_id UUID;
    general_id UUID;
BEGIN
    -- Insert WHO-UMC category
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'who_umc') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
        VALUES ('WHO-UMC Assessment', 'who_umc', 'Câu hỏi về thang đánh giá WHO-UMC cho mối liên quan thuốc-ADR', 'BeakerIcon', 'blue');
    END IF;
    
    -- Insert Naranjo category
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'naranjo') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
        VALUES ('Naranjo Scale', 'naranjo', 'Câu hỏi về thang điểm Naranjo và ứng dụng', 'CalculatorIcon', 'green');
    END IF;
    
    -- Insert Drug Knowledge category
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'drug_knowledge') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
        VALUES ('Drug Knowledge', 'drug_knowledge', 'Kiến thức về thuốc, tác dụng phụ, tương tác', 'CubeIcon', 'purple');
    END IF;
    
    -- Insert Case Studies category
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'case_studies') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
        VALUES ('Case Studies', 'case_studies', 'Phân tích các trường hợp ADR thực tế', 'DocumentTextIcon', 'orange');
    END IF;
    
    -- Insert Regulations category
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'regulations') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
        VALUES ('Regulations', 'regulations', 'Quy định pháp lý về ADR tại Việt Nam', 'ScaleIcon', 'red');
    END IF;
    
    -- Insert General ADR category
    IF NOT EXISTS (SELECT 1 FROM quiz_categories WHERE category_key = 'general') THEN
        INSERT INTO quiz_categories (name, category_key, description, icon_name, color_scheme) 
        VALUES ('General ADR', 'general', 'Kiến thức tổng quan về Pharmacovigilance', 'BookOpenIcon', 'gray');
    END IF;
    
    RAISE NOTICE 'Categories created successfully';
    
    -- Get category IDs for inserting questions
    SELECT id INTO who_umc_id FROM quiz_categories WHERE category_key = 'who_umc';
    SELECT id INTO naranjo_id FROM quiz_categories WHERE category_key = 'naranjo';
    SELECT id INTO drug_knowledge_id FROM quiz_categories WHERE category_key = 'drug_knowledge';
    SELECT id INTO case_studies_id FROM quiz_categories WHERE category_key = 'case_studies';
    SELECT id INTO regulations_id FROM quiz_categories WHERE category_key = 'regulations';
    SELECT id INTO general_id FROM quiz_categories WHERE category_key = 'general';
    
    -- Insert sample questions (only if no questions exist for each category)
    
    -- WHO-UMC Questions
    IF NOT EXISTS (SELECT 1 FROM quiz_questions WHERE category_id = who_umc_id) THEN
        INSERT INTO quiz_questions (category_id, question_text, difficulty, options, correct_answer, explanation, points_value, is_active, review_status) VALUES
        (who_umc_id, 'Theo thang đánh giá WHO-UMC, mối liên quan "Chắc chắn" (Certain) yêu cầu những tiêu chuẩn nào?', 'beginner', '[{"key": "A", "text": "Chỉ cần có mối liên hệ thời gian hợp lý"}, {"key": "B", "text": "Phải có tái sử dụng thuốc với kết quả dương tính"}, {"key": "C", "text": "Cần có tất cả 5 tiêu chuẩn: thời gian, không thể giải thích khác, cải thiện khi ngừng, phản ứng đã biết, tái xuất hiện"}, {"key": "D", "text": "Chỉ cần bác sĩ xác nhận"}]'::jsonb, 'C', 'Theo WHO-UMC, mối liên quan "Chắc chắn" yêu cầu thỏa mãn tất cả 5 tiêu chuẩn.', 10, true, 'approved'),
        (who_umc_id, 'WHO-UMC có bao nhiều mức độ đánh giá mối liên quan thuốc-ADR?', 'beginner', '[{"key": "A", "text": "4 mức độ"}, {"key": "B", "text": "5 mức độ"}, {"key": "C", "text": "6 mức độ"}, {"key": "D", "text": "7 mức độ"}]'::jsonb, 'C', 'WHO-UMC có 6 mức độ: Certain, Probable, Possible, Unlikely, Conditional, Unassessable.', 10, true, 'approved'),
        (who_umc_id, 'Mức độ "Có khả năng" (Probable) trong thang WHO-UMC khác với "Chắc chắn" như thế nào?', 'intermediate', '[{"key": "A", "text": "Không cần có thông tin về tái sử dụng thuốc"}, {"key": "B", "text": "Chỉ cần 3 tiêu chuẩn thay vì 5"}, {"key": "C", "text": "Không cần cải thiện khi ngừng thuốc"}, {"key": "D", "text": "Tất cả các đáp án trên"}]'::jsonb, 'A', 'Mức độ "Có khả năng" không yêu cầu thông tin về tái sử dụng thuốc (rechallenge).', 15, true, 'approved');
    END IF;
    
    -- Naranjo Questions
    IF NOT EXISTS (SELECT 1 FROM quiz_questions WHERE category_id = naranjo_id) THEN
        INSERT INTO quiz_questions (category_id, question_text, difficulty, options, correct_answer, explanation, points_value, is_active, review_status) VALUES
        (naranjo_id, 'Tổng điểm Naranjo từ 5-8 điểm được phân loại là mức độ nào?', 'beginner', '[{"key": "A", "text": "Chắc chắn (Definite)"}, {"key": "B", "text": "Có khả năng (Probable)"}, {"key": "C", "text": "Có thể (Possible)"}, {"key": "D", "text": "Nghi ngờ (Doubtful)"}]'::jsonb, 'B', 'Thang điểm Naranjo: ≥9 = Definite, 5-8 = Probable, 1-4 = Possible, ≤0 = Doubtful.', 10, true, 'approved'),
        (naranjo_id, 'Thang Naranjo có tổng cộng bao nhiều câu hỏi?', 'beginner', '[{"key": "A", "text": "8 câu hỏi"}, {"key": "B", "text": "10 câu hỏi"}, {"key": "C", "text": "12 câu hỏi"}, {"key": "D", "text": "15 câu hỏi"}]'::jsonb, 'B', 'Thang đánh giá Naranjo có 10 câu hỏi với thang điểm từ -4 đến +13.', 10, true, 'approved'),
        (naranjo_id, 'Điểm số cao nhất có thể đạt được trong thang Naranjo là bao nhiêu?', 'advanced', '[{"key": "A", "text": "+10 điểm"}, {"key": "B", "text": "+12 điểm"}, {"key": "C", "text": "+13 điểm"}, {"key": "D", "text": "+15 điểm"}]'::jsonb, 'C', 'Điểm số Naranjo dao động từ -4 đến +13, với +13 là điểm cao nhất.', 20, true, 'approved');
    END IF;
    
    -- Drug Knowledge Questions
    IF NOT EXISTS (SELECT 1 FROM quiz_questions WHERE category_id = drug_knowledge_id) THEN
        INSERT INTO quiz_questions (category_id, question_text, difficulty, options, correct_answer, explanation, points_value, is_active, review_status) VALUES
        (drug_knowledge_id, 'Penicillin G có khả năng cao gây phản ứng dị ứng nào sau đây?', 'beginner', '[{"key": "A", "text": "Phát ban, mày đay"}, {"key": "B", "text": "Sốc phản vệ"}, {"key": "C", "text": "Viêm da tiếp xúc"}, {"key": "D", "text": "Tất cả các phản ứng trên"}]'::jsonb, 'D', 'Penicillin G có thể gây tất cả các loại phản ứng dị ứng từ nhẹ đến nặng.', 10, true, 'approved'),
        (drug_knowledge_id, 'Warfarin có thể gây ADR nghiêm trọng nào sau đây?', 'intermediate', '[{"key": "A", "text": "Chảy máu não"}, {"key": "B", "text": "Chảy máu tiêu hóa"}, {"key": "C", "text": "Hoại tử da"}, {"key": "D", "text": "Tất cả đáp án trên"}]'::jsonb, 'D', 'Warfarin có thể gây nhiều loại chảy máu nghiêm trọng và hoại tử da hiếm gặp.', 15, true, 'approved'),
        (drug_knowledge_id, 'Aminoglycosides (như Gentamicin) có nguy cơ cao gây độc tính nào?', 'advanced', '[{"key": "A", "text": "Độc thận"}, {"key": "B", "text": "Độc tai"}, {"key": "C", "text": "Cả A và B"}, {"key": "D", "text": "Độc gan"}]'::jsonb, 'C', 'Aminoglycosides có nguy cơ cao gây độc thận (nephrotoxicity) và độc tai (ototoxicity).', 20, true, 'approved');
    END IF;
    
    -- Case Studies Questions
    IF NOT EXISTS (SELECT 1 FROM quiz_questions WHERE category_id = case_studies_id) THEN
        INSERT INTO quiz_questions (category_id, question_text, difficulty, options, correct_answer, explanation, points_value, is_active, review_status) VALUES
        (case_studies_id, 'Một bệnh nhân 45 tuổi uống Aspirin 500mg và sau 30 phút bị khó thở, phát ban toàn thân. Đây có khả năng là phản ứng gì?', 'intermediate', '[{"key": "A", "text": "Phản ứng dị ứng type I (IgE-mediated)"}, {"key": "B", "text": "Phản ứng dị ứng type IV (T-cell mediated)"}, {"key": "C", "text": "Tác dụng phụ thường gặp của Aspirin"}, {"key": "D", "text": "Nhiễm trùng đường hô hấp"}]'::jsonb, 'A', 'Triệu chứng xuất hiện nhanh (30 phút) với khó thở và phát ban là dấu hiệu điển hình của phản ứng dị ứng type I.', 20, true, 'approved'),
        (case_studies_id, 'Bệnh nhân uống Warfarin, INR = 8.5, xuất hiện chảy máu não. Theo WHO-UMC, mối liên quan được đánh giá là?', 'advanced', '[{"key": "A", "text": "Certain (Chắc chắn)"}, {"key": "B", "text": "Probable (Có khả năng)"}, {"key": "C", "text": "Possible (Có thể)"}, {"key": "D", "text": "Unlikely (Không chắc chắn)"}]'::jsonb, 'A', 'Đây là "Certain" vì có bằng chứng khách quan (INR cao) và chảy máu là ADR đã biết của Warfarin.', 25, true, 'approved'),
        (case_studies_id, 'Người già dùng Digoxin, xuất hiện buồn nôn, nhìn vàng, rối loạn nhịp. Nguyên nhân có thể là?', 'intermediate', '[{"key": "A", "text": "Liều quá thấp"}, {"key": "B", "text": "Ngộ độc Digoxin"}, {"key": "C", "text": "Tương tác với thức ăn"}, {"key": "D", "text": "Dị ứng thuốc"}]'::jsonb, 'B', 'Triệu chứng tiêu hóa, thị giác và tim mạch là dấu hiệu điển hình của ngộ độc Digoxin.', 20, true, 'approved');
    END IF;
    
    -- Regulations Questions
    IF NOT EXISTS (SELECT 1 FROM quiz_questions WHERE category_id = regulations_id) THEN
        INSERT INTO quiz_questions (category_id, question_text, difficulty, options, correct_answer, explanation, points_value, is_active, review_status) VALUES
        (regulations_id, 'Theo quy định của Việt Nam, ai có trách nhiệm báo cáo ADR?', 'beginner', '[{"key": "A", "text": "Chỉ có bác sĩ"}, {"key": "B", "text": "Chỉ có dược sĩ"}, {"key": "C", "text": "Tất cả nhân viên y tế"}, {"key": "D", "text": "Chỉ có Trung tâm Quốc gia về Thông tin thuốc và ADR"}]'::jsonb, 'C', 'Theo Thông tư 07/2018/TT-BYT, tất cả nhân viên y tế đều có trách nhiệm báo cáo ADR.', 10, true, 'approved'),
        (regulations_id, 'Thời hạn báo cáo ADR nghiêm trọng tới Trung tâm Quốc gia là bao lâu?', 'intermediate', '[{"key": "A", "text": "24 giờ"}, {"key": "B", "text": "48 giờ"}, {"key": "C", "text": "72 giờ"}, {"key": "D", "text": "7 ngày"}]'::jsonb, 'C', 'Theo Thông tư 07/2018/TT-BYT, ADR nghiêm trọng phải báo cáo trong 72 giờ.', 15, true, 'approved'),
        (regulations_id, 'Thông tư nào quy định về báo cáo ADR tại Việt Nam?', 'beginner', '[{"key": "A", "text": "Thông tư 07/2018/TT-BYT"}, {"key": "B", "text": "Thông tư 15/2018/TT-BYT"}, {"key": "C", "text": "Thông tư 20/2019/TT-BYT"}, {"key": "D", "text": "Thông tư 25/2020/TT-BYT"}]'::jsonb, 'A', 'Thông tư 07/2018/TT-BYT quy định về hoạt động dược cảnh báo và báo cáo ADR.', 10, true, 'approved');
    END IF;
    
    -- General ADR Questions
    IF NOT EXISTS (SELECT 1 FROM quiz_questions WHERE category_id = general_id) THEN
        INSERT INTO quiz_questions (category_id, question_text, difficulty, options, correct_answer, explanation, points_value, is_active, review_status) VALUES
        (general_id, 'Định nghĩa ADR (Adverse Drug Reaction) theo WHO là gì?', 'beginner', '[{"key": "A", "text": "Bất kỳ tác dụng có hại nào của thuốc"}, {"key": "B", "text": "Phản ứng có hại, không mong muốn xảy ra ở liều điều trị bình thường"}, {"key": "C", "text": "Chỉ bao gồm phản ứng dị ứng"}, {"key": "D", "text": "Chỉ xảy ra khi dùng thuốc quá liều"}]'::jsonb, 'B', 'Theo WHO, ADR là phản ứng có hại và không mong muốn ở liều điều trị bình thường.', 10, true, 'approved'),
        (general_id, 'Pharmacovigilance là gì?', 'beginner', '[{"key": "A", "text": "Chỉ là việc thu thập báo cáo ADR"}, {"key": "B", "text": "Khoa học và hoạt động liên quan đến phát hiện, đánh giá, hiểu biết và phòng ngừa tác dụng bất lợi của thuốc"}, {"key": "C", "text": "Chỉ áp dụng cho thuốc mới"}, {"key": "D", "text": "Chỉ do công ty dược phẩm thực hiện"}]'::jsonb, 'B', 'Pharmacovigilance là khoa học toàn diện về an toàn thuốc, không chỉ thu thập báo cáo.', 10, true, 'approved'),
        (general_id, 'Mục đích chính của hệ thống dược cảnh báo là gì?', 'beginner', '[{"key": "A", "text": "Tăng doanh thu cho công ty dược"}, {"key": "B", "text": "Giảm chi phí y tế"}, {"key": "C", "text": "Đảm bảo an toàn và hiệu quả của thuốc"}, {"key": "D", "text": "Thay thế thử nghiệm lâm sàng"}]'::jsonb, 'C', 'Mục đích chính của pharmacovigilance là đảm bảo sử dụng thuốc an toàn và hiệu quả.', 10, true, 'approved');
    END IF;
    
    RAISE NOTICE 'Sample questions inserted successfully';
END $$;

-- Step 3: Update category question counts
UPDATE quiz_categories SET total_questions = (
    SELECT COUNT(*) FROM quiz_questions 
    WHERE quiz_questions.category_id = quiz_categories.id 
    AND is_active = true
    AND review_status = 'approved'
);

-- Step 4: Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Setup verification:';
END $$;

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
