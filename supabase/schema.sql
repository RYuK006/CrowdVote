-- ==============================================================================
-- CrowdVote AI: Complete Supabase PostgreSQL Schema
-- Compatible with Supabase Auth, PostgreSQL, Realtime, and Firebase Migration
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY, -- Firebase UID or Supabase UUID
    email TEXT NOT NULL UNIQUE,
    display_name TEXT DEFAULT 'Anonymous Voter',
    accuracy_score NUMERIC DEFAULT 100,
    role TEXT DEFAULT 'user', -- 'user', 'admin', 'demo_curator'
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on accuracy_score for leaderboard and weighted scoring
CREATE INDEX IF NOT EXISTS idx_users_accuracy_score ON public.users(accuracy_score DESC);

-- 3. POLLS TABLE
CREATE TABLE IF NOT EXISTS public.polls (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'General', -- 'Tech & AI', 'Startups & Roasts', 'Finance & Crypto', 'Politics', 'Sports', 'Pop Culture', 'Sponsored', etc.
    status TEXT DEFAULT 'open', -- 'open', 'closed', 'resolved'
    lock_at TIMESTAMPTZ,
    match_time TEXT,
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    
    -- Sponsored Poll Attributes
    is_sponsored BOOLEAN DEFAULT FALSE,
    sponsor_name TEXT,
    sponsor_logo TEXT,
    sponsor_url TEXT,
    sponsor_reward TEXT, -- e.g. '2x Accuracy Points Boost', '$500 Prize Pool'
    
    -- Roast Room Council Analysis
    council_verdict TEXT,
    council_consensus TEXT,
    
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polls_category ON public.polls(category);
CREATE INDEX IF NOT EXISTS idx_polls_is_sponsored ON public.polls(is_sponsored);
CREATE INDEX IF NOT EXISTS idx_polls_status ON public.polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON public.polls(created_at DESC);

-- 4. POLL OPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.poll_options (
    id TEXT NOT NULL,
    poll_id TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    votes_count INT DEFAULT 0,
    weight_score NUMERIC DEFAULT 0,
    PRIMARY KEY (poll_id, id)
);

CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.poll_options(poll_id);

-- 5. VOTES TABLE
CREATE TABLE IF NOT EXISTS public.votes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    poll_id TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    selected_option TEXT NOT NULL,
    confidence NUMERIC DEFAULT 1,
    accuracy_score_at_vote NUMERIC DEFAULT 100,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_poll_vote UNIQUE(poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON public.votes(user_id);

-- 6. ROAST ROOM COUNCIL DEBATES TABLE
CREATE TABLE IF NOT EXISTS public.council_debates (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    poll_id TEXT NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
    seat_key TEXT NOT NULL, -- e.g. 'bezos', 'graham', 'hormozi', 'musk', 'buffett'
    seat_name TEXT NOT NULL,
    avatar TEXT,
    roast_quote TEXT NOT NULL,
    recommended_option TEXT,
    confidence NUMERIC DEFAULT 85,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_council_debates_poll_id ON public.council_debates(poll_id);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_debates ENABLE ROW LEVEL SECURITY;

-- Allow public read access on polls, options, and council debates
CREATE POLICY "Public read polls" ON public.polls FOR SELECT USING (true);
CREATE POLICY "Public read poll_options" ON public.poll_options FOR SELECT USING (true);
CREATE POLICY "Public read council_debates" ON public.council_debates FOR SELECT USING (true);
CREATE POLICY "Public read users" ON public.users FOR SELECT USING (true);

-- Authenticated users can vote
CREATE POLICY "Users can insert own votes" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read all votes" ON public.votes FOR SELECT USING (true);
