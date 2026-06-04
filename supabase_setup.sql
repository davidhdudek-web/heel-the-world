-- HTW Supabase Tables
-- Run once in Supabase SQL Editor: https://supabase.com/dashboard/project/jzhujovdjrgrgdjupesi/sql

-- 1. Commission Leads
CREATE TABLE IF NOT EXISTS htw_leads (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT,
  email       TEXT NOT NULL,
  lang        TEXT DEFAULT 'EN',
  city        TEXT DEFAULT '',
  material    TEXT DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Allow app to insert leads (no auth required for personal tool)
ALTER TABLE htw_leads DISABLE ROW LEVEL SECURITY;

-- 2. Done-Status per Device
CREATE TABLE IF NOT EXISTS htw_done (
  device_id   TEXT NOT NULL,
  post_index  INTEGER NOT NULL,
  done_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (device_id, post_index)
);

ALTER TABLE htw_done DISABLE ROW LEVEL SECURITY;
