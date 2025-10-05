-- =====================================================
-- USER API KEYS MANAGEMENT SCHEMA
-- =====================================================

-- Table to store user's AI provider API keys
CREATE TABLE public.user_ai_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider character varying NOT NULL CHECK (provider IN ('openai', 'gemini')),
  api_key_encrypted text NOT NULL, -- Encrypted API key
  api_key_name character varying, -- User-friendly name
  is_active boolean DEFAULT true,
  is_valid boolean DEFAULT null, -- null = not tested, true = valid, false = invalid
  last_tested_at timestamp with time zone,
  test_result jsonb, -- Store test result details
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT user_ai_keys_pkey PRIMARY KEY (id),
  CONSTRAINT user_ai_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_ai_keys_unique_provider_per_user UNIQUE (user_id, provider, api_key_name)
);

-- Indexes for performance
CREATE INDEX idx_user_ai_keys_user_id ON public.user_ai_keys(user_id);
CREATE INDEX idx_user_ai_keys_provider ON public.user_ai_keys(provider);
CREATE INDEX idx_user_ai_keys_active ON public.user_ai_keys(user_id, is_active, is_valid);

-- Row Level Security (RLS)
ALTER TABLE public.user_ai_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own API keys
CREATE POLICY "Users can view own API keys" ON public.user_ai_keys
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own API keys
CREATE POLICY "Users can insert own API keys" ON public.user_ai_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own API keys
CREATE POLICY "Users can update own API keys" ON public.user_ai_keys
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own API keys
CREATE POLICY "Users can delete own API keys" ON public.user_ai_keys
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- USER AI USAGE TRACKING (Optional)
-- =====================================================

-- Table to track AI usage per user
CREATE TABLE public.user_ai_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  api_key_id uuid NOT NULL,
  provider character varying NOT NULL,
  tokens_used integer DEFAULT 0,
  request_count integer DEFAULT 1,
  cost_estimate numeric(10,6) DEFAULT 0,
  usage_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- Constraints
  CONSTRAINT user_ai_usage_pkey PRIMARY KEY (id),
  CONSTRAINT user_ai_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_ai_usage_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES public.user_ai_keys(id) ON DELETE CASCADE,
  CONSTRAINT user_ai_usage_unique_daily UNIQUE (user_id, api_key_id, usage_date)
);

-- Index for usage queries
CREATE INDEX idx_user_ai_usage_user_date ON public.user_ai_usage(user_id, usage_date);

-- RLS for usage tracking
ALTER TABLE public.user_ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON public.user_ai_usage
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update user_ai_keys updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_ai_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER trigger_update_user_ai_keys_updated_at
  BEFORE UPDATE ON public.user_ai_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ai_keys_updated_at();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert sample data (for testing)
-- Users will need to add their own API keys through the UI

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.user_ai_keys IS 'Stores encrypted API keys for AI providers (OpenAI, Gemini) per user';
COMMENT ON COLUMN public.user_ai_keys.api_key_encrypted IS 'Encrypted API key using application encryption';
COMMENT ON COLUMN public.user_ai_keys.api_key_name IS 'User-friendly name to distinguish multiple keys';
COMMENT ON COLUMN public.user_ai_keys.is_valid IS 'null=not tested, true=valid, false=invalid';
COMMENT ON COLUMN public.user_ai_keys.test_result IS 'JSON with test details: {success, error, tested_at, model_used}';

COMMENT ON TABLE public.user_ai_usage IS 'Tracks AI API usage per user per day for cost monitoring';


