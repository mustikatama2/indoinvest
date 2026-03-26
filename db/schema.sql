-- IndoInvest database schema
-- Run once in Supabase SQL editor at: https://app.supabase.com

-- ─── snapshots ────────────────────────────────────────────────────────────────
-- Stores market value snapshots (auto-fetched or manual) with optional notes
CREATE TABLE IF NOT EXISTS indoinvest_snapshots (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  values      jsonb       NOT NULL,           -- full indicator values map
  probs       jsonb,                          -- computed probs per ticker at save time
  note        text,                           -- optional user note
  data_source text        DEFAULT 'manual'    -- 'auto' | 'manual'
);

-- Index for chronological listing
CREATE INDEX IF NOT EXISTS indoinvest_snapshots_created_at_idx
  ON indoinvest_snapshots (created_at DESC);

-- ─── manual_values ────────────────────────────────────────────────────────────
-- Persists the latest value for manually-updated indicator fields
-- (BI Rate, SBN 10Y yield, foreign net flow, Moody's status)
CREATE TABLE IF NOT EXISTS indoinvest_manual_values (
  field_id    text        PRIMARY KEY,         -- e.g. 'biRate', 'sbn10y', 'foreignFlow', 'moodys'
  value       numeric     NOT NULL,
  updated_at  timestamptz DEFAULT now()
);

-- ─── catalysts ────────────────────────────────────────────────────────────────
-- Market catalyst events (earnings, macro, dividends, regulatory)
CREATE TABLE IF NOT EXISTS indoinvest_catalysts (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  date        date        NOT NULL,
  type        text        NOT NULL,            -- 'earnings' | 'macro' | 'policy' | 'dividend' | 'regulatory'
  title       text        NOT NULL,
  detail      text,
  ticker      text,                            -- null = applies to all; 'BBCA' etc. = ticker-specific
  impact      text        DEFAULT 'medium'     -- 'high' | 'medium' | 'low'
);

CREATE INDEX IF NOT EXISTS indoinvest_catalysts_date_idx
  ON indoinvest_catalysts (date ASC);

-- ─── Row-level security ───────────────────────────────────────────────────────
-- Open read+write for all (single-user personal app — no PII, no auth needed).
-- Writes are still server-side only (SUPABASE_SERVICE_KEY is a Vercel env var,
-- never exposed to the browser). RLS here just satisfies Supabase requirements.
ALTER TABLE indoinvest_snapshots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE indoinvest_manual_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE indoinvest_catalysts     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public all snapshots"     ON indoinvest_snapshots     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all manual values" ON indoinvest_manual_values FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public all catalysts"     ON indoinvest_catalysts     FOR ALL USING (true) WITH CHECK (true);

-- ─── Initial manual_values seed (update these to current values) ──────────────
INSERT INTO indoinvest_manual_values (field_id, value) VALUES
  ('biRate',      5.75),
  ('sbn10y',      6.40),
  ('foreignFlow', -3.0),
  ('moodys',      1)
ON CONFLICT (field_id) DO NOTHING;
