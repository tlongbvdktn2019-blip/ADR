#!/usr/bin/env python3
"""
CSV to SQL Converter cho ADR Training Quiz Questions
Chuyển đổi file CSV chứa câu hỏi thành SQL INSERT statements

CSV Format:
category_key,question_text,question_type,difficulty,option_a,option_b,option_c,option_d,correct_answer,explanation,reference_source,learning_point_1,learning_point_2,learning_point_3,estimated_time,points

Ví dụ:
who_umc,"Theo WHO-UMC, mức độ nào yêu cầu rechallenge positive?",multiple_choice,advanced,"Certain","Probable","Possible","Unlikely",A,"Mức độ Certain yêu cầu rechallenge positive...","WHO Guidelines","Certain cần rechallenge","Bằng chứng mạnh nhất","An toàn bệnh nhân quan trọng",120,20
"""

import csv
import json
import argparse
import sys
from pathlib import Path

def escape_sql_string(text):
    """Escape single quotes and other special characters for SQL"""
    if not text:
        return ""
    return text.replace("'", "''").replace("\\", "\\\\")

def create_options_json(option_a, option_b, option_c=None, option_d=None, question_type='multiple_choice'):
    """Create JSON options array based on question type"""
    
    if question_type == 'true_false':
        return [
            {"key": "true", "text": "Đúng"},
            {"key": "false", "text": "Sai"}
        ]
    
    options = []
    if option_a:
        options.append({"key": "A", "text": option_a})
    if option_b:
        options.append({"key": "B", "text": option_b})
    if option_c:
        options.append({"key": "C", "text": option_c})
    if option_d:
        options.append({"key": "D", "text": option_d})
    
    return options

def create_learning_points_array(point1, point2=None, point3=None):
    """Create learning points array, filtering out empty values"""
    points = []
    if point1:
        points.append(point1)
    if point2:
        points.append(point2)
    if point3:
        points.append(point3)
    return points

def convert_csv_to_sql(csv_file_path, output_file_path):
    """Convert CSV file to SQL INSERT statements"""
    
    sql_template = """INSERT INTO quiz_questions (
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
    (SELECT id FROM quiz_categories WHERE category_key = '{category_key}' LIMIT 1),
    '{question_text}',
    '{question_type}',
    '{difficulty}',
    '{options}'::jsonb,
    '{correct_answer}',
    '{explanation}',
    '{reference_source}',
    ARRAY{learning_points},
    {estimated_time_seconds},
    {points_value},
    true,
    'approved'
);

"""

    try:
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            sql_statements = []
            sql_statements.append("-- Generated SQL from CSV: " + str(csv_file_path))
            sql_statements.append("-- Auto-generated on: " + str(datetime.now()))
            sql_statements.append("")
            
            for row_num, row in enumerate(reader, start=2):
                try:
                    # Validate required fields
                    required_fields = ['category_key', 'question_text', 'question_type', 
                                     'difficulty', 'correct_answer', 'explanation']
                    
                    for field in required_fields:
                        if not row.get(field, '').strip():
                            print(f"Warning: Row {row_num} missing required field '{field}'")
                            continue
                    
                    # Create options JSON
                    options = create_options_json(
                        row.get('option_a', ''),
                        row.get('option_b', ''), 
                        row.get('option_c', ''),
                        row.get('option_d', ''),
                        row['question_type']
                    )
                    options_json = json.dumps(options, ensure_ascii=False)
                    
                    # Create learning points array
                    learning_points = create_learning_points_array(
                        row.get('learning_point_1', ''),
                        row.get('learning_point_2', ''),
                        row.get('learning_point_3', '')
                    )
                    
                    # Format learning points for SQL ARRAY
                    if learning_points:
                        learning_points_sql = "['" + "','".join([escape_sql_string(p) for p in learning_points]) + "']"
                    else:
                        learning_points_sql = "[]"
                    
                    # Get estimated time and points with defaults
                    estimated_time = int(row.get('estimated_time', 60))
                    points_value = int(row.get('points', 10))
                    
                    # Generate SQL statement
                    sql = sql_template.format(
                        category_key=row['category_key'],
                        question_text=escape_sql_string(row['question_text']),
                        question_type=row['question_type'],
                        difficulty=row['difficulty'],
                        options=options_json.replace("'", "''"),  # Escape quotes for JSON
                        correct_answer=row['correct_answer'],
                        explanation=escape_sql_string(row['explanation']),
                        reference_source=escape_sql_string(row.get('reference_source', '')),
                        learning_points=learning_points_sql,
                        estimated_time_seconds=estimated_time,
                        points_value=points_value
                    )
                    
                    sql_statements.append(sql)
                    
                except Exception as e:
                    print(f"Error processing row {row_num}: {e}")
                    continue
            
            # Add update statement for category counts
            sql_statements.append("""
-- Update category question counts
UPDATE quiz_categories SET total_questions = (
    SELECT COUNT(*) 
    FROM quiz_questions 
    WHERE quiz_questions.category_id = quiz_categories.id 
    AND is_active = true
    AND review_status = 'approved'
);

-- Display import results
SELECT 
    c.name as category_name,
    COUNT(q.id) as question_count
FROM quiz_categories c
LEFT JOIN quiz_questions q ON c.id = q.category_id 
    AND q.is_active = true 
    AND q.review_status = 'approved'
WHERE c.is_active = true
GROUP BY c.id, c.name
ORDER BY c.name;
""")
            
            # Write to output file
            with open(output_file_path, 'w', encoding='utf-8') as outfile:
                outfile.write('\n'.join(sql_statements))
            
            print(f"✅ Successfully converted {len(sql_statements)-3} questions from CSV to SQL")
            print(f"📄 Output file: {output_file_path}")
            
    except FileNotFoundError:
        print(f"❌ CSV file not found: {csv_file_path}")
        return False
    except Exception as e:
        print(f"❌ Error converting CSV: {e}")
        return False
    
    return True

def create_sample_csv(output_path):
    """Create a sample CSV file for reference"""
    sample_data = [
        {
            'category_key': 'who_umc',
            'question_text': 'Theo WHO-UMC, mức độ "Conditional" được sử dụng khi nào?',
            'question_type': 'multiple_choice',
            'difficulty': 'intermediate',
            'option_a': 'Khi cần thêm thông tin để đánh giá',
            'option_b': 'Khi chắc chắn không liên quan đến thuốc',
            'option_c': 'Khi có đầy đủ bằng chứng',
            'option_d': 'Khi không đủ thông tin đánh giá',
            'correct_answer': 'A',
            'explanation': 'Mức độ Conditional được sử dụng khi cần thêm dữ liệu hoặc thông tin bổ sung để có thể đưa ra đánh giá hợp lý về mối liên quan nhân-quả.',
            'reference_source': 'WHO-UMC Guidelines 2018',
            'learning_point_1': 'Conditional = cần thêm thông tin',
            'learning_point_2': 'Khác với Unassessable',
            'learning_point_3': 'Có thể đánh giá được khi có thêm data',
            'estimated_time': '75',
            'points': '15'
        },
        {
            'category_key': 'naranjo',
            'question_text': 'Thang Naranjo có thể cho điểm âm không?',
            'question_type': 'true_false', 
            'difficulty': 'beginner',
            'option_a': '',  # Will be ignored for true/false
            'option_b': '',
            'option_c': '',
            'option_d': '',
            'correct_answer': 'true',
            'explanation': 'Đúng. Thang Naranjo có thể cho điểm từ -4 đến +13. Điểm âm xuất hiện khi có các yếu tố loại trừ khả năng ADR.',
            'reference_source': 'Naranjo Algorithm 1981',
            'learning_point_1': 'Range: -4 to +13',
            'learning_point_2': 'Điểm âm = loại trừ ADR',
            'learning_point_3': '',
            'estimated_time': '45',
            'points': '10'
        }
    ]
    
    with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['category_key', 'question_text', 'question_type', 'difficulty',
                     'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer',
                     'explanation', 'reference_source', 'learning_point_1', 
                     'learning_point_2', 'learning_point_3', 'estimated_time', 'points']
        
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for row in sample_data:
            writer.writerow(row)
    
    print(f"✅ Sample CSV file created: {output_path}")

def main():
    parser = argparse.ArgumentParser(description='Convert CSV quiz questions to SQL')
    parser.add_argument('--csv', help='Input CSV file path')
    parser.add_argument('--sql', help='Output SQL file path')
    parser.add_argument('--sample', action='store_true', help='Create sample CSV file')
    
    args = parser.parse_args()
    
    if args.sample:
        create_sample_csv('sample_questions.csv')
        print("\n📋 CSV Format:")
        print("category_key: who_umc, naranjo, drug_knowledge, case_studies, regulations, general")
        print("question_type: multiple_choice, true_false, case_scenario") 
        print("difficulty: beginner, intermediate, advanced, expert")
        print("correct_answer: A, B, C, D (for multiple_choice) or true, false (for true_false)")
        return
    
    if not args.csv or not args.sql:
        print("❌ Please provide both --csv and --sql arguments")
        print("Use --sample to create a sample CSV file")
        print("\nExample:")
        print("python csv-to-sql-converter.py --csv questions.csv --sql questions.sql")
        return
    
    success = convert_csv_to_sql(args.csv, args.sql)
    
    if success:
        print("\n🚀 Next steps:")
        print(f"1. Review the generated SQL file: {args.sql}")
        print("2. Upload to Supabase SQL Editor")
        print("3. Execute the SQL statements")
        print("4. Check the results in quiz_questions table")

if __name__ == "__main__":
    import datetime
    main()



























