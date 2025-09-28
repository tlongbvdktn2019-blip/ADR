-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE severity_level AS ENUM ('death', 'life_threatening', 'hospitalization', 'birth_defect', 'permanent_disability', 'not_serious');
CREATE TYPE outcome_after_treatment AS ENUM ('death_by_adr', 'death_unrelated', 'not_recovered', 'recovering', 'recovered_with_sequelae', 'recovered_without_sequelae', 'unknown');
CREATE TYPE causality_assessment AS ENUM ('certain', 'probable', 'possible', 'unlikely', 'unclassified', 'unclassifiable');
CREATE TYPE assessment_scale AS ENUM ('who', 'naranjo');
CREATE TYPE report_type AS ENUM ('initial', 'follow_up');
CREATE TYPE drug_reaction_assessment AS ENUM ('yes', 'no', 'not_stopped', 'no_information', 'not_rechallenged');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    organization VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create ADR reports table
CREATE TABLE adr_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_code VARCHAR(50) UNIQUE NOT NULL,
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization VARCHAR(255) NOT NULL,
    
    -- Thông tin bệnh nhân (Phần A)
    patient_name VARCHAR(255) NOT NULL,
    patient_birth_date DATE NOT NULL,
    patient_age INTEGER NOT NULL CHECK (patient_age >= 0 AND patient_age <= 150),
    patient_gender gender NOT NULL,
    patient_weight DECIMAL(5,2) CHECK (patient_weight > 0 AND patient_weight <= 500),
    
    -- Thông tin ADR (Phần B)
    adr_occurrence_date DATE NOT NULL,
    adr_description TEXT NOT NULL,
    related_tests TEXT,
    medical_history TEXT,
    treatment_response TEXT,
    severity_level severity_level NOT NULL,
    outcome_after_treatment outcome_after_treatment NOT NULL,
    
    -- Thẩm định ADR (Phần D)
    causality_assessment causality_assessment NOT NULL,
    assessment_scale assessment_scale NOT NULL,
    medical_staff_comment TEXT,
    
    -- Thông tin người báo cáo (Phần E)
    reporter_name VARCHAR(255) NOT NULL,
    reporter_profession VARCHAR(255) NOT NULL,
    reporter_phone VARCHAR(20),
    reporter_email VARCHAR(255),
    report_type report_type NOT NULL,
    report_date DATE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create suspected drugs table (Phần C)
CREATE TABLE suspected_drugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES adr_reports(id) ON DELETE CASCADE,
    drug_name VARCHAR(255) NOT NULL,
    commercial_name VARCHAR(255),
    dosage_form VARCHAR(255),
    manufacturer VARCHAR(255),
    batch_number VARCHAR(100),
    dosage_and_frequency TEXT,
    route_of_administration VARCHAR(255),
    start_date DATE,
    end_date DATE,
    indication TEXT,
    
    -- Câu hỏi đánh giá
    reaction_improved_after_stopping drug_reaction_assessment NOT NULL,
    reaction_reoccurred_after_rechallenge drug_reaction_assessment NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes for better performance
CREATE INDEX idx_adr_reports_reporter_id ON adr_reports(reporter_id);
CREATE INDEX idx_adr_reports_organization ON adr_reports(organization);
CREATE INDEX idx_adr_reports_report_date ON adr_reports(report_date);
CREATE INDEX idx_adr_reports_severity_level ON adr_reports(severity_level);
CREATE INDEX idx_suspected_drugs_report_id ON suspected_drugs(report_id);
CREATE INDEX idx_suspected_drugs_drug_name ON suspected_drugs(drug_name);

-- Function to generate report code
CREATE OR REPLACE FUNCTION generate_report_code()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix VARCHAR(4);
    counter INTEGER;
    new_code VARCHAR(50);
BEGIN
    year_prefix := TO_CHAR(NEW.created_at, 'YYYY');
    
    -- Get the next number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(report_code FROM 6) AS INTEGER)), 0) + 1
    INTO counter
    FROM adr_reports 
    WHERE report_code LIKE year_prefix || '-%';
    
    new_code := year_prefix || '-' || LPAD(counter::TEXT, 6, '0');
    NEW.report_code := new_code;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate report code
CREATE TRIGGER trigger_generate_report_code
    BEFORE INSERT ON adr_reports
    FOR EACH ROW
    EXECUTE FUNCTION generate_report_code();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_adr_reports_updated_at
    BEFORE UPDATE ON adr_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_suspected_drugs_updated_at
    BEFORE UPDATE ON suspected_drugs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE adr_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspected_drugs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert users" ON users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

-- RLS Policies for adr_reports table
CREATE POLICY "Users can view their own reports" ON adr_reports
    FOR SELECT USING (reporter_id::text = auth.uid()::text);

CREATE POLICY "Admins can view all reports" ON adr_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Users can insert their own reports" ON adr_reports
    FOR INSERT WITH CHECK (reporter_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own reports" ON adr_reports
    FOR UPDATE USING (reporter_id::text = auth.uid()::text);

CREATE POLICY "Admins can update all reports" ON adr_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete reports" ON adr_reports
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

-- RLS Policies for suspected_drugs table
CREATE POLICY "Users can view drugs from their own reports" ON suspected_drugs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM adr_reports 
            WHERE id = suspected_drugs.report_id 
            AND reporter_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view all drugs" ON suspected_drugs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Users can insert drugs for their own reports" ON suspected_drugs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM adr_reports 
            WHERE id = report_id 
            AND reporter_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update drugs from their own reports" ON suspected_drugs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM adr_reports 
            WHERE id = suspected_drugs.report_id 
            AND reporter_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Admins can update all drugs" ON suspected_drugs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

CREATE POLICY "Users and admins can delete drugs" ON suspected_drugs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM adr_reports 
            WHERE id = suspected_drugs.report_id 
            AND reporter_id::text = auth.uid()::text
        ) OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );