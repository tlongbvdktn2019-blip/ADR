-- =====================================================
-- FIX CONTEST CREATED_BY FOREIGN KEY CONSTRAINT
-- =====================================================
-- Problem: contests table has foreign key to auth.users(id)
-- but the app uses public.users table for user management
-- Solution: Drop the foreign key constraint

-- 1. Check if the constraint exists
DO $$ 
BEGIN
    -- Drop the foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'contests_created_by_fkey' 
        AND table_name = 'contests'
    ) THEN
        ALTER TABLE contests DROP CONSTRAINT contests_created_by_fkey;
        RAISE NOTICE 'Dropped constraint contests_created_by_fkey';
    ELSE
        RAISE NOTICE 'Constraint contests_created_by_fkey does not exist';
    END IF;
END $$;

-- 2. Optionally, add a new constraint to reference public.users instead
-- Uncomment the following if you want to enforce referential integrity with public.users
-- ALTER TABLE contests 
-- ADD CONSTRAINT contests_created_by_fkey 
-- FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Verify the fix
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table
FROM pg_constraint
WHERE conrelid = 'contests'::regclass
  AND contype = 'f'
  AND conname LIKE '%created_by%';

-- Done!
SELECT 'Foreign key constraint fixed! You can now create contests.' as status;



