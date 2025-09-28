-- Sample Quiz Questions for ADR Training System
-- Insert sample questions for each category with varying difficulty levels

-- First, let's get the category IDs (assuming categories were already inserted)

-- Sample WHO-UMC Questions
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
) VALUES
-- WHO-UMC Beginner Questions
(
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Theo thang đánh giá WHO-UMC, mối liên quan "Chắc chắn" (Certain) yêu cầu những tiêu chuẩn nào?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "Chỉ cần có mối liên hệ thời gian hợp lý"},
        {"key": "B", "text": "Phải có tái sử dụng thuốc với kết quả dương tính"},
        {"key": "C", "text": "Cần có tất cả 5 tiêu chuẩn: thời gian, không thể giải thích khác, cải thiện khi ngừng, phản ứng đã biết, tái xuất hiện"},
        {"key": "D", "text": "Chỉ cần bác sĩ xác nhận"}
    ]'::jsonb,
    'C',
    'Theo WHO-UMC, mối liên quan "Chắc chắn" yêu cầu thỏa mãn tất cả 5 tiêu chuẩn: (1) Mối liên hệ thời gian hợp lý, (2) Không thể giải thích bằng nguyên nhân khác, (3) Cải thiện khi ngừng thuốc, (4) Là phản ứng đã được biết đến, (5) Tái xuất hiện khi dùng lại thuốc.',
    'WHO-UMC Causality Assessment Guidelines',
    ARRAY['WHO-UMC có 6 mức độ đánh giá', 'Certain là mức cao nhất', 'Cần đầy đủ 5 tiêu chuẩn'],
    60,
    10,
    true,
    'approved'
),
(
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Mức độ "Có khả năng" (Probable) trong thang WHO-UMC khác với "Chắc chắn" như thế nào?',
    'multiple_choice',
    'intermediate',
    '[
        {"key": "A", "text": "Không cần có thông tin về tái sử dụng thuốc"},
        {"key": "B", "text": "Chỉ cần 3 tiêu chuẩn thay vì 5"},
        {"key": "C", "text": "Không cần cải thiện khi ngừng thuốc"},
        {"key": "D", "text": "Tất cả các đáp án trên"}
    ]'::jsonb,
    'A',
    'Mức độ "Có khả năng" (Probable) không yêu cầu thông tin về tái sử dụng thuốc (rechallenge). Các tiêu chuẩn khác vẫn cần thiết: mối liên hệ thời gian, cải thiện khi ngừng thuốc, và không chắc chắn về nguyên nhân khác.',
    'WHO-UMC Causality Assessment Guidelines',
    ARRAY['Probable không cần rechallenge', 'Vẫn cần dechallenge positive', 'Nguyên nhân khác không chắc chắn'],
    90,
    15,
    true,
    'approved'
),

-- Naranjo Scale Questions
(
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Trong thang điểm Naranjo, câu hỏi "Phản ứng có xuất hiện sau khi điều trị bằng thuốc nghi ngờ không?" có thể được cho điểm như thế nào?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "Có: +1 điểm, Không: 0 điểm, Không rõ: 0 điểm"},
        {"key": "B", "text": "Có: +2 điểm, Không: -1 điểm, Không rõ: 0 điểm"},
        {"key": "C", "text": "Có: +3 điểm, Không: 0 điểm, Không rõ: -1 điểm"},
        {"key": "D", "text": "Tất cả đều được +1 điểm"}
    ]'::jsonb,
    'B',
    'Câu hỏi về thời gian xuất hiện phản ứng là câu hỏi quan trọng nhất trong thang Naranjo. Nếu có mối liên hệ thời gian rõ ràng sẽ được +2 điểm, nếu không có sẽ bị trừ -1 điểm, nếu không rõ thì được 0 điểm.',
    'Naranjo CA, et al. A method for estimating the probability of adverse drug reactions. Clin Pharmacol Ther. 1981;30(2):239-45.',
    ARRAY['Thang Naranjo có 10 câu hỏi', 'Điểm từ -4 đến +13', 'Câu hỏi về thời gian rất quan trọng'],
    75,
    10,
    true,
    'approved'
),
(
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Tổng điểm Naranjo từ 5-8 điểm được phân loại là mức độ nào?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "Chắc chắn (Definite)"},
        {"key": "B", "text": "Có khả năng (Probable)"},
        {"key": "C", "text": "Có thể (Possible)"},
        {"key": "D", "text": "Nghi ngờ (Doubtful)"}
    ]'::jsonb,
    'B',
    'Thang điểm Naranjo được phân loại như sau: ≥9 điểm = Chắc chắn (Definite), 5-8 điểm = Có khả năng (Probable), 1-4 điểm = Có thể (Possible), ≤0 điểm = Nghi ngờ (Doubtful).',
    'Naranjo CA, et al. A method for estimating the probability of adverse drug reactions. Clin Pharmacol Ther. 1981;30(2):239-45.',
    ARRAY['4 mức độ phân loại Naranjo', 'Probable: 5-8 điểm', 'Cao hơn Possible nhưng thấp hơn Definite'],
    45,
    10,
    true,
    'approved'
),

-- Drug Knowledge Questions
(
    (SELECT id FROM quiz_categories WHERE category_key = 'drug_knowledge' LIMIT 1),
    'Penicillin G có khả năng cao gây phản ứng dị ứng nào sau đây?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "Phát ban, mày đay"},
        {"key": "B", "text": "Sốc phản vệ"},
        {"key": "C", "text": "Viêm da tiếp xúc"},
        {"key": "D", "text": "Tất cả các phản ứng trên"}
    ]'::jsonb,
    'D',
    'Penicillin G có thể gây tất cả các loại phản ứng dị ứng từ nhẹ (phát ban, mày đay) đến nặng (sốc phản vệ). Khoảng 8-10% dân số có dị ứng penicillin, và đây là một trong những nguyên nhân hàng đầu của sốc phản vệ do thuốc.',
    'Drug Allergy Guidelines - EAACI/ENDA',
    ARRAY['Penicillin là allergen phổ biến', 'Có thể gây phản ứng từ nhẹ đến nặng', '8-10% dân số dị ứng'],
    60,
    10,
    true,
    'approved'
),
(
    (SELECT id FROM quiz_categories WHERE category_key = 'drug_knowledge' LIMIT 1),
    'Thuốc nào sau đây có nguy cơ cao gây viêm gan do thuốc (Drug-induced hepatitis)?',
    'multiple_choice',
    'intermediate',
    '[
        {"key": "A", "text": "Paracetamol liều cao"},
        {"key": "B", "text": "Isoniazid"},
        {"key": "C", "text": "Phenytoin"},
        {"key": "D", "text": "Tất cả các thuốc trên"}
    ]'::jsonb,
    'D',
    'Tất cả các thuốc được liệt kê đều có nguy cơ cao gây viêm gan do thuốc. Paracetamol ở liều cao (>4g/ngày) gây độc tính gan trực tiếp, Isoniazid gây viêm gan ở 1-3% bệnh nhân, Phenytoin gây hội chứng tăng mẫn cảm với viêm gan.',
    'LiverTox Database - NIDDK',
    ARRAY['DILI có nhiều nguyên nhân', 'Paracetamol: liều-phụ thuộc', 'Isoniazid, Phenytoin: idiosyncratic'],
    90,
    15,
    true,
    'approved'
),

-- Case Studies Questions
(
    (SELECT id FROM quiz_categories WHERE category_key = 'case_studies' LIMIT 1),
    'Một bệnh nhân 45 tuổi uống Aspirin 500mg và sau 30 phút bị khó thở, phát ban toàn thân. Đây có khả năng là phản ứng gì?',
    'multiple_choice',
    'intermediate',
    '[
        {"key": "A", "text": "Phản ứng dị ứng type I (IgE-mediated)"},
        {"key": "B", "text": "Phản ứng dị ứng type IV (T-cell mediated)"},
        {"key": "C", "text": "Tác dụng phụ thường gặp của Aspirin"},
        {"key": "D", "text": "Nhiễm trúng đường hô hấp"}
    ]'::jsonb,
    'A',
    'Triệu chứng xuất hiện nhanh (30 phút) sau khi dùng Aspirin với khó thở và phát ban toàn thân là dấu hiệu điển hình của phản ứng dị ứng type I (IgE-mediated). Đây là phản ứng nghiêm trọng có thể tiến triển thành sốc phản vệ.',
    'Drug Allergy: Updated Practice Guidelines',
    ARRAY['Type I: phản ứng nhanh (<1 giờ)', 'Triệu chứng: khó thở, phát ban', 'Có thể tiến triển thành sốc phản vệ'],
    120,
    20,
    true,
    'approved'
),
(
    (SELECT id FROM quiz_categories WHERE category_key = 'case_studies' LIMIT 1),
    'Bệnh nhân uống Warfarin, INR = 8.5, xuất hiện chảy máu não. Theo WHO-UMC, mối liên quan thuốc-ADR được đánh giá là?',
    'multiple_choice',
    'advanced',
    '[
        {"key": "A", "text": "Certain (Chắc chắn)"},
        {"key": "B", "text": "Probable (Có khả năng)"},
        {"key": "C", "text": "Possible (Có thể)"},
        {"key": "D", "text": "Unlikely (Không chắc chắn)"}
    ]'::jsonb,
    'A',
    'Đây là trường hợp "Certain" vì: (1) Có mối liên hệ thời gian rõ ràng, (2) INR cao là bằng chứng khách quan về tác dụng quá mức của Warfarin, (3) Chảy máu là tác dụng phụ đã biết của thuốc chống đông, (4) Không có nguyên nhân khác rõ ràng, (5) Có thể cải thiện khi điều chỉnh liều.',
    'WHO-UMC Causality Assessment Guidelines',
    ARRAY['INR cao = bằng chứng khách quan', 'Chảy máu là ADR đã biết của Warfarin', 'Đủ tiêu chuẩn cho Certain'],
    180,
    25,
    true,
    'approved'
),

-- Regulations Questions
(
    (SELECT id FROM quiz_categories WHERE category_key = 'regulations' LIMIT 1),
    'Theo quy định của Việt Nam, ai có trách nhiệm báo cáo ADR?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "Chỉ có bác sĩ"},
        {"key": "B", "text": "Chỉ có dược sĩ"},
        {"key": "C", "text": "Tất cả nhân viên y tế"},
        {"key": "D", "text": "Chỉ có Trung tâm Quốc gia về Thông tin thuốc và ADR"}
    ]'::jsonb,
    'C',
    'Theo Thông tư 07/2018/TT-BYT, tất cả nhân viên y tế (bác sĩ, dược sĩ, điều dưỡng, kỹ thuật viên...) đều có trách nhiệm và quyền báo cáo ADR. Việc báo cáo ADR là nghĩa vụ nghề nghiệp và pháp lý của mọi nhân viên y tế.',
    'Thông tư 07/2018/TT-BYT về ADR',
    ARRAY['Tất cả NVYT có trách nhiệm báo cáo', 'Không chỉ riêng BS, DS', 'Nghĩa vụ pháp lý'],
    45,
    10,
    true,
    'approved'
),
(
    (SELECT id FROM quiz_categories WHERE category_key = 'regulations' LIMIT 1),
    'Thời hạn báo cáo ADR nghiêm trọng tới Trung tâm Quốc gia là bao lâu?',
    'multiple_choice',
    'intermediate',
    '[
        {"key": "A", "text": "24 giờ"},
        {"key": "B", "text": "48 giờ"},  
        {"key": "C", "text": "72 giờ"},
        {"key": "D", "text": "7 ngày"}
    ]'::jsonb,
    'C',
    'Theo Thông tư 07/2018/TT-BYT, ADR nghiêm trọng phải được báo cáo trong vòng 72 giờ (3 ngày) kể từ khi phát hiện. ADR không nghiêm trọng có thể báo cáo trong vòng 15 ngày.',
    'Thông tư 07/2018/TT-BYT về ADR',
    ARRAY['ADR nghiêm trọng: 72 giờ', 'ADR không nghiêm trọng: 15 ngày', 'Thời hạn tính từ khi phát hiện'],
    60,
    15,
    true,
    'approved'
),

-- General ADR Questions
(
    (SELECT id FROM quiz_categories WHERE category_key = 'general' LIMIT 1),
    'Định nghĩa ADR (Adverse Drug Reaction) theo WHO là gì?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "Bất kỳ tác dụng có hại nào của thuốc"},
        {"key": "B", "text": "Phản ứng có hại, không mong muốn xảy ra ở liều điều trị bình thường"},
        {"key": "C", "text": "Chỉ bao gồm phản ứng dị ứng"},
        {"key": "D", "text": "Chỉ xảy ra khi dùng thuốc quá liều"}
    ]'::jsonb,
    'B',
    'Theo WHO, ADR là phản ứng có hại và không mong muốn đối với thuốc, xảy ra ở liều được sử dụng ở người để phòng ngừa, chẩn đoán hoặc điều trị bệnh, hoặc để thay đổi chức năng sinh lý.',
    'WHO Definition of Adverse Drug Reaction',
    ARRAY['ADR xảy ra ở liều điều trị', 'Không mong muốn và có hại', 'Khác với overdose'],
    60,
    10,
    true,
    'approved'
),
(
    (SELECT id FROM quiz_categories WHERE category_key = 'general' LIMIT 1),
    'Pharmacovigilance là gì?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "Chỉ là việc thu thập báo cáo ADR"},
        {"key": "B", "text": "Khoa học và hoạt động liên quan đến phát hiện, đánh giá, hiểu biết và phòng ngừa tác dụng bất lợi của thuốc"},
        {"key": "C", "text": "Chỉ áp dụng cho thuốc mới"},
        {"key": "D", "text": "Chỉ do công ty dược phẩm thực hiện"}
    ]'::jsonb,
    'B',
    'Pharmacovigilance là khoa học và các hoạt động liên quan đến việc phát hiện, đánh giá, hiểu biết và phòng ngừa các tác dụng bất lợi hoặc bất kỳ vấn đề nào khác liên quan đến thuốc. Đây là một hệ thống toàn diện, không chỉ thu thập báo cáo.',
    'WHO Definition of Pharmacovigilance',
    ARRAY['Bao gồm phát hiện, đánh giá, hiểu biết, phòng ngừa', 'Không chỉ thu thập báo cáo', 'Áp dụng cho tất cả thuốc'],
    75,
    10,
    true,
    'approved'
);

-- Insert some True/False questions
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
) VALUES
(
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Mức độ "Unclassifiable" trong thang WHO-UMC có nghĩa là không đủ thông tin để đánh giá mối liên quan.',
    'true_false',
    'beginner',
    '[
        {"key": "true", "text": "Đúng"},
        {"key": "false", "text": "Sai"}
    ]'::jsonb,
    'true',
    'Đúng. "Unclassifiable" nghĩa là ghi nhận phản ứng, nghi ngờ là phản ứng có hại của thuốc, nhưng không thể đánh giá được do thông tin trong báo cáo không đầy đủ hoặc không thống nhất, và không thể thu thập thêm thông tin bổ sung.',
    'WHO-UMC Causality Assessment Guidelines',
    ARRAY['Unclassifiable khác với Unclassified', 'Do thiếu thông tin', 'Không thể bổ sung thêm thông tin'],
    30,
    5,
    true,
    'approved'
),
(
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Thang điểm Naranjo chỉ có thể áp dụng cho phản ứng dị ứng.',
    'true_false',
    'beginner',
    '[
        {"key": "true", "text": "Đúng"},
        {"key": "false", "text": "Sai"}
    ]'::jsonb,
    'false',
    'Sai. Thang điểm Naranjo có thể áp dụng cho tất cả các loại ADR, không chỉ riêng phản ứng dị ứng. Nó là một công cụ tổng quát để đánh giá mối liên quan nhân-quả giữa thuốc và bất kỳ phản ứng có hại nào.',
    'Naranjo CA, et al. A method for estimating the probability of adverse drug reactions. Clin Pharmacol Ther. 1981;30(2):239-45.',
    ARRAY['Naranjo áp dụng cho mọi loại ADR', 'Không chỉ dị ứng', 'Công cụ tổng quát'],
    30,
    5,
    true,
    'approved'
);

-- Update category question counts
UPDATE quiz_categories SET total_questions = (
    SELECT COUNT(*) FROM quiz_questions 
    WHERE quiz_questions.category_id = quiz_categories.id 
    AND is_active = true
);









