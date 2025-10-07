-- Add RLS policy for admin to delete any assessment (regardless of status)
CREATE POLICY "Admins can delete any assessment"
    ON public.adr_performance_assessments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

