-- ============================================================
-- Migration: Create live_cache table for the live-data API proxy
-- ============================================================
-- Run this in the Supabase SQL Editor if setup-db.js can't
-- execute via RPC.

CREATE TABLE IF NOT EXISTS live_cache (
  cache_key TEXT PRIMARY KEY,
  source TEXT DEFAULT 'api-football',
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_cache_source ON live_cache(source);
CREATE INDEX IF NOT EXISTS idx_live_cache_updated ON live_cache(updated_at);

-- ============================================================
-- Verify the match_results table exists (for backward compat)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_results (
  match_id INTEGER PRIMARY KEY,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT DEFAULT 'scheduled',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
