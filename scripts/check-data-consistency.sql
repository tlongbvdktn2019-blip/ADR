-- =====================================================
-- SQL SCRIPT ĐỂ KIỂM TRA TÍNH NHẤT QUÁN DỮ LIỆU
-- Giúp xác định tại sao dữ liệu hiển thị khác nhau
-- giữa trang public và trang nội bộ
-- =====================================================

-- Thay đổi giá trị này theo thẻ bạn muốn kiểm tra
\set card_code 'AC-2025-000001'

\echo '════════════════════════════════════════════════════════════'
\echo 'KIỂM TRA DỮ LIỆU THẺ DỊ ỨNG'
\echo '════════════════════════════════════════════════════════════'
\echo ''

-- 1. Thông tin cơ bản của thẻ
\echo '📋 1. THÔNG TIN CƠ BẢN CỦA THẺ'
\echo '────────────────────────────────────────────────────────────'
SELECT 
    id,
    card_code,
    patient_name,
    hospital_name,
    status,
    issued_date,
    expiry_date,
    created_at,
    updated_at
FROM allergy_cards
WHERE card_code = :'card_code';

\echo ''

-- 2. Đếm số lượng dị ứng (Direct Query)
\echo '🔴 2. SỐ LƯỢNG DỊ ỨNG (Direct Query từ card_allergies)'
\echo '────────────────────────────────────────────────────────────'
SELECT 
    COUNT(*) as total_allergies,
    COUNT(CASE WHEN certainty_level = 'confirmed' THEN 1 END) as confirmed_count,
    COUNT(CASE WHEN certainty_level = 'suspected' THEN 1 END) as suspected_count,
    COUNT(CASE WHEN severity_level = 'life_threatening' THEN 1 END) as life_threatening_count,
    COUNT(CASE WHEN severity_level = 'severe' THEN 1 END) as severe_count
FROM card_allergies ca
JOIN allergy_cards ac ON ca.card_id = ac.id
WHERE ac.card_code = :'card_code';

\echo ''

-- 3. Danh sách chi tiết dị ứng
\echo '📝 3. DANH SÁCH CHI TIẾT DỊ ỨNG'
\echo '────────────────────────────────────────────────────────────'
SELECT 
    ca.id,
    ca.allergen_name,
    ca.certainty_level,
    ca.severity_level,
    ca.reaction_type,
    ca.clinical_manifestation,
    ca.created_at,
    ca.updated_at
FROM card_allergies ca
JOIN allergy_cards ac ON ca.card_id = ac.id
WHERE ac.card_code = :'card_code'
ORDER BY 
    CASE ca.severity_level
        WHEN 'life_threatening' THEN 1
        WHEN 'severe' THEN 2
        WHEN 'moderate' THEN 3
        WHEN 'mild' THEN 4
        ELSE 5
    END,
    ca.created_at DESC;

\echo ''

-- 4. Số lượng updates (lịch sử bổ sung)
\echo '📊 4. SỐ LƯỢNG LỊCH SỬ BỔ SUNG'
\echo '────────────────────────────────────────────────────────────'
SELECT 
    COUNT(*) as total_updates,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count,
    COUNT(CASE WHEN is_verified = false THEN 1 END) as unverified_count,
    COUNT(CASE WHEN update_type = 'new_allergy' THEN 1 END) as new_allergy_count,
    COUNT(CASE WHEN update_type = 'severity_update' THEN 1 END) as severity_update_count,
    COUNT(CASE WHEN update_type = 'additional_info' THEN 1 END) as additional_info_count
FROM allergy_card_updates acu
JOIN allergy_cards ac ON acu.card_id = ac.id
WHERE ac.card_code = :'card_code';

\echo ''

-- 5. Danh sách chi tiết updates
\echo '📋 5. DANH SÁCH CHI TIẾT LỊCH SỬ BỔ SUNG'
\echo '────────────────────────────────────────────────────────────'
SELECT 
    acu.id,
    acu.update_type,
    acu.updated_by_name,
    acu.updated_by_organization,
    acu.facility_name,
    acu.is_verified,
    acu.created_at,
    (
        SELECT COUNT(*) 
        FROM update_allergies ua 
        WHERE ua.update_id = acu.id
    ) as allergies_added_count
FROM allergy_card_updates acu
JOIN allergy_cards ac ON acu.card_id = ac.id
WHERE ac.card_code = :'card_code'
ORDER BY acu.created_at DESC;

\echo ''

-- 6. Kiểm tra view có khớp với direct query không
\echo '🔍 6. SO SÁNH VIEW vs DIRECT QUERY'
\echo '────────────────────────────────────────────────────────────'

-- 6a. Đếm từ view
\echo 'Từ VIEW (allergy_cards_with_details):'
SELECT 
    card_code,
    jsonb_array_length(COALESCE(allergies, '[]'::jsonb)) as allergies_count_from_view
FROM allergy_cards_with_details
WHERE card_code = :'card_code';

\echo ''
\echo 'Từ DIRECT QUERY (card_allergies table):'
-- 6b. Đếm từ direct query
SELECT 
    ac.card_code,
    COUNT(ca.id) as allergies_count_from_direct_query
FROM allergy_cards ac
LEFT JOIN card_allergies ca ON ca.card_id = ac.id
WHERE ac.card_code = :'card_code'
GROUP BY ac.card_code;

\echo ''

-- 7. Kiểm tra dị ứng từ updates đã được thêm vào card_allergies chưa
\echo '🔄 7. KIỂM TRA ĐỒI BỘ: Updates → Card Allergies'
\echo '────────────────────────────────────────────────────────────'
\echo 'Các dị ứng từ updates mà CHƯA được thêm vào card_allergies:'

SELECT 
    ua.allergen_name as allergen_from_update,
    acu.updated_by_name,
    acu.facility_name,
    acu.created_at as update_date,
    CASE 
        WHEN ca.id IS NULL THEN '❌ CHƯA có trong card_allergies'
        ELSE '✅ Đã có trong card_allergies'
    END as sync_status
FROM update_allergies ua
JOIN allergy_card_updates acu ON ua.update_id = acu.id
JOIN allergy_cards ac ON acu.card_id = ac.id
LEFT JOIN card_allergies ca ON ca.card_id = ac.id AND ca.allergen_name = ua.allergen_name
WHERE ac.card_code = :'card_code'
ORDER BY acu.created_at DESC;

\echo ''

-- 8. Kiểm tra timestamps (có thể là vấn đề cache)
\echo '⏰ 8. KIỂM TRA TIMESTAMPS'
\echo '────────────────────────────────────────────────────────────'
SELECT 
    'Card' as record_type,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutes_since_last_update
FROM allergy_cards
WHERE card_code = :'card_code'

UNION ALL

SELECT 
    'Last Allergy' as record_type,
    MIN(created_at) as created_at,
    MAX(updated_at) as updated_at,
    EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) / 60 as minutes_since_last_update
FROM card_allergies ca
JOIN allergy_cards ac ON ca.card_id = ac.id
WHERE ac.card_code = :'card_code'

UNION ALL

SELECT 
    'Last Update' as record_type,
    MIN(created_at) as created_at,
    MAX(created_at) as updated_at,
    EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 60 as minutes_since_last_update
FROM allergy_card_updates acu
JOIN allergy_cards ac ON acu.card_id = ac.id
WHERE ac.card_code = :'card_code';

\echo ''

-- 9. Kiểm tra RLS có ảnh hưởng không
\echo '🔒 9. KIỂM TRA ROW LEVEL SECURITY (RLS)'
\echo '────────────────────────────────────────────────────────────'
\echo 'RLS policies on allergy_cards:'
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'allergy_cards';

\echo ''
\echo 'RLS policies on card_allergies:'
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'card_allergies';

\echo ''
\echo 'RLS policies on allergy_card_updates:'
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'allergy_card_updates';

\echo ''

-- 10. View definition (để kiểm tra có vấn đề không)
\echo '📐 10. KIỂM TRA ĐỊNH NGHĨA VIEW'
\echo '────────────────────────────────────────────────────────────'
SELECT pg_get_viewdef('allergy_cards_with_details', true);

\echo ''

-- 11. Tổng hợp cuối cùng
\echo '📊 11. TỔNG HỢP CUỐI CÙNG'
\echo '════════════════════════════════════════════════════════════'

WITH card_info AS (
    SELECT 
        ac.id,
        ac.card_code,
        ac.patient_name,
        ac.status,
        COUNT(DISTINCT ca.id) as direct_allergies_count,
        COUNT(DISTINCT acu.id) as updates_count,
        COUNT(DISTINCT ua.id) as update_allergies_count
    FROM allergy_cards ac
    LEFT JOIN card_allergies ca ON ca.card_id = ac.id
    LEFT JOIN allergy_card_updates acu ON acu.card_id = ac.id
    LEFT JOIN update_allergies ua ON ua.update_id = acu.id
    WHERE ac.card_code = :'card_code'
    GROUP BY ac.id, ac.card_code, ac.patient_name, ac.status
),
view_info AS (
    SELECT 
        card_code,
        jsonb_array_length(COALESCE(allergies, '[]'::jsonb)) as view_allergies_count
    FROM allergy_cards_with_details
    WHERE card_code = :'card_code'
)

SELECT 
    ci.card_code,
    ci.patient_name,
    ci.status,
    ci.direct_allergies_count as "Dị ứng (Direct Query)",
    vi.view_allergies_count as "Dị ứng (View)",
    CASE 
        WHEN ci.direct_allergies_count = vi.view_allergies_count 
        THEN '✅ KHỚP'
        ELSE '❌ KHÔNG KHỚP'
    END as "Trạng thái đồng bộ",
    ci.updates_count as "Số lượng updates",
    ci.update_allergies_count as "Dị ứng từ updates"
FROM card_info ci
LEFT JOIN view_info vi ON vi.card_code = ci.card_code;

\echo ''

-- 12. Khuyến nghị
\echo '💡 12. KHUYẾN NGHỊ'
\echo '════════════════════════════════════════════════════════════'
\echo ''
\echo 'Nếu số liệu không khớp, hãy:'
\echo ''
\echo '  1. Kiểm tra xem view có được refresh chưa:'
\echo '     REFRESH MATERIALIZED VIEW allergy_cards_with_details;'
\echo ''
\echo '  2. Hoặc xem xét query trực tiếp thay vì dùng view'
\echo ''
\echo '  3. Kiểm tra RLS có đang block dữ liệu không'
\echo ''
\echo '  4. Xem file PHAN-TICH-KHAC-BIET-TRANG-PUBLIC-NOI-BO.md'
\echo '     để biết thêm chi tiết và giải pháp'
\echo ''
\echo '════════════════════════════════════════════════════════════'

