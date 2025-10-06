-- Migration: Add UNIQUE constraint to treatment_drugs.name
-- This is required for INSERT ... ON CONFLICT to work
-- Date: 2025-10-05

-- Step 1: Remove any duplicate names first (if exists)
DELETE FROM public.treatment_drugs a
USING public.treatment_drugs b
WHERE a.id > b.id 
AND a.name = b.name;

-- Step 2: Add UNIQUE constraint to name column
ALTER TABLE public.treatment_drugs 
ADD CONSTRAINT treatment_drugs_name_unique UNIQUE (name);

-- Step 3: Verify the constraint
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.treatment_drugs'::regclass
AND conname = 'treatment_drugs_name_unique';



