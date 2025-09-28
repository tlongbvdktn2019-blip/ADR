-- Ví dụ thực tế: Thêm 3 câu hỏi mới vào hệ thống
-- Chạy script này trong Supabase SQL Editor

-- === WHO-UMC CATEGORY ===
-- Thêm câu hỏi WHO-UMC Advanced level
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
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Bệnh nhân 65 tuổi uống Digoxin 0.25mg/ngày, sau 3 ngày xuất hiện buồn nôn, rối loạn nhịp tim. Nồng độ Digoxin trong máu: 3.2 ng/mL (bình thường: 0.8-2.0). Không có thay đổi liều lượng gần đây. Theo WHO-UMC, mối liên quan thuốc-ADR là?',
    'multiple_choice',
    'advanced',
    '[
        {"key": "A", "text": "Certain - có tất cả bằng chứng cần thiết"},
        {"key": "B", "text": "Probable - thiếu thông tin rechallenge"},
        {"key": "C", "text": "Possible - chỉ có mối liên hệ thời gian"},
        {"key": "D", "text": "Unlikely - có nguyên nhân khác"}
    ]'::jsonb,
    'A',
    'Đây là trường hợp "Certain" vì có đầy đủ bằng chứng: (1) Mối liên hệ thời gian rõ ràng, (2) Nồng độ độc trong máu là bằng chứng khách quan, (3) Triệu chứng điển hình của ngộ độc Digoxin, (4) Không có nguyên nhân khác rõ ràng, (5) Sẽ cải thiện khi ngừng/giảm liều thuốc.',
    'WHO-UMC Causality Assessment Guidelines 2018',
    ARRAY['Nồng độ thuốc cao = bằng chứng khách quan', 'Triệu chứng điển hình ngộ độc Digoxin', 'Certain cần đầy đủ 5 tiêu chuẩn'],
    120,
    20,
    true,
    'approved'
);

-- === DRUG KNOWLEDGE CATEGORY ===
-- Thêm câu hỏi về Warfarin drug interaction
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
    (SELECT id FROM quiz_categories WHERE category_key = 'drug_knowledge' LIMIT 1),
    'Bệnh nhân đang dùng Warfarin (INR ổn định 2.5) được kê thêm thuốc kháng sinh nào sau đây có nguy cơ THẤP NHẤT gây tăng tác dụng chống đông?',
    'multiple_choice',
    'intermediate',
    '[
        {"key": "A", "text": "Azithromycin 500mg x 3 ngày"},
        {"key": "B", "text": "Ciprofloxacin 500mg x 7 ngày"},  
        {"key": "C", "text": "Metronidazole 400mg x 7 ngày"},
        {"key": "D", "text": "Amoxicillin 500mg x 7 ngày"}
    ]'::jsonb,
    'D',
    'Amoxicillin có tương tác thấp nhất với Warfarin. Ciprofloxacin (inhibits CYP1A2, CYP3A4), Metronidazole (inhibits CYP2C9), và Azithromycin đều có thể tăng tác dụng Warfarin. Amoxicillin chủ yếu bài tiết qua thận, ít tương tác với hệ enzyme cytochrome P450.',
    'Clinical Pharmacology - Drug Interactions with Warfarin',
    ARRAY['Amoxicillin ít tương tác thuốc', 'Quinolones và Metronidazole tăng Warfarin', 'Theo dõi INR khi phối hợp kháng sinh'],
    90,
    15,
    true,
    'approved'
);

-- === REGULATIONS CATEGORY ===
-- Thêm câu hỏi về quy định báo cáo ADR tại Việt Nam
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
    (SELECT id FROM quiz_categories WHERE category_key = 'regulations' LIMIT 1),
    'Theo Thông tư 07/2018/TT-BYT, báo cáo ADR nào sau đây được ưu tiên xử lý và truyền đạt nhanh nhất?',
    'multiple_choice',
    'intermediate',
    '[
        {"key": "A", "text": "ADR chưa được ghi trong tài liệu hướng dẫn sử dụng thuốc"},
        {"key": "B", "text": "ADR xảy ra với thuốc mới được cấp phép lưu hành (<5 năm)"},
        {"key": "C", "text": "ADR nghiêm trọng, bất ngờ với thuốc trong danh mục theo dõi đặc biệt"},
        {"key": "D", "text": "ADR xảy ra với thuốc generic thay thế thuốc gốc"}
    ]'::jsonb,
    'C',
    'Theo Thông tư 07/2018/TT-BYT, ADR nghiêm trọng (serious) và bất ngờ (unexpected) với thuốc trong danh mục theo dõi đặc biệt được ưu tiên xử lý cao nhất, phải báo cáo trong 24-72h và có thể dẫn đến các biện pháp can thiệp ngay lập tức như thu hồi thuốc hoặc thay đổi thông tin sản phẩm.',
    'Thông tư 07/2018/TT-BYT về quản lý tác dụng không mong muốn của thuốc',
    ARRAY['ADR serious + unexpected = ưu tiên cao nhất', 'Thuốc theo dõi đặc biệt cần báo cáo nhanh', 'Có thể dẫn đến can thiệp ngay lập tức'],
    75,
    15,
    true,
    'approved'
);

-- Cập nhật tổng số câu hỏi cho các category
UPDATE quiz_categories SET total_questions = (
    SELECT COUNT(*) 
    FROM quiz_questions 
    WHERE quiz_questions.category_id = quiz_categories.id 
    AND is_active = true
    AND review_status = 'approved'
);

-- Kiểm tra kết quả
SELECT 
    c.name,
    COUNT(q.id) as added_questions,
    c.total_questions as total
FROM quiz_categories c
LEFT JOIN quiz_questions q ON c.id = q.category_id AND q.is_active = true
WHERE c.is_active = true
GROUP BY c.id, c.name, c.total_questions
ORDER BY c.name;
