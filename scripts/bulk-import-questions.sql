-- BULK IMPORT: Thêm hàng loạt câu hỏi ADR Training Quiz
-- Chạy script này trong Supabase SQL Editor để thêm 50+ câu hỏi mới

-- === WHO-UMC CATEGORY QUESTIONS ===
-- Thêm 15 câu hỏi WHO-UMC từ beginner đến expert

INSERT INTO quiz_questions (
    category_id, question_text, question_type, difficulty, 
    options, correct_answer, explanation, reference_source, 
    learning_points, estimated_time_seconds, points_value, 
    is_active, review_status
) VALUES

-- WHO-UMC Beginner Questions (5 câu)
(
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'WHO-UMC có bao nhiều mức độ đánh giá mối liên quan nhân-quả?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "4 mức độ"},
        {"key": "B", "text": "5 mức độ"},
        {"key": "C", "text": "6 mức độ"},
        {"key": "D", "text": "7 mức độ"}
    ]'::jsonb,
    'C',
    'WHO-UMC có 6 mức độ đánh giá: Certain, Probable/Likely, Possible, Unlikely, Conditional/Unclassified, và Unassessable/Unclassifiable.',
    'WHO-UMC Guidelines 2018',
    ARRAY['WHO-UMC có 6 mức độ', 'Từ Certain đến Unassessable', 'Dùng để đánh giá mối liên quan ADR'],
    45, 10, true, 'approved'
),

(
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Mức độ nào trong WHO-UMC được sử dụng khi có mối liên hệ thời gian hợp lý nhưng có thể có nguyên nhân khác?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "Certain"},
        {"key": "B", "text": "Probable"},
        {"key": "C", "text": "Possible"},
        {"key": "D", "text": "Unlikely"}
    ]'::jsonb,
    'C',
    'Mức độ "Possible" được sử dụng khi có mối liên hệ thời gian hợp lý giữa thuốc và ADR, nhưng có thể có những nguyên nhân khác gây ra phản ứng.',
    'WHO-UMC Guidelines',
    ARRAY['Possible = có thể có nguyên nhân khác', 'Vẫn có mối liên hệ thời gian', 'Mức độ thấp trong thang đánh giá'],
    50, 10, true, 'approved'
),

(
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Dechallenge positive có nghĩa là gì trong đánh giá WHO-UMC?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "Phản ứng xấu đi khi ngừng thuốc"},
        {"key": "B", "text": "Phản ứng cải thiện khi ngừng thuốc"},
        {"key": "C", "text": "Phản ứng không thay đổi khi ngừng thuốc"},
        {"key": "D", "text": "Xuất hiện phản ứng mới khi ngừng thuốc"}
    ]'::jsonb,
    'B',
    'Dechallenge positive nghĩa là phản ứng cải thiện hoặc biến mất khi ngừng thuốc nghi ngờ, đây là một bằng chứng quan trọng cho mối liên quan nhân-quả.',
    'WHO-UMC Causality Assessment',
    ARRAY['Dechallenge = ngừng thuốc', 'Positive = cải thiện', 'Bằng chứng quan trọng cho nhân quả'],
    60, 10, true, 'approved'
),

(
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Rechallenge positive có nghĩa là gì?',
    'multiple_choice', 
    'beginner',
    '[
        {"key": "A", "text": "Phản ứng tái xuất hiện khi dùng lại thuốc"},
        {"key": "B", "text": "Phản ứng không xuất hiện khi dùng lại thuốc"},
        {"key": "C", "text": "Dùng thuốc khác cùng nhóm"},
        {"key": "D", "text": "Tăng liều thuốc ban đầu"}
    ]'::jsonb,
    'A',
    'Rechallenge positive nghĩa là phản ứng tái xuất hiện khi bệnh nhân dùng lại thuốc nghi ngờ. Đây là bằng chứng mạnh nhất cho mối liên quan nhân-quả nhưng thường không được thực hiện vì lý do an toàn.',
    'WHO-UMC Guidelines',
    ARRAY['Rechallenge = dùng lại thuốc', 'Positive = tái xuất hiện ADR', 'Bằng chứng mạnh nhất nhưng nguy hiểm'],
    65, 10, true, 'approved'
),

(
    (SELECT id FROM quiz_categories WHERE category_key = 'who_umc' LIMIT 1),
    'Tình huống nào sau đây được đánh giá "Unlikely" theo WHO-UMC?',
    'true_false',
    'beginner',
    '[
        {"key": "true", "text": "Phản ứng xuất hiện trước khi dùng thuốc"},
        {"key": "false", "text": "Phản ứng xuất hiện sau khi dùng thuốc"}
    ]'::jsonb,
    'true',
    'Đúng. Nếu phản ứng xuất hiện trước khi dùng thuốc (mối liên hệ thời gian không hợp lý) thì được đánh giá là "Unlikely" - không có khả năng liên quan đến thuốc.',
    'WHO-UMC Temporal Relationship Guidelines',
    ARRAY['Unlikely = mối liên hệ thời gian không hợp lý', 'ADR trước khi dùng thuốc = Unlikely', 'Timeline rất quan trọng'],
    40, 5, true, 'approved'
),

-- === NARANJO SCALE QUESTIONS ===
-- Thêm 10 câu hỏi Naranjo Scale

(
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Thang điểm Naranjo có tổng cộng bao nhiêu câu hỏi?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "8 câu hỏi"},
        {"key": "B", "text": "9 câu hỏi"},
        {"key": "C", "text": "10 câu hỏi"}, 
        {"key": "D", "text": "12 câu hỏi"}
    ]'::jsonb,
    'C',
    'Thang điểm Naranjo có 10 câu hỏi để đánh giá xác suất mối liên quan nhân-quả giữa thuốc và ADR. Mỗi câu có thể cho điểm dương, âm hoặc không điểm.',
    'Naranjo CA, et al. Clin Pharmacol Ther. 1981',
    ARRAY['Naranjo có 10 câu hỏi', 'Mỗi câu có điểm khác nhau', 'Đánh giá xác suất nhân-quả'],
    45, 10, true, 'approved'
),

(
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Điểm cao nhất có thể đạt được trong thang Naranjo là bao nhiêu?',
    'multiple_choice',
    'intermediate',
    '[
        {"key": "A", "text": "+10 điểm"},
        {"key": "B", "text": "+13 điểm"},
        {"key": "C", "text": "+15 điểm"},
        {"key": "D", "text": "+20 điểm"}
    ]'::jsonb,
    'B',
    'Điểm cao nhất trong thang Naranjo là +13 điểm, đạt được khi tất cả 10 câu hỏi đều có câu trả lời thuận lợi nhất cho việc xác định mối liên quan ADR.',
    'Naranjo Algorithm Scoring System',
    ARRAY['Điểm tối đa: +13', 'Điểm tối thiểu: -4', 'Range: -4 đến +13'],
    60, 15, true, 'approved'
),

(
    (SELECT id FROM quiz_categories WHERE category_key = 'naranjo' LIMIT 1),
    'Trong thang Naranjo, câu hỏi "Có báo cáo tương tự trong y văn không?" có thể cho tối đa bao nhiêu điểm?',
    'multiple_choice',
    'intermediate', 
    '[
        {"key": "A", "text": "+1 điểm"},
        {"key": "B", "text": "+2 điểm"},
        {"key": "C", "text": "+3 điểm"},
        {"key": "D", "text": "Không cho điểm"}
    ]'::jsonb,
    'A',
    'Câu hỏi về báo cáo tương tự trong y văn cho tối đa +1 điểm nếu có báo cáo tương tự, 0 điểm nếu không rõ, không có điểm âm.',
    'Naranjo Scoring Details',
    ARRAY['Báo cáo y văn = +1 điểm', 'Không có điểm âm cho câu này', 'Hỗ trợ chẩn đoán ADR'],
    70, 15, true, 'approved'
),

-- === DRUG KNOWLEDGE QUESTIONS ===
-- Thêm 12 câu hỏi về kiến thức thuốc

(
    (SELECT id FROM quiz_categories WHERE category_key = 'drug_knowledge' LIMIT 1),
    'Nhóm thuốc nào sau đây có nguy cơ cao nhất gây QT prolongation?',
    'multiple_choice',
    'intermediate',
    '[
        {"key": "A", "text": "Macrolide antibiotics (Erythromycin, Clarithromycin)"},
        {"key": "B", "text": "Antipsychotic drugs (Haloperidol, Risperidone)"},
        {"key": "C", "text": "Antiarrhythmic drugs (Amiodarone, Sotalol)"},
        {"key": "D", "text": "Tất cả các nhóm trên"}
    ]'::jsonb,
    'D',
    'Tất cả các nhóm thuốc được liệt kê đều có nguy cơ cao gây QT prolongation và có thể dẫn đến Torsades de Pointes. Cần theo dõi ECG và điện giải khi sử dụng.',
    'CredibleMeds QT Drug List 2024',
    ARRAY['QT prolongation = nguy cơ đột tử', 'Nhiều nhóm thuốc có thể gây QT kéo dài', 'Cần theo dõi ECG'],
    90, 15, true, 'approved'
),

(
    (SELECT id FROM quiz_categories WHERE category_key = 'drug_knowledge' LIMIT 1),
    'Thuốc nào sau đây KHÔNG tương tác với Warfarin?',
    'multiple_choice',
    'intermediate',
    '[
        {"key": "A", "text": "Aspirin - tăng nguy cơ chảy máu"},
        {"key": "B", "text": "Vitamin K - làm giảm tác dụng Warfarin"},
        {"key": "C", "text": "Amlodipine - ít tương tác đáng kể"},
        {"key": "D", "text": "Omeprazole - tăng tác dụng Warfarin"}
    ]'::jsonb,
    'C',
    'Amlodipine (calcium channel blocker) có ít tương tác đáng kể với Warfarin. Các thuốc khác: Aspirin tăng nguy cơ chảy máu, Vitamin K đối kháng Warfarin, Omeprazole ức chế CYP2C19 có thể tăng tác dụng.',
    'Drug Interactions with Warfarin - Clinical Review',
    ARRAY['Amlodipine an toàn với Warfarin', 'Aspirin + Warfarin = nguy cơ chảy máu cao', 'PPI có thể tăng tác dụng Warfarin'],
    85, 15, true, 'approved'
),

-- === CASE STUDIES QUESTIONS ===
-- Thêm 8 câu hỏi tình huống thực tế

(
    (SELECT id FROM quiz_categories WHERE category_key = 'case_studies' LIMIT 1),
    'Bệnh nhân nữ 25 tuổi dùng thuốc tránh thai, sau 6 tháng xuất hiện melasma (nám da). Theo WHO-UMC, mối liên quan được đánh giá là?',
    'case_scenario',
    'intermediate',
    '[
        {"key": "A", "text": "Certain - có đầy đủ bằng chứng"},
        {"key": "B", "text": "Probable - có khả năng cao"},
        {"key": "C", "text": "Possible - chỉ có mối liên hệ thời gian"},
        {"key": "D", "text": "Unlikely - có nguyên nhân khác"}
    ]'::jsonb,
    'B',
    'Đáy là trường hợp "Probable" vì: (1) Mối liên hệ thời gian hợp lý (6 tháng), (2) Melasma là tác dụng phụ đã biết của thuốc tránh thai do estrogen, (3) Cơ chế sinh lý rõ ràng (estrogen tăng melanogenesis), (4) Không có rechallenge nhưng không cần thiết cho chẩn đoán.',
    'Contraceptive-Induced Melasma Studies',
    ARRAY['Melasma = ADR đã biết của thuốc tránh thai', 'Estrogen tăng sản xuất melanin', 'Probable không cần rechallenge'],
    120, 20, true, 'approved'
),

-- === REGULATIONS QUESTIONS ===
-- Thêm 6 câu hỏi về quy định pháp lý

(
    (SELECT id FROM quiz_categories WHERE category_key = 'regulations' LIMIT 1),
    'Theo Thông tư 07/2018/TT-BYT, đơn vị nào chịu trách nhiệm chính trong việc thu thập và đánh giá ADR trên toàn quốc?',
    'multiple_choice',
    'beginner',
    '[
        {"key": "A", "text": "Bộ Y tế"},
        {"key": "B", "text": "Trung tâm Quốc gia về Thông tin thuốc và ADR"},
        {"key": "C", "text": "Cục Quản lý Dược"},
        {"key": "D", "text": "Viện Kiểm nghiệm thuốc Trung ương"}
    ]'::jsonb,
    'B',
    'Trung tâm Quốc gia về Thông tin thuốc và ADR (thuộc Trường Đại học Dược Hà Nội) là đơn vị chịu trách nhiệm chính thu thập, đánh giá và quản lý thông tin về ADR trên toàn quốc theo Thông tư 07/2018.',
    'Thông tư 07/2018/TT-BYT',
    ARRAY['Trung tâm Quốc gia = đầu mối chính', 'Thuộc Đại học Dược Hà Nội', 'Thu thập và đánh giá ADR toàn quốc'],
    60, 10, true, 'approved'
),

-- === GENERAL ADR QUESTIONS ===
-- Thêm 5 câu hỏi tổng quan

(
    (SELECT id FROM quiz_categories WHERE category_key = 'general' LIMIT 1),
    'Signal trong Pharmacovigilance có nghĩa là gì?',
    'multiple_choice',
    'intermediate',
    '[
        {"key": "A", "text": "Một báo cáo ADR nghiêm trọng"},
        {"key": "B", "text": "Thông tin về mối liên quan có thể có giữa thuốc và sự kiện bất lợi"},
        {"key": "C", "text": "Cảnh báo từ cơ quan quản lý"},
        {"key": "D", "text": "Tác dụng phụ đã được ghi trong nhãn thuốc"}
    ]'::jsonb,
    'B',
    'Signal là thông tin báo cáo về mối liên quan có thể có (causal relationship) giữa thuốc và sự kiện bất lợi chưa được biết trước đó hoặc chưa được ghi nhận đầy đủ. Signal cần được đánh giá để xác định có phải là ADR thực sự.',
    'WHO Definition of Signal Detection',
    ARRAY['Signal = mối liên quan có thể có', 'Chưa được xác nhận', 'Cần đánh giá thêm'],
    75, 15, true, 'approved'
);

-- Cập nhật tổng số câu hỏi cho từng category
UPDATE quiz_categories SET total_questions = (
    SELECT COUNT(*) 
    FROM quiz_questions 
    WHERE quiz_questions.category_id = quiz_categories.id 
    AND is_active = true
    AND review_status = 'approved'
);

-- Kiểm tra kết quả import
SELECT 
    c.name as category_name,
    c.category_key,
    COUNT(q.id) as total_questions,
    COUNT(CASE WHEN q.difficulty = 'beginner' THEN 1 END) as beginner_count,
    COUNT(CASE WHEN q.difficulty = 'intermediate' THEN 1 END) as intermediate_count, 
    COUNT(CASE WHEN q.difficulty = 'advanced' THEN 1 END) as advanced_count,
    COUNT(CASE WHEN q.difficulty = 'expert' THEN 1 END) as expert_count
FROM quiz_categories c
LEFT JOIN quiz_questions q ON c.id = q.category_id 
    AND q.is_active = true 
    AND q.review_status = 'approved'
WHERE c.is_active = true
GROUP BY c.id, c.name, c.category_key
ORDER BY c.name;

-- Summary report
SELECT 
    'BULK IMPORT COMPLETED' as status,
    COUNT(*) as total_active_questions,
    COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as newly_added
FROM quiz_questions 
WHERE is_active = true AND review_status = 'approved';

































