-- Explicit games billing model marker on sessions (entries vs legacy games_count)
-- ============================================================================
ALTER TABLE public.sessions
ADD COLUMN games_model TEXT CHECK (games_model IN ('entries', 'legacy'));

-- Sessions that already have accumulated entry rows → entries model
UPDATE public.sessions s
SET games_model = 'entries'
WHERE s.billing_mode = 'games'
  AND (
    EXISTS (SELECT 1 FROM public.billiard_game_entries bge WHERE bge.session_id = s.id)
    OR EXISTS (SELECT 1 FROM public.station_game_entries sge WHERE sge.session_id = s.id)
  );

-- Billiard + games always uses the entries model (including empty new sessions)
UPDATE public.sessions s
SET games_model = 'entries'
WHERE s.billing_mode = 'games'
  AND s.games_model IS NULL
  AND EXISTS (
    SELECT 1 FROM public.stations st
    WHERE st.id = s.station_id AND st.station_type = 'billiard'
  );

-- Remaining PS/pingpong + games without entry rows → legacy (pre-entries-model sessions)
UPDATE public.sessions s
SET games_model = 'legacy'
WHERE s.billing_mode = 'games'
  AND s.games_model IS NULL
  AND EXISTS (
    SELECT 1 FROM public.stations st
    WHERE st.id = s.station_id AND st.station_type IN ('playstation', 'pingpong')
  );
