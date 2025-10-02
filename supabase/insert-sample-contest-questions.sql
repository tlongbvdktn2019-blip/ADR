-- =====================================================
-- INSERT SAMPLE CONTEST QUESTIONS
-- Câu hỏi mẫu đơn giản cho CUỘC THI ADR
-- Chỉ câu hỏi trắc nghiệm 4 đáp án A, B, C, D
-- KHÔNG phân danh mục, KHÔNG phân độ khó
-- =====================================================

INSERT INTO contest_questions (question_text, options, correct_answer, explanation, points_value, is_active) VALUES

-- Câu hỏi về WHO-UMC
('WHO-UMC là viết tắt của tổ chức nào?',
 '[{"key":"A","text":"World Health Organization - Uppsala Monitoring Centre"},
   {"key":"B","text":"World Hospital Organization - Universal Medical Centre"},
   {"key":"C","text":"World Hygiene Organization - Urban Medical Centre"},
   {"key":"D","text":"World Healthcare Organization - United Medical Centre"}]'::jsonb,
 'A', 'WHO-UMC (World Health Organization - Uppsala Monitoring Centre) là trung tâm giám sát an toàn thuốc toàn cầu của WHO.', 10, true),

('Theo WHO-UMC, có bao nhiêu mức độ đánh giá mối liên quan nhân quả?',
 '[{"key":"A","text":"4 mức độ"},
   {"key":"B","text":"5 mức độ"},
   {"key":"C","text":"6 mức độ"},
   {"key":"D","text":"7 mức độ"}]'::jsonb,
 'C', 'WHO-UMC có 6 mức độ: Certain, Probable, Possible, Unlikely, Conditional, Unassessable.', 10, true),

('Điều kiện BẮT BUỘC để đạt mức "Certain" trong WHO-UMC là gì?',
 '[{"key":"A","text":"Chỉ cần mối liên hệ thời gian hợp lý"},
   {"key":"B","text":"Chỉ cần rechallenge positive"},
   {"key":"C","text":"Cần đầy đủ: thời gian hợp lý + dechallenge + rechallenge positive"},
   {"key":"D","text":"Chỉ cần dechallenge positive"}]'::jsonb,
 'C', 'Để đạt mức Certain cần có đầy đủ: mối liên hệ thời gian, dechallenge positive, rechallenge positive, phản ứng đã biết, không có nguyên nhân khác.', 10, true),

-- Câu hỏi về Thang điểm Naranjo
('Thang điểm Naranjo có tổng cộng bao nhiêu câu hỏi?',
 '[{"key":"A","text":"8 câu hỏi"},
   {"key":"B","text":"10 câu hỏi"},
   {"key":"C","text":"12 câu hỏi"},
   {"key":"D","text":"15 câu hỏi"}]'::jsonb,
 'B', 'Thang điểm Naranjo gồm 10 câu hỏi để đánh giá mối liên quan nhân quả giữa thuốc và ADR.', 10, true),

('Với thang Naranjo, điểm từ bao nhiêu được coi là "Probable"?',
 '[{"key":"A","text":"1-4 điểm"},
   {"key":"B","text":"5-8 điểm"},
   {"key":"C","text":"≥9 điểm"},
   {"key":"D","text":"≥13 điểm"}]'::jsonb,
 'B', 'Theo Naranjo: ≥9 điểm = Definite, 5-8 điểm = Probable, 1-4 điểm = Possible, ≤0 điểm = Doubtful.', 10, true),

('Điểm tối đa có thể đạt được trên thang Naranjo là bao nhiêu?',
 '[{"key":"A","text":"10 điểm"},
   {"key":"B","text":"12 điểm"},
   {"key":"C","text":"13 điểm"},
   {"key":"D","text":"15 điểm"}]'::jsonb,
 'C', 'Thang điểm Naranjo có tổng điểm tối đa là 13 điểm.', 10, true),

-- Câu hỏi về Phân loại ADR
('ADR Type A (Augmented) có đặc điểm nào sau đây?',
 '[{"key":"A","text":"Phụ thuộc liều, có thể dự đoán được"},
   {"key":"B","text":"Không phụ thuộc liều, không dự đoán được"},
   {"key":"C","text":"Chỉ xảy ra sau thời gian dài dùng thuốc"},
   {"key":"D","text":"Luôn nghiêm trọng và đe dọa tính mạng"}]'::jsonb,
 'A', 'ADR Type A là phản ứng phụ thuộc liều, có thể dự đoán dựa trên tác dụng dược lý. Ví dụ: chảy máu do warfarin.', 10, true),

('Phản ứng dị ứng thuốc thuộc loại ADR nào?',
 '[{"key":"A","text":"Type A - Augmented"},
   {"key":"B","text":"Type B - Bizarre"},
   {"key":"C","text":"Type C - Chronic"},
   {"key":"D","text":"Type D - Delayed"}]'::jsonb,
 'B', 'Phản ứng dị ứng thuộc Type B (Bizarre) - không phụ thuộc liều, không dự đoán được, liên quan gen/miễn dịch.', 10, true),

('ADR Type E đề cập đến hiện tượng gì?',
 '[{"key":"A","text":"Phản ứng khi mới bắt đầu dùng thuốc"},
   {"key":"B","text":"Phản ứng khi ngừng thuốc đột ngột"},
   {"key":"C","text":"Phản ứng khi dùng thuốc quá liều"},
   {"key":"D","text":"Phản ứng khi dùng thuốc trong thai kỳ"}]'::jsonb,
 'B', 'ADR Type E (End of use/Withdrawal) là phản ứng khi ngừng thuốc đột ngột. Ví dụ: hội chứng cai benzodiazepine.', 10, true),

-- Câu hỏi về Báo cáo ADR
('Theo quy định, ai có trách nhiệm báo cáo ADR?',
 '[{"key":"A","text":"Chỉ bác sĩ"},
   {"key":"B","text":"Chỉ dược sĩ"},
   {"key":"C","text":"Tất cả nhân viên y tế"},
   {"key":"D","text":"Chỉ trung tâm Dược quốc gia"}]'::jsonb,
 'C', 'Tất cả nhân viên y tế (bác sĩ, dược sĩ, điều dưỡng...) đều có trách nhiệm báo cáo ADR khi phát hiện.', 10, true),

('ADR nào sau đây cần báo cáo NGAY LẬP TỨC?',
 '[{"key":"A","text":"ADR nghiêm trọng"},
   {"key":"B","text":"ADR chưa được biết đến"},
   {"key":"C","text":"ADR với thuốc mới (<5 năm)"},
   {"key":"D","text":"Tất cả các trường hợp trên"}]'::jsonb,
 'D', 'Cần báo cáo ngay: ADR nghiêm trọng, ADR chưa biết, ADR với thuốc mới, hoặc ADR bất thường.', 10, true),

('Mẫu báo cáo ADR theo WHO thường được gọi là gì?',
 '[{"key":"A","text":"Form ADR-01"},
   {"key":"B","text":"Yellow Card"},
   {"key":"C","text":"WHO-ART Form"},
   {"key":"D","text":"MedWatch"}]'::jsonb,
 'B', 'Yellow Card (Thẻ vàng) là tên gọi phổ biến của mẫu báo cáo ADR theo WHO.', 10, true),

-- Câu hỏi về Quản lý ADR
('Biện pháp đầu tiên khi nghi ngờ ADR là gì?',
 '[{"key":"A","text":"Ngừng thuốc ngay lập tức"},
   {"key":"B","text":"Đánh giá mức độ nghiêm trọng và mối liên quan"},
   {"key":"C","text":"Cho thuốc điều trị triệu chứng"},
   {"key":"D","text":"Chuyển bệnh nhân lên tuyến trên"}]'::jsonb,
 'B', 'Khi nghi ngờ ADR, trước tiên cần đánh giá mức độ nghiêm trọng và mối liên quan để có quyết định xử trí phù hợp.', 10, true),

('Với ADR nhẹ, không ảnh hưởng nhiều, nên xử trí như thế nào?',
 '[{"key":"A","text":"Ngừng thuốc ngay lập tức"},
   {"key":"B","text":"Tiếp tục theo dõi, điều trị triệu chứng nếu cần"},
   {"key":"C","text":"Giảm liều xuống 50%"},
   {"key":"D","text":"Chuyển sang thuốc khác ngay"}]'::jsonb,
 'B', 'Với ADR nhẹ, có thể tiếp tục dùng thuốc và theo dõi, điều trị triệu chứng nếu cần. Cân nhắc lợi ích/nguy cơ.', 10, true),

('Khi nào cần làm test "rechallenge" (cho dùng lại thuốc)?',
 '[{"key":"A","text":"Luôn luôn, với mọi ADR"},
   {"key":"B","text":"Chỉ khi cần xác định chắc chắn mối liên quan"},
   {"key":"C","text":"Không bao giờ, vì quá nguy hiểm"},
   {"key":"D","text":"Chỉ với ADR không nghiêm trọng và khi cần thiết"}]'::jsonb,
 'D', 'Rechallenge chỉ khi: ADR không nghiêm trọng, cần xác định chắc chắn, thuốc quan trọng, có theo dõi chặt.', 10, true),

-- Câu hỏi về Thuốc nguy cơ cao
('Thuốc nào sau đây thuộc nhóm thuốc nguy cơ cao?',
 '[{"key":"A","text":"Paracetamol"},
   {"key":"B","text":"Insulin"},
   {"key":"C","text":"Vitamin C"},
   {"key":"D","text":"Amoxicillin"}]'::jsonb,
 'B', 'Insulin là thuốc nguy cơ cao vì có thể gây hạ đường huyết nghiêm trọng nếu sai liều.', 10, true),

('Thuốc kháng đông nào cần theo dõi chặt chẽ nhất?',
 '[{"key":"A","text":"Aspirin liều thấp"},
   {"key":"B","text":"Warfarin"},
   {"key":"C","text":"Clopidogrel"},
   {"key":"D","text":"Dipyridamole"}]'::jsonb,
 'B', 'Warfarin cần theo dõi chặt: cửa sổ điều trị hẹp, nhiều tương tác, cần điều chỉnh liều dựa INR.', 10, true),

('ADR nghiêm trọng nhất của thuốc chống đông là gì?',
 '[{"key":"A","text":"Buồn nôn"},
   {"key":"B","text":"Chảy máu"},
   {"key":"C","text":"Đau đầu"},
   {"key":"D","text":"Mẩn ngứa"}]'::jsonb,
 'B', 'Chảy máu là ADR nghiêm trọng nhất của thuốc chống đông, có thể đe dọa tính mạng.', 10, true),

-- Câu hỏi về ADR đặc biệt
('Stevens-Johnson Syndrome (SJS) liên quan đến cơ quan nào?',
 '[{"key":"A","text":"Gan"},
   {"key":"B","text":"Thận"},
   {"key":"C","text":"Da và niêm mạc"},
   {"key":"D","text":"Tim mạch"}]'::jsonb,
 'C', 'Stevens-Johnson Syndrome là phản ứng da nghiêm trọng với tổn thương da và niêm mạc, có thể đe dọa tính mạng.', 10, true),

('Thuốc nào có nguy cơ cao gây Stevens-Johnson Syndrome?',
 '[{"key":"A","text":"Paracetamol"},
   {"key":"B","text":"Allopurinol"},
   {"key":"C","text":"Vitamin B1"},
   {"key":"D","text":"Metformin"}]'::jsonb,
 'B', 'Allopurinol là một trong những thuốc có nguy cơ cao nhất gây SJS/TEN, đặc biệt ở bệnh nhân có HLA-B*5801.', 10, true),

('Hepatotoxicity (độc gan) do thuốc biểu hiện bằng dấu hiệu nào?',
 '[{"key":"A","text":"Vàng da, vàng mắt"},
   {"key":"B","text":"Men gan tăng cao (AST, ALT)"},
   {"key":"C","text":"Đau vùng gan"},
   {"key":"D","text":"Tất cả các dấu hiệu trên"}]'::jsonb,
 'D', 'Độc gan do thuốc có thể biểu hiện: vàng da/mắt, men gan tăng, đau gan, buồn nôn, mệt mỏi.', 10, true),

-- Câu hỏi về Dược lý lâm sàng
('Thời gian bán thải của thuốc có ý nghĩa gì trong ADR?',
 '[{"key":"A","text":"Xác định thời gian xuất hiện ADR"},
   {"key":"B","text":"Xác định thời gian ADR hết sau khi ngừng thuốc"},
   {"key":"C","text":"Xác định liều dùng thuốc"},
   {"key":"D","text":"Không liên quan đến ADR"}]'::jsonb,
 'B', 'Thời gian bán thải giúp dự đoán khi nào ADR sẽ hết sau khi ngừng thuốc. Thuốc bán thải dài có thể gây ADR kéo dài.', 10, true),

('Tương tác thuốc kiểu Pharmacodynamic là gì?',
 '[{"key":"A","text":"Thuốc ảnh hưởng đến hấp thu lẫn nhau"},
   {"key":"B","text":"Thuốc có tác dụng cộng hưởng hoặc đối kháng"},
   {"key":"C","text":"Thuốc ảnh hưởng đến chuyển hóa lẫn nhau"},
   {"key":"D","text":"Thuốc ảnh hưởng đến thải trừ lẫn nhau"}]'::jsonb,
 'B', 'Tương tác Pharmacodynamic xảy ra khi 2 thuốc có tác dụng cộng hưởng hoặc đối kháng tại cơ quan đích.', 10, true),

('CYP450 là gì và tại sao quan trọng trong ADR?',
 '[{"key":"A","text":"Enzyme chuyển hóa thuốc tại gan"},
   {"key":"B","text":"Protein vận chuyển thuốc trong máu"},
   {"key":"C","text":"Thụ thể của thuốc"},
   {"key":"D","text":"Kênh ion trên màng tế bào"}]'::jsonb,
 'A', 'CYP450 là hệ enzyme chuyển hóa thuốc tại gan. Sự khác biệt gen CYP450 dẫn đến nguy cơ ADR khác nhau giữa các cá nhân.', 10, true);

-- Verify
SELECT 
  COUNT(*) as total_questions,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_questions
FROM contest_questions;

SELECT 'Contest Questions Inserted Successfully - 25 câu hỏi mẫu!' as status;
