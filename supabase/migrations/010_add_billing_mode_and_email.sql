-- Feature 5: Add billing_mode to sessions + dual-unit pricing_rules
-- Feature 2: Add email to users

-- ============================================================================
-- 1. pricing_rules — widen UNIQUE to include unit so each station_type+mode
--    can carry both an hourly and a per-game rate simultaneously.
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pricing_rules_shop_id_station_type_mode_key'
      AND conrelid = 'public.pricing_rules'::regclass
  ) THEN
    ALTER TABLE public.pricing_rules
    DROP CONSTRAINT pricing_rules_shop_id_station_type_mode_key;
  END IF;
END $$;

ALTER TABLE public.pricing_rules
ADD CONSTRAINT pricing_rules_shop_id_station_type_mode_unit_key
UNIQUE (shop_id, station_type, mode, unit);

-- Seed complementary rate rows (existing rows stay, complementary unit gets rate 0).
INSERT INTO public.pricing_rules (shop_id, station_type, mode, unit, rate)
SELECT
  existing.shop_id,
  existing.station_type,
  existing.mode,
  CASE WHEN existing.unit = 'hour' THEN 'game' ELSE 'hour' END,
  0
FROM public.pricing_rules existing
WHERE NOT EXISTS (
  SELECT 1 FROM public.pricing_rules r
  WHERE r.shop_id = existing.shop_id
    AND r.station_type = existing.station_type
    AND r.mode = existing.mode
    AND r.unit = CASE WHEN existing.unit = 'hour' THEN 'game' ELSE 'hour' END
);

-- ============================================================================
-- 2. sessions — add billing_mode column (time / games)
-- ============================================================================
ALTER TABLE public.sessions
ADD COLUMN billing_mode TEXT NOT NULL DEFAULT 'time'
CHECK (billing_mode IN ('time', 'games'));

-- Backfill existing sessions: billiard stations get 'games', others get 'time'.
UPDATE public.sessions s
SET billing_mode = 'games'
FROM public.stations st
WHERE s.station_id = st.id
  AND st.station_type = 'billiard';

-- ============================================================================
-- 3. users — add email column (identification/invite only, NOT auth)
-- ============================================================================
ALTER TABLE public.users
ADD COLUMN email TEXT;

ALTER TABLE public.users
ADD CONSTRAINT users_shop_id_email_key UNIQUE (shop_id, email);
