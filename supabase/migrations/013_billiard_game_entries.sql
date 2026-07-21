-- Feature 5: Billiard accumulated game entries + pricing_rules restructure
-- ============================================================================
-- 1. Create billiard_game_entries table
-- ============================================================================
CREATE TABLE public.billiard_game_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  play_type TEXT NOT NULL CHECK (play_type IN ('normal', 'combo')),
  play_subtype TEXT NOT NULL CHECK (play_subtype IN ('single', 'multi', 'triple', 'quad')),
  games_count INTEGER NOT NULL CHECK (games_count > 0),
  price_per_game NUMERIC(10, 2) NOT NULL CHECK (price_per_game >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX bge_session_id_idx ON public.billiard_game_entries (session_id);
CREATE INDEX bge_shop_id_idx ON public.billiard_game_entries (shop_id);

-- ============================================================================
-- 2. Add play_type / play_subtype to pricing_rules
-- ============================================================================
ALTER TABLE public.pricing_rules
ADD COLUMN play_type TEXT;

ALTER TABLE public.pricing_rules
ADD COLUMN play_subtype TEXT;

-- 2a. Migrate existing PS/pingpong rows: play_type='normal', play_subtype=mode
UPDATE public.pricing_rules
SET play_type = 'normal', play_subtype = mode
WHERE station_type IN ('playstation', 'pingpong');

-- 2b. Delete old billiard rows (4 rows: single/multi × hour/game)
DELETE FROM public.pricing_rules WHERE station_type = 'billiard';

-- ============================================================================
-- 3. FIRST: Drop old UNIQUE constraint (shop_id, station_type, mode, unit)
--     BEFORE inserting billiard rows (which have duplicate mode+unit combos)
-- ============================================================================
ALTER TABLE public.pricing_rules
DROP CONSTRAINT IF EXISTS pricing_rules_shop_id_station_type_mode_unit_key;

-- 3a. Then insert 10 new billiard pricing rows
--     - normal/single rows preserve the old single rates (25/hour, 7/game)
--     - normal/multi rows preserve the old multi rates (50/hour, 15/game)
--     - combo rows are PLACEHOLDER rates the owner must review
DO $$
DECLARE
  v_shop_id UUID;
BEGIN
  SELECT id INTO v_shop_id FROM public.shops LIMIT 1;

  INSERT INTO public.pricing_rules (shop_id, station_type, mode, unit, rate, play_type, play_subtype) VALUES
    -- Normal / Single
    (v_shop_id, 'billiard', 'single', 'hour', 25, 'normal', 'single'),
    (v_shop_id, 'billiard', 'single', 'game', 7,  'normal', 'single'),
    -- Normal / Multi
    (v_shop_id, 'billiard', 'multi',  'hour', 50, 'normal', 'multi'),
    (v_shop_id, 'billiard', 'multi',  'game', 15, 'normal', 'multi'),
    -- Combo / Single — PLACEHOLDER, review in /settings/billiard
    (v_shop_id, 'billiard', 'single', 'hour', 35, 'combo',  'single'),
    (v_shop_id, 'billiard', 'single', 'game', 10, 'combo',  'single'),
    -- Combo / Triple — PLACEHOLDER, review in /settings/billiard
    (v_shop_id, 'billiard', 'multi',  'hour', 60, 'combo',  'triple'),
    (v_shop_id, 'billiard', 'multi',  'game', 20, 'combo',  'triple'),
    -- Combo / Quad — PLACEHOLDER, review in /settings/billiard
    (v_shop_id, 'billiard', 'multi',  'hour', 75, 'combo',  'quad'),
    (v_shop_id, 'billiard', 'multi',  'game', 25, 'combo',  'quad');
END $$;

-- 3b. Add new UNIQUE constraint (shop_id, station_type, play_type, play_subtype, unit)
ALTER TABLE public.pricing_rules
ADD CONSTRAINT pricing_rules_unique_key
UNIQUE (shop_id, station_type, play_type, play_subtype, unit);

-- ============================================================================
-- 4. Make play_type / play_subtype NOT NULL on pricing_rules (all rows populated now)
-- ============================================================================
ALTER TABLE public.pricing_rules ALTER COLUMN play_type SET NOT NULL;
ALTER TABLE public.pricing_rules ALTER COLUMN play_subtype SET NOT NULL;

-- ============================================================================
-- 5. Add play_type / play_subtype to sessions (nullable — only set for billiard/time)
-- ============================================================================
ALTER TABLE public.sessions
ADD COLUMN play_type TEXT;

ALTER TABLE public.sessions
ADD COLUMN play_subtype TEXT;

-- ============================================================================
-- 6. Backfill: active billiard/games session → one billiard_game_entries row
--    Uses the current single/game rate (7 EGP) as the snapshot price_per_game.
-- ============================================================================
INSERT INTO public.billiard_game_entries (shop_id, session_id, play_type, play_subtype, games_count, price_per_game)
SELECT
  s.shop_id,
  s.id,
  'normal',
  s.mode,
  s.games_count,
  COALESCE(pr.rate, 0)
FROM public.sessions s
JOIN public.stations st ON s.station_id = st.id
LEFT JOIN public.pricing_rules pr
  ON pr.shop_id = s.shop_id
  AND pr.station_type = 'billiard'
  AND pr.play_type = 'normal'
  AND pr.play_subtype = s.mode
  AND pr.unit = 'game'
WHERE s.status = 'active'
  AND s.billing_mode = 'games'
  AND st.station_type = 'billiard'
  AND s.games_count IS NOT NULL
  AND s.games_count > 0;
