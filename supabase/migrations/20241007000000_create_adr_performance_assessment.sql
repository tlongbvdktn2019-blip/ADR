-- Create table for ADR performance assessments
CREATE TABLE IF NOT EXISTS public.adr_performance_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_score DECIMAL(10,2) DEFAULT 0,
    max_score DECIMAL(10,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'final')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table for individual indicator answers
CREATE TABLE IF NOT EXISTS public.adr_performance_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.adr_performance_assessments(id) ON DELETE CASCADE,
    indicator_code VARCHAR(10) NOT NULL, -- e.g., "2.2", "2.3", etc.
    indicator_type VARCHAR(1) NOT NULL CHECK (indicator_type IN ('C', 'P')), -- C: main, P: secondary
    category VARCHAR(1) NOT NULL CHECK (category IN ('A', 'B', 'C', 'D', 'E')),
    question TEXT NOT NULL,
    answer BOOLEAN, -- true = Có, false = Không, null = chưa trả lời
    score DECIMAL(5,2) DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assessment_id, indicator_code)
);

-- Create index for faster queries
CREATE INDEX idx_adr_performance_assessments_user_id ON public.adr_performance_assessments(user_id);
CREATE INDEX idx_adr_performance_assessments_date ON public.adr_performance_assessments(assessment_date);
CREATE INDEX idx_adr_performance_answers_assessment_id ON public.adr_performance_answers(assessment_id);
CREATE INDEX idx_adr_performance_answers_category ON public.adr_performance_answers(category);

-- Enable RLS
ALTER TABLE public.adr_performance_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adr_performance_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for adr_performance_assessments
-- Users can view their own assessments
CREATE POLICY "Users can view own assessments"
    ON public.adr_performance_assessments FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own assessments
CREATE POLICY "Users can insert own assessments"
    ON public.adr_performance_assessments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own assessments
CREATE POLICY "Users can update own assessments"
    ON public.adr_performance_assessments FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own draft assessments
CREATE POLICY "Users can delete own draft assessments"
    ON public.adr_performance_assessments FOR DELETE
    USING (auth.uid() = user_id AND status = 'draft');

-- Admins can view all assessments
CREATE POLICY "Admins can view all assessments"
    ON public.adr_performance_assessments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- RLS Policies for adr_performance_answers
-- Users can view answers for their assessments
CREATE POLICY "Users can view own answers"
    ON public.adr_performance_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.adr_performance_assessments
            WHERE adr_performance_assessments.id = assessment_id
            AND adr_performance_assessments.user_id = auth.uid()
        )
    );

-- Users can insert answers for their assessments
CREATE POLICY "Users can insert own answers"
    ON public.adr_performance_answers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.adr_performance_assessments
            WHERE adr_performance_assessments.id = assessment_id
            AND adr_performance_assessments.user_id = auth.uid()
        )
    );

-- Users can update answers for their assessments
CREATE POLICY "Users can update own answers"
    ON public.adr_performance_answers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.adr_performance_assessments
            WHERE adr_performance_assessments.id = assessment_id
            AND adr_performance_assessments.user_id = auth.uid()
        )
    );

-- Users can delete answers for their assessments
CREATE POLICY "Users can delete own answers"
    ON public.adr_performance_answers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.adr_performance_assessments
            WHERE adr_performance_assessments.id = assessment_id
            AND adr_performance_assessments.user_id = auth.uid()
        )
    );

-- Admins can view all answers
CREATE POLICY "Admins can view all answers"
    ON public.adr_performance_answers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_adr_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_adr_performance_assessments_updated_at
    BEFORE UPDATE ON public.adr_performance_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_adr_performance_updated_at();

CREATE TRIGGER update_adr_performance_answers_updated_at
    BEFORE UPDATE ON public.adr_performance_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_adr_performance_updated_at();

-- Function to calculate assessment score
CREATE OR REPLACE FUNCTION calculate_assessment_score(p_assessment_id UUID)
RETURNS void AS $$
DECLARE
    v_total_score DECIMAL(10,2);
    v_max_score DECIMAL(10,2);
    v_percentage DECIMAL(5,2);
BEGIN
    -- Calculate total score and max score
    SELECT 
        COALESCE(SUM(score), 0),
        COALESCE(SUM(CASE 
            WHEN indicator_type = 'C' THEN 2
            WHEN indicator_type = 'P' THEN 1
            ELSE 0
        END), 0)
    INTO v_total_score, v_max_score
    FROM public.adr_performance_answers
    WHERE assessment_id = p_assessment_id;

    -- Calculate percentage
    IF v_max_score > 0 THEN
        v_percentage := (v_total_score / v_max_score) * 100;
    ELSE
        v_percentage := 0;
    END IF;

    -- Update assessment
    UPDATE public.adr_performance_assessments
    SET 
        total_score = v_total_score,
        max_score = v_max_score,
        percentage = v_percentage,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_assessment_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate score when answers change
CREATE OR REPLACE FUNCTION trigger_calculate_score()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_assessment_score(
        COALESCE(NEW.assessment_id, OLD.assessment_id)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_score_on_answer_change
    AFTER INSERT OR UPDATE OR DELETE ON public.adr_performance_answers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_score();

