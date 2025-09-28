-- =====================================================
-- ADR INFORMATION MANAGEMENT SYSTEM
-- Database Schema for ADR Information/News Feature
-- =====================================================

-- Create enum for information type
CREATE TYPE information_type AS ENUM ('news', 'guideline', 'alert', 'announcement', 'education');

-- Create enum for information status
CREATE TYPE information_status AS ENUM ('draft', 'published', 'archived');

-- Table to store ADR information/news
CREATE TABLE adr_information (
  -- Primary identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Content information
  title VARCHAR(500) NOT NULL,
  summary TEXT, -- Short description/summary
  content TEXT NOT NULL, -- Full content in HTML format
  
  -- Classification
  type information_type DEFAULT 'news',
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5), -- 1 = highest, 5 = lowest
  tags TEXT[], -- Array of tags for filtering
  
  -- Media
  featured_image_url TEXT,
  attachments JSONB, -- Array of attachment objects {name, url, type, size}
  
  -- Publishing
  status information_status DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiry date
  
  -- Author information
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  author_name VARCHAR(255) NOT NULL,
  author_organization VARCHAR(255),
  
  -- Visibility and targeting
  target_audience TEXT[], -- Array like ['admin', 'user', 'public'] or specific organizations
  is_pinned BOOLEAN DEFAULT FALSE, -- Pin to top
  show_on_homepage BOOLEAN DEFAULT FALSE, -- Show on dashboard
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  
  -- SEO and metadata
  meta_keywords VARCHAR(500),
  meta_description VARCHAR(300),
  slug VARCHAR(200) UNIQUE, -- URL-friendly version of title
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Table to store user views/reads
CREATE TABLE information_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  information_id UUID NOT NULL REFERENCES adr_information(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
  user_ip VARCHAR(45), -- Store IP for anonymous tracking
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  read_duration_seconds INTEGER DEFAULT 0, -- How long user spent reading
  
  -- Constraint to prevent duplicate views by same user
  UNIQUE(information_id, user_id)
);

-- Table to store user likes/reactions
CREATE TABLE information_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  information_id UUID NOT NULL REFERENCES adr_information(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  liked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  
  -- Constraint to prevent duplicate likes by same user
  UNIQUE(information_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_adr_information_status ON adr_information(status);
CREATE INDEX idx_adr_information_type ON adr_information(type);
CREATE INDEX idx_adr_information_published_at ON adr_information(published_at DESC);
CREATE INDEX idx_adr_information_priority ON adr_information(priority);
CREATE INDEX idx_adr_information_is_pinned ON adr_information(is_pinned);
CREATE INDEX idx_adr_information_show_on_homepage ON adr_information(show_on_homepage);
CREATE INDEX idx_adr_information_tags ON adr_information USING GIN(tags);
CREATE INDEX idx_adr_information_target_audience ON adr_information USING GIN(target_audience);
CREATE INDEX idx_adr_information_expires_at ON adr_information(expires_at);

CREATE INDEX idx_information_views_information_id ON information_views(information_id);
CREATE INDEX idx_information_views_user_id ON information_views(user_id);
CREATE INDEX idx_information_views_viewed_at ON information_views(viewed_at);

CREATE INDEX idx_information_likes_information_id ON information_likes(information_id);
CREATE INDEX idx_information_likes_user_id ON information_likes(user_id);

-- Function to auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT) RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with dashes
  slug := LOWER(title);
  slug := REGEXP_REPLACE(slug, '[^a-z0-9\-]', '-', 'g');
  slug := REGEXP_REPLACE(slug, '-+', '-', 'g');
  slug := TRIM(BOTH '-' FROM slug);
  
  -- Limit length
  IF LENGTH(slug) > 100 THEN
    slug := SUBSTRING(slug FROM 1 FOR 100);
    slug := TRIM(BOTH '-' FROM slug);
  END IF;
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION set_information_slug() RETURNS TRIGGER AS $$
BEGIN
  -- Generate slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
    
    -- Handle duplicates by appending counter
    WHILE EXISTS (SELECT 1 FROM adr_information WHERE slug = NEW.slug AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
      NEW.slug := generate_slug(NEW.title) || '-' || EXTRACT(epoch FROM NOW())::INTEGER;
    END LOOP;
  END IF;
  
  -- Set updated_at
  NEW.updated_at = timezone('utc', now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_information_slug
  BEFORE INSERT OR UPDATE ON adr_information
  FOR EACH ROW EXECUTE FUNCTION set_information_slug();

-- Function to update view count
CREATE OR REPLACE FUNCTION update_view_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE adr_information 
  SET view_count = view_count + 1 
  WHERE id = NEW.information_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_view_count
  AFTER INSERT ON information_views
  FOR EACH ROW EXECUTE FUNCTION update_view_count();

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_likes_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE adr_information 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.information_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE adr_information 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.information_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON information_likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- Enable Row Level Security (RLS)
ALTER TABLE adr_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE information_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE information_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for adr_information

-- Admin can see all information
CREATE POLICY "Admins can view all information" ON adr_information
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role::text = 'admin'
    )
  );

-- Admin can manage all information
CREATE POLICY "Admins can manage information" ON adr_information
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role::text = 'admin'
    )
  );

-- Users can view published information targeted to them
CREATE POLICY "Users can view published information" ON adr_information
  FOR SELECT USING (
    status = 'published' 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      target_audience IS NULL 
      OR target_audience = '{}' 
      OR 'user' = ANY(target_audience)
      OR 'public' = ANY(target_audience)
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND (
          organization = ANY(target_audience)
          OR role::text = ANY(target_audience)
        )
      )
    )
  );

-- RLS Policies for information_views
CREATE POLICY "Users can view their own views" ON information_views
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create views" ON information_views
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all views" ON information_views
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role::text = 'admin'
    )
  );

-- RLS Policies for information_likes  
CREATE POLICY "Users can view all likes" ON information_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON information_likes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all likes" ON information_likes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role::text = 'admin'
    )
  );

-- Sample data (optional)
INSERT INTO adr_information (
  title,
  summary,
  content,
  type,
  priority,
  tags,
  status,
  published_at,
  created_by_user_id,
  author_name,
  author_organization,
  target_audience,
  is_pinned,
  show_on_homepage
) VALUES (
  'Hướng dẫn báo cáo ADR mới nhất 2024',
  'Cập nhật hướng dẫn và quy trình báo cáo tác dụng không mong muốn của thuốc theo thông tư mới nhất.',
  '<h2>Hướng dẫn báo cáo ADR năm 2024</h2><p>Nội dung chi tiết về quy trình báo cáo ADR...</p>',
  'guideline',
  1,
  ARRAY['ADR', 'báo cáo', 'hướng dẫn', '2024'],
  'published',
  timezone('utc', now()),
  (SELECT id FROM users WHERE role::text = 'admin' LIMIT 1),
  'Ban Quản lý Hệ thống',
  'Cục Quản lý Dược',
  ARRAY['admin', 'user'],
  true,
  true
) ON CONFLICT DO NOTHING;

-- Database Schema for ADR Information/News Feature
-- =====================================================

-- Create enum for information type
CREATE TYPE information_type AS ENUM ('news', 'guideline', 'alert', 'announcement', 'education');

-- Create enum for information status
CREATE TYPE information_status AS ENUM ('draft', 'published', 'archived');

-- Table to store ADR information/news
CREATE TABLE adr_information (
  -- Primary identification
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Content information
  title VARCHAR(500) NOT NULL,
  summary TEXT, -- Short description/summary
  content TEXT NOT NULL, -- Full content in HTML format
  
  -- Classification
  type information_type DEFAULT 'news',
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5), -- 1 = highest, 5 = lowest
  tags TEXT[], -- Array of tags for filtering
  
  -- Media
  featured_image_url TEXT,
  attachments JSONB, -- Array of attachment objects {name, url, type, size}
  
  -- Publishing
  status information_status DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiry date
  
  -- Author information
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  author_name VARCHAR(255) NOT NULL,
  author_organization VARCHAR(255),
  
  -- Visibility and targeting
  target_audience TEXT[], -- Array like ['admin', 'user', 'public'] or specific organizations
  is_pinned BOOLEAN DEFAULT FALSE, -- Pin to top
  show_on_homepage BOOLEAN DEFAULT FALSE, -- Show on dashboard
  
  -- Engagement
  view_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  
  -- SEO and metadata
  meta_keywords VARCHAR(500),
  meta_description VARCHAR(300),
  slug VARCHAR(200) UNIQUE, -- URL-friendly version of title
  
  -- System fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Table to store user views/reads
CREATE TABLE information_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  information_id UUID NOT NULL REFERENCES adr_information(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
  user_ip VARCHAR(45), -- Store IP for anonymous tracking
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  read_duration_seconds INTEGER DEFAULT 0, -- How long user spent reading
  
  -- Constraint to prevent duplicate views by same user
  UNIQUE(information_id, user_id)
);

-- Table to store user likes/reactions
CREATE TABLE information_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  information_id UUID NOT NULL REFERENCES adr_information(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  liked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  
  -- Constraint to prevent duplicate likes by same user
  UNIQUE(information_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_adr_information_status ON adr_information(status);
CREATE INDEX idx_adr_information_type ON adr_information(type);
CREATE INDEX idx_adr_information_published_at ON adr_information(published_at DESC);
CREATE INDEX idx_adr_information_priority ON adr_information(priority);
CREATE INDEX idx_adr_information_is_pinned ON adr_information(is_pinned);
CREATE INDEX idx_adr_information_show_on_homepage ON adr_information(show_on_homepage);
CREATE INDEX idx_adr_information_tags ON adr_information USING GIN(tags);
CREATE INDEX idx_adr_information_target_audience ON adr_information USING GIN(target_audience);
CREATE INDEX idx_adr_information_expires_at ON adr_information(expires_at);

CREATE INDEX idx_information_views_information_id ON information_views(information_id);
CREATE INDEX idx_information_views_user_id ON information_views(user_id);
CREATE INDEX idx_information_views_viewed_at ON information_views(viewed_at);

CREATE INDEX idx_information_likes_information_id ON information_likes(information_id);
CREATE INDEX idx_information_likes_user_id ON information_likes(user_id);

-- Function to auto-generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT) RETURNS TEXT AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces and special chars with dashes
  slug := LOWER(title);
  slug := REGEXP_REPLACE(slug, '[^a-z0-9\-]', '-', 'g');
  slug := REGEXP_REPLACE(slug, '-+', '-', 'g');
  slug := TRIM(BOTH '-' FROM slug);
  
  -- Limit length
  IF LENGTH(slug) > 100 THEN
    slug := SUBSTRING(slug FROM 1 FOR 100);
    slug := TRIM(BOTH '-' FROM slug);
  END IF;
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION set_information_slug() RETURNS TRIGGER AS $$
BEGIN
  -- Generate slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
    
    -- Handle duplicates by appending counter
    WHILE EXISTS (SELECT 1 FROM adr_information WHERE slug = NEW.slug AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
      NEW.slug := generate_slug(NEW.title) || '-' || EXTRACT(epoch FROM NOW())::INTEGER;
    END LOOP;
  END IF;
  
  -- Set updated_at
  NEW.updated_at = timezone('utc', now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_information_slug
  BEFORE INSERT OR UPDATE ON adr_information
  FOR EACH ROW EXECUTE FUNCTION set_information_slug();

-- Function to update view count
CREATE OR REPLACE FUNCTION update_view_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE adr_information 
  SET view_count = view_count + 1 
  WHERE id = NEW.information_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_view_count
  AFTER INSERT ON information_views
  FOR EACH ROW EXECUTE FUNCTION update_view_count();

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_likes_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE adr_information 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.information_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE adr_information 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.information_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON information_likes
  FOR EACH ROW EXECUTE FUNCTION update_likes_count();

-- Enable Row Level Security (RLS)
ALTER TABLE adr_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE information_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE information_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for adr_information

-- Admin can see all information
CREATE POLICY "Admins can view all information" ON adr_information
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role::text = 'admin'
    )
  );

-- Admin can manage all information
CREATE POLICY "Admins can manage information" ON adr_information
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role::text = 'admin'
    )
  );

-- Users can view published information targeted to them
CREATE POLICY "Users can view published information" ON adr_information
  FOR SELECT USING (
    status = 'published' 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (
      target_audience IS NULL 
      OR target_audience = '{}' 
      OR 'user' = ANY(target_audience)
      OR 'public' = ANY(target_audience)
      OR EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND (
          organization = ANY(target_audience)
          OR role::text = ANY(target_audience)
        )
      )
    )
  );

-- RLS Policies for information_views
CREATE POLICY "Users can view their own views" ON information_views
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create views" ON information_views
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all views" ON information_views
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role::text = 'admin'
    )
  );

-- RLS Policies for information_likes  
CREATE POLICY "Users can view all likes" ON information_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON information_likes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all likes" ON information_likes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role::text = 'admin'
    )
  );

-- Sample data (optional)
INSERT INTO adr_information (
  title,
  summary,
  content,
  type,
  priority,
  tags,
  status,
  published_at,
  created_by_user_id,
  author_name,
  author_organization,
  target_audience,
  is_pinned,
  show_on_homepage
) VALUES (
  'Hướng dẫn báo cáo ADR mới nhất 2024',
  'Cập nhật hướng dẫn và quy trình báo cáo tác dụng không mong muốn của thuốc theo thông tư mới nhất.',
  '<h2>Hướng dẫn báo cáo ADR năm 2024</h2><p>Nội dung chi tiết về quy trình báo cáo ADR...</p>',
  'guideline',
  1,
  ARRAY['ADR', 'báo cáo', 'hướng dẫn', '2024'],
  'published',
  timezone('utc', now()),
  (SELECT id FROM users WHERE role::text = 'admin' LIMIT 1),
  'Ban Quản lý Hệ thống',
  'Cục Quản lý Dược',
  ARRAY['admin', 'user'],
  true,
  true
) ON CONFLICT DO NOTHING;
