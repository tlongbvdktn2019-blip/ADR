-- Simple Migration: Create concurrent_drugs table for ADR reports
-- This table stores information about drugs used concurrently with suspected drugs

-- Create concurrent_drugs table
CREATE TABLE IF NOT EXISTS concurrent_drugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES adr_reports(id) ON DELETE CASCADE,
    drug_name TEXT NOT NULL,
    dosage_form_strength TEXT, -- Dạng bào chế, hàm lượng
    start_date DATE, -- Ngày bắt đầu điều trị
    end_date DATE, -- Ngày kết thúc điều trị
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_concurrent_drugs_report_id ON concurrent_drugs(report_id);
CREATE INDEX IF NOT EXISTS idx_concurrent_drugs_drug_name ON concurrent_drugs(drug_name);

-- Add comments for documentation
COMMENT ON TABLE concurrent_drugs IS 'Thuốc dùng đồng thời với thuốc nghi ngờ gây ADR';
COMMENT ON COLUMN concurrent_drugs.id IS 'UUID khóa chính';
COMMENT ON COLUMN concurrent_drugs.report_id IS 'Tham chiếu đến báo cáo ADR';
COMMENT ON COLUMN concurrent_drugs.drug_name IS 'Tên thuốc dùng đồng thời';
COMMENT ON COLUMN concurrent_drugs.dosage_form_strength IS 'Dạng bào chế và hàm lượng (VD: Viên nén 500mg)';
COMMENT ON COLUMN concurrent_drugs.start_date IS 'Ngày bắt đầu sử dụng thuốc';
COMMENT ON COLUMN concurrent_drugs.end_date IS 'Ngày kết thúc sử dụng thuốc';

-- Create RLS (Row Level Security) policies
ALTER TABLE concurrent_drugs ENABLE ROW LEVEL SECURITY;

-- Simple policies that don't cause recursion
-- Users can only access concurrent drugs of reports they own
CREATE POLICY "Users can view concurrent drugs of their reports"
    ON concurrent_drugs FOR SELECT
    USING (
        report_id IN (
            SELECT id FROM adr_reports 
            WHERE reporter_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert concurrent drugs for their reports"
    ON concurrent_drugs FOR INSERT
    WITH CHECK (
        report_id IN (
            SELECT id FROM adr_reports 
            WHERE reporter_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update concurrent drugs of their reports"
    ON concurrent_drugs FOR UPDATE
    USING (
        report_id IN (
            SELECT id FROM adr_reports 
            WHERE reporter_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete concurrent drugs of their reports"
    ON concurrent_drugs FOR DELETE
    USING (
        report_id IN (
            SELECT id FROM adr_reports 
            WHERE reporter_id::text = auth.uid()::text
        )
    );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_concurrent_drugs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate it
DROP TRIGGER IF EXISTS update_concurrent_drugs_updated_at ON concurrent_drugs;

CREATE TRIGGER update_concurrent_drugs_updated_at
    BEFORE UPDATE ON concurrent_drugs
    FOR EACH ROW
    EXECUTE FUNCTION update_concurrent_drugs_updated_at();

-- Insert sample data for testing (optional)
-- This will be automatically linked to existing reports if any exist
INSERT INTO concurrent_drugs (report_id, drug_name, dosage_form_strength, start_date, end_date)
SELECT 
    r.id as report_id,
    CASE 
        WHEN row_number() OVER (ORDER BY r.created_at) % 3 = 1 THEN 'Vitamin C'
        WHEN row_number() OVER (ORDER BY r.created_at) % 3 = 2 THEN 'Paracetamol'
        ELSE 'Omeprazole'
    END as drug_name,
    CASE 
        WHEN row_number() OVER (ORDER BY r.created_at) % 3 = 1 THEN 'Viên nang 500mg'
        WHEN row_number() OVER (ORDER BY r.created_at) % 3 = 2 THEN 'Viên nén 500mg'
        ELSE 'Viên nang 20mg'
    END as dosage_form_strength,
    (r.adr_occurrence_date::date - INTERVAL '5 days')::date as start_date,
    (r.adr_occurrence_date::date + INTERVAL '2 days')::date as end_date
FROM adr_reports r
WHERE EXISTS (SELECT 1 FROM adr_reports LIMIT 1)
LIMIT 3
ON CONFLICT DO NOTHING;

-- Add success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully created concurrent_drugs table with simple RLS policies';
    RAISE NOTICE 'Table includes proper indexes and sample data for testing';
END
$$;
