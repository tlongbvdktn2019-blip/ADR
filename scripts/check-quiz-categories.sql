-- Kiểm tra các danh mục quiz có sẵn
SELECT 
  id,
  name,
  category_key,
  description,
  total_questions,
  is_active
FROM quiz_categories 
WHERE is_active = true
ORDER BY name;

-- Kiểm tra số lượng câu hỏi hiện tại theo category
SELECT 
  c.name,
  c.category_key,
  COUNT(q.id) as current_questions,
  c.total_questions as expected_questions
FROM quiz_categories c
LEFT JOIN quiz_questions q ON c.id = q.category_id AND q.is_active = true
WHERE c.is_active = true
GROUP BY c.id, c.name, c.category_key, c.total_questions
ORDER BY c.name;
