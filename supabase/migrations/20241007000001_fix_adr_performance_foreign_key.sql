-- Drop the existing foreign key constraint
ALTER TABLE public.adr_performance_assessments
DROP CONSTRAINT IF EXISTS adr_performance_assessments_user_id_fkey;

-- Add new foreign key referencing public.users instead of auth.users
ALTER TABLE public.adr_performance_assessments
ADD CONSTRAINT adr_performance_assessments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;




