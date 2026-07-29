-- Feature 5: PlayStation/Pingpong accumulated game entries (games billing mode only)
-- ============================================================================
-- 1. Create station_game_entries table (separate from billiard_game_entries
--    because PS/pingpong have no play_type/play_subtype — just mode)
-- ============================================================================
CREATE TABLE public.station_game_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('single', 'multi')),
  games_count INTEGER NOT NULL CHECK (games_count > 0),
  price_per_game NUMERIC(10, 2) NOT NULL CHECK (price_per_game >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sge_session_id_idx ON public.station_game_entries (session_id);
CREATE INDEX sge_shop_id_idx ON public.station_game_entries (shop_id);

-- ============================================================================
-- 2. Backfill: active playstation/pingpong + games sessions
--    → one station_game_entries row per session (derived from session.mode/games_count)
-- ============================================================================
INSERT INTO public.station_game_entries (shop_id, session_id, mode, games_count, price_per_game)
SELECT
  s.shop_id,
  s.id,
  s.mode,
  s.games_count,
  COALESCE(pr.rate, 0)
FROM public.sessions s
JOIN public.stations st ON s.station_id = st.id
LEFT JOIN public.pricing_rules pr
  ON pr.shop_id = s.shop_id
  AND pr.station_type = st.station_type
  AND pr.play_type = 'normal'
  AND pr.play_subtype = s.mode
  AND pr.unit = 'game'
WHERE s.status = 'active'
  AND st.station_type IN ('playstation', 'pingpong')
  AND s.billing_mode = 'games'
  AND s.games_count IS NOT NULL
  AND s.games_count > 0;
