-- Fix RLS policies for allergy cards to avoid infinite recursion
-- The issue is in lines 121-124 and 138 of allergy-cards-schema.sql

-- Drop problematic policies
DROP POLICY IF EXISTS "Admins can view all allergy cards" ON allergy_cards;
DROP POLICY IF EXISTS "Card allergies follow card access" ON card_allergies;

-- Create safe policies that don't query users table in a way that causes recursion
-- Users can manage their own cards
CREATE POLICY "Users can manage own allergy cards" ON allergy_cards 
FOR ALL USING (issued_by_user_id::text = auth.uid()::text);

-- Card allergies follow parent card permissions (simplified)
CREATE POLICY "Users can manage card allergies" ON card_allergies 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM allergy_cards ac
    WHERE ac.id = card_allergies.card_id
    AND ac.issued_by_user_id::text = auth.uid()::text
  )
);

-- For admin access, we'll use service role key in API
-- No admin policies to avoid recursion

COMMENT ON POLICY "Users can manage own allergy cards" ON allergy_cards 
IS 'Users can manage allergy cards they issued - admin operations use service role key';

COMMENT ON POLICY "Users can manage card allergies" ON card_allergies 
IS 'Card allergies follow parent card permissions - simplified to avoid recursion';








