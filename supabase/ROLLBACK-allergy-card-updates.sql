-- =====================================================
-- ROLLBACK SCRIPT
-- Xóa các bảng và triggers liên quan đến tính năng
-- Lịch sử Bổ sung Thẻ Dị Ứng
-- =====================================================
-- ⚠️ CẢNH BÁO: Script này sẽ XÓA DỮ LIỆU
-- Chỉ sử dụng khi cần rollback hoàn toàn
-- =====================================================

-- Backup data trước khi xóa (optional)
-- CREATE TABLE backup_allergy_card_updates AS SELECT * FROM allergy_card_updates;
-- CREATE TABLE backup_update_allergies AS SELECT * FROM update_allergies;

-- Step 1: Drop triggers
DROP TRIGGER IF EXISTS trigger_auto_add_approved_allergies ON update_allergies;
DROP TRIGGER IF EXISTS trigger_update_allergy_card_updates_timestamp ON allergy_card_updates;
DROP TRIGGER IF EXISTS trigger_update_update_allergies_timestamp ON update_allergies;

-- Step 2: Drop functions
DROP FUNCTION IF EXISTS auto_add_approved_allergies();
DROP FUNCTION IF EXISTS update_allergy_card_updates_timestamp();

-- Step 3: Drop view
DROP VIEW IF EXISTS allergy_card_updates_with_details;

-- Step 4: Drop indexes
DROP INDEX IF EXISTS idx_card_updates_card;
DROP INDEX IF EXISTS idx_card_updates_date;
DROP INDEX IF EXISTS idx_card_updates_organization;
DROP INDEX IF EXISTS idx_card_updates_facility;
DROP INDEX IF EXISTS idx_card_updates_type;

DROP INDEX IF EXISTS idx_update_allergies_update;
DROP INDEX IF EXISTS idx_update_allergies_allergen;
DROP INDEX IF EXISTS idx_update_allergies_approved;

-- Step 5: Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS update_allergies CASCADE;
DROP TABLE IF EXISTS allergy_card_updates CASCADE;

-- Rollback completed
SELECT 'Rollback completed! All update history tables, views, triggers, and functions have been removed.' as status;

-- Note: This will NOT affect the main allergy_cards and card_allergies tables
SELECT 'Main allergy_cards and card_allergies tables are preserved.' as note;

