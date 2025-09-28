-- Simple fix for RLS infinite recursion
-- Disable problematic policies and create simpler ones

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;  
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can view all reports" ON adr_reports;
DROP POLICY IF EXISTS "Admins can update all reports" ON adr_reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON adr_reports;
DROP POLICY IF EXISTS "Admins can view all drugs" ON suspected_drugs;
DROP POLICY IF EXISTS "Admins can update all drugs" ON suspected_drugs;

-- For allergy cards, also drop admin policies that might cause issues
DROP POLICY IF EXISTS "Admins can view all allergy cards" ON allergy_cards;

-- Create simple policies that don't cause recursion
-- Users can always view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (id::text = auth.uid()::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (id::text = auth.uid()::text);

-- For admin operations, we'll rely on service role key in API
-- No RLS policies for admin operations to avoid recursion

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON adr_reports
    FOR SELECT USING (reporter_id::text = auth.uid()::text);

-- Users can insert their own reports  
CREATE POLICY "Users can insert own reports" ON adr_reports
    FOR INSERT WITH CHECK (reporter_id::text = auth.uid()::text);

-- Users can update their own reports
CREATE POLICY "Users can update own reports" ON adr_reports
    FOR UPDATE USING (reporter_id::text = auth.uid()::text);

-- Users can view drugs from their own reports
CREATE POLICY "Users can view own report drugs" ON suspected_drugs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM adr_reports 
            WHERE id = suspected_drugs.report_id 
            AND reporter_id::text = auth.uid()::text
        )
    );

-- Users can manage drugs for their own reports
CREATE POLICY "Users can manage own report drugs" ON suspected_drugs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM adr_reports 
            WHERE id = suspected_drugs.report_id 
            AND reporter_id::text = auth.uid()::text
        )
    );

-- For allergy cards - users can manage their own cards
CREATE POLICY "Users can manage own allergy cards" ON allergy_cards 
    FOR ALL USING (issued_by_user_id::text = auth.uid()::text);

-- Card allergies follow parent card permissions
CREATE POLICY "Users can manage card allergies" ON card_allergies 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM allergy_cards ac
            WHERE ac.id = card_allergies.card_id
            AND ac.issued_by_user_id::text = auth.uid()::text
        )
    );

-- Add comment
COMMENT ON POLICY "Users can view own profile" ON users IS 'Simple policy to avoid recursion - admin operations use service role key';

-- Grant permissions for service role operations
-- The API will use service role key for admin operations
GRANT ALL ON users TO service_role;
GRANT ALL ON adr_reports TO service_role;  
GRANT ALL ON suspected_drugs TO service_role;
GRANT ALL ON allergy_cards TO service_role;
GRANT ALL ON card_allergies TO service_role;








