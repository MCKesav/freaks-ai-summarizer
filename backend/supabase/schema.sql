-- =============================================================================
-- SUPABASE SCHEMA: Minimal Storage for Study Materials
-- =============================================================================
-- STORAGE DECISION: Only persist what is expensive to regenerate
-- - Raw files → Firebase Storage (cheap object storage)
-- - Metadata → Supabase (structured queries)
-- - Summaries → Supabase (expensive LLM generation)
-- - Extracted text → NEVER persist (cheap to re-extract)
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE: files
-- PURPOSE: Track uploaded files and their Firebase Storage location
-- WHY PERSIST: Source of truth for file existence and retrieval
-- =============================================================================
CREATE TYPE file_type AS ENUM (
    'pdf',
    'docx', 
    'pptx',
    'image',
    'audio',
    'video',
    'url'
);

CREATE TABLE files (
    -- PRIMARY KEY: UUID for distributed ID generation
    file_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- USER IDENTIFIER: Firebase UID only (no email/name duplication)
    -- WHY: Single source of truth for user identity is Firebase Auth
    firebase_uid TEXT NOT NULL,
    
    -- FILE METADATA: Minimal required fields
    -- WHY file_name: User-facing display, search
    file_name TEXT NOT NULL,
    
    -- WHY file_type: Determines extraction pipeline
    file_type file_type NOT NULL,
    
    -- WHY storage_path: Reference to Firebase Storage location
    -- Format: /users/{firebase_uid}/uploads/{file_id}.{ext}
    storage_path TEXT NOT NULL,
    
    -- WHY upload_time: Ordering, TTL policies, debugging
    upload_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- INDEXES for common queries
    CONSTRAINT files_storage_path_unique UNIQUE (storage_path)
);

-- Index for user's files lookup (most common query)
CREATE INDEX idx_files_firebase_uid ON files(firebase_uid);

-- Index for recent uploads
CREATE INDEX idx_files_upload_time ON files(upload_time DESC);

-- =============================================================================
-- TABLE: user_profiles
-- PURPOSE: Store user preferences and settings that extend Firebase Auth
-- WHY PERSIST: User preferences are small but important for UX
-- =============================================================================
CREATE TABLE user_profiles (
    -- PRIMARY KEY: Firebase UID (1:1 with Firebase Auth user)
    firebase_uid TEXT PRIMARY KEY,
    
    -- PROFILE: User-customizable display fields
    display_name TEXT,
    avatar_index INT DEFAULT 0,
    
    -- PREFERENCES: UI/UX settings
    reduced_motion BOOLEAN DEFAULT FALSE,
    high_contrast BOOLEAN DEFAULT FALSE,
    email_notifications BOOLEAN DEFAULT TRUE,
    
    -- INTEGRATIONS: Connected services
    calendar_connected BOOLEAN DEFAULT FALSE,
    
    -- API KEYS: User-specific API keys (encrypted in production)
    gemini_api_key TEXT,
    
    -- TIMESTAMPS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (firebase_uid = auth.uid()::text);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (firebase_uid = auth.uid()::text);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (firebase_uid = auth.uid()::text);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: summaries (ALREADY EXISTS IN SUPABASE)
-- PURPOSE: Store LLM-generated summaries (expensive to regenerate)
-- WHY PERSIST: LLM calls cost money/time, summaries are the core value
-- =============================================================================
-- NOTE: This table already exists with the following structure:
--
-- CREATE TABLE summaries (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     firebase_uid TEXT NOT NULL,
--     document_id UUID NOT NULL REFERENCES files(file_id) ON DELETE CASCADE,
--     summary_text TEXT NOT NULL,
--     confidence_score TEXT,
--     version INT4 DEFAULT 1,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );
--
-- Indexes to add if not present:
-- CREATE INDEX idx_summaries_document_id ON summaries(document_id);
-- CREATE INDEX idx_summaries_firebase_uid ON summaries(firebase_uid);
-- CREATE INDEX idx_summaries_doc_version ON summaries(document_id, version DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- PURPOSE: Users can only access their own data
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own files
CREATE POLICY "Users can view own files" ON files
    FOR SELECT USING (firebase_uid = auth.uid()::text);

CREATE POLICY "Users can insert own files" ON files
    FOR INSERT WITH CHECK (firebase_uid = auth.uid()::text);

CREATE POLICY "Users can delete own files" ON files
    FOR DELETE USING (firebase_uid = auth.uid()::text);

-- Policy: Users can only see their own summaries
CREATE POLICY "Users can view own summaries" ON summaries
    FOR SELECT USING (firebase_uid = auth.uid()::text);

CREATE POLICY "Users can insert own summaries" ON summaries
    FOR INSERT WITH CHECK (firebase_uid = auth.uid()::text);

CREATE POLICY "Users can delete own summaries" ON summaries
    FOR DELETE USING (firebase_uid = auth.uid()::text);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get latest summary for a file
CREATE OR REPLACE FUNCTION get_latest_summary(p_file_id UUID)
RETURNS TABLE (
    id UUID,
    summary_text TEXT,
    version INT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.summary_text, s.version, s.created_at
    FROM summaries s
    WHERE s.document_id = p_file_id
    ORDER BY s.version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's study materials with summaries
CREATE OR REPLACE FUNCTION get_user_materials(p_firebase_uid TEXT)
RETURNS TABLE (
    file_id UUID,
    file_name TEXT,
    file_type file_type,
    storage_path TEXT,
    upload_time TIMESTAMP WITH TIME ZONE,
    has_summary BOOLEAN,
    latest_summary TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.file_id,
        f.file_name,
        f.file_type,
        f.storage_path,
        f.upload_time,
        EXISTS(SELECT 1 FROM summaries s WHERE s.document_id = f.file_id) as has_summary,
        (SELECT s.summary_text FROM summaries s WHERE s.document_id = f.file_id ORDER BY s.version DESC LIMIT 1) as latest_summary
    FROM files f
    WHERE f.firebase_uid = p_firebase_uid
    ORDER BY f.upload_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- WHAT IS NOT STORED (BY DESIGN)
-- =============================================================================
-- ❌ Extracted text - Cheap to re-extract from source file
-- ❌ Chunks - Transient, only needed during LLM processing
-- ❌ Token counts - Can be computed on-demand
-- ❌ Access counts - Premature optimization, add when needed
-- ❌ Starred/favorites - Add when feature is needed
-- ❌ Flashcards - Out of scope per requirements
-- ❌ Learning signals - Out of scope per requirements
-- =============================================================================