-- Template để thêm câu hỏi mới vào hệ thống ADR Training Quiz
-- Sử dụng template này làm mẫu để tạo các câu hỏi mới

-- 1. MULTIPLE CHOICE QUESTION TEMPLATE
INSERT INTO quiz_questions (
    category_id,
    question_text,
    question_type,
    difficulty,
    options,
    correct_answer,
    explanation,
    reference_source,
    learning_points,
    estimated_time_seconds,
    points_value,
    is_active,
    review_status
) VALUES (
    -- THAY ĐỔI: Chọn category_id tương ứng
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1), -- who_umc, naranjo, drug_knowledge, case_studies, regulations, general
    
    -- THAY ĐỔI: Nội dung câu hỏi
    'Theo thang đánh giá WHO-UMC, điều kiện nào sau đây KHÔNG cần thiết cho mức độ "Possible"?',
    
    -- THAY ĐỔI: Loại câu hỏi 
    'multiple_choice', -- multiple_choice, true_false, case_scenario
    
    -- THAY ĐỔI: Độ khó
    'intermediate', -- beginner, intermediate, advanced, expert
    
    -- THAY ĐỔI: Các đáp án (format JSON)
    '[
        {"key": "A", "text": "Mối liên hệ thời gian hợp lý"},
        {"key": "B", "text": "Cải thiện khi ngừng thuốc (dechallenge positive)"},
        {"key": "C", "text": "Tái xuất hiện khi dùng lại thuốc (rechallenge positive)"},
        {"key": "D", "text": "Không có nguyên nhân khác rõ ràng"}
    ]'::jsonb,
    
    -- THAY ĐỔI: Đáp án đúng
    'C',
    
    -- THAY ĐỔI: Giải thích chi tiết
    'Mức độ "Possible" trong thang WHO-UMC chỉ yêu cầu: (1) Mối liên hệ thời gian hợp lý và (2) Có thể có nguyên nhân khác. KHÔNG yêu cầu dechallenge positive hay rechallenge positive như các mức độ cao hơn.',
    
    -- THAY ĐỔI: Nguồn tham khảo
    'WHO-UMC Causality Assessment Guidelines',
    
    -- THAY ĐỔI: Điểm học tập chính (Array)
    ARRAY['Possible chỉ cần thời gian hợp lý', 'Không cần dechallenge/rechallenge', 'Mức độ thấp nhất có thể báo cáo'],
    
    -- THAY ĐỔI: Thời gian ước tính (giây)
    75,
    
    -- THAY ĐỔI: Điểm số (dựa theo độ khó: beginner=10, intermediate=15, advanced=20, expert=25)
    15,
    
    true,
    'approved'
);

-- 2. TRUE/FALSE QUESTION TEMPLATE  
INSERT INTO quiz_questions (
    category_id,
    question_text,
    question_type,
    difficulty,
    options,
    correct_answer,
    explanation,
    reference_source,
    learning_points,
    estimated_time_seconds,
    points_value,
    is_active,
    review_status
) VALUES (
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Thang điểm Naranjo có thể áp dụng cho tất cả các loại phản ứng có hại của thuốc, không chỉ phản ứng dị ứng.',
    'true_false',
    'beginner',
    '[
        {"key": "true", "text": "Đúng"},
        {"key": "false", "text": "Sai"}
    ]'::jsonb,
    'true',
    'Đúng. Thang điểm Naranjo là một công cụ tổng quát để đánh giá mối liên quan nhân-quả giữa thuốc và bất kỳ phản ứng có hại nào, không giới hạn chỉ ở phản ứng dị ứng.',
    'Naranjo CA, et al. Clin Pharmacol Ther. 1981',
    ARRAY['Naranjo áp dụng rộng rãi', 'Không chỉ dị ứng', 'Công cụ đánh giá tổng quát'],
    45,
    10,
    true,
    'approved'
);

-- 3. CASE SCENARIO QUESTION TEMPLATE
INSERT INTO quiz_questions (
    category_id,
    question_text,
    question_type,
    difficulty,
    options,
    correct_answer,
    explanation,
    reference_source,
    learning_points,
    estimated_time_seconds,
    points_value,
    is_active,
    review_status
) VALUES (
    (SELECT id FROM quiz_categories WHERE category_key = 'case_studies' LIMIT 1),
    'Một phụ nữ 28 tuổi đang dùng thuốc tránh thai kết hợp, sau 2 tháng xuất hiện cục máu đông tĩnh mạch sâu chân trái. Không có tiền sử gia đình về rối loạn đông máu. Theo Naranjo Score, trường hợp này được đánh giá như thế nào?',
    'case_scenario',
    'advanced',
    '[
        {"key": "A", "text": "Definite (≥9 điểm)"},
        {"key": "B", "text": "Probable (5-8 điểm)"},
        {"key": "C", "text": "Possible (1-4 điểm)"},
        {"key": "D", "text": "Doubtful (≤0 điểm)"}
    ]'::jsonb,
    'B',
    'Trường hợp này có điểm Naranjo khoảng 6-7: Có mối liên hệ thời gian (+2), có báo cáo tương tự trong y văn (+1), cải thiện khi ngừng thuốc (+1), có thể tái hiện khi dùng lại (+2), nhưng không có placebo test (0), không có nồng độ thuốc độc (0), không dùng lại thuốc (0). Tổng: 6 điểm = Probable.',
    'Product Information - Combined Oral Contraceptives',
    ARRAY['Thuốc tránh thai tăng nguy cơ huyết khối', 'Naranjo Score 5-8 = Probable', 'Cần cân nhắc benefit/risk'],
    180,
    25,
    true,
    'approved'
);

-- 4. Cập nhật số lượng câu hỏi cho category (chạy sau khi thêm câu hỏi)
UPDATE quiz_categories SET total_questions = (
    SELECT COUNT(*) 
    FROM quiz_questions 
    WHERE quiz_questions.category_id = quiz_categories.id 
    AND is_active = true
    AND review_status = 'approved'
);
