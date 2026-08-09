-- ============================================================================
-- Migration 016: Isolated demo shop for portfolio visitors
-- ----------------------------------------------------------------------------
-- Creates a fully separate demo tenant ("Super Remontada — Demo") with fake
-- data so visitors can explore the system without any risk to the real shop.
--
-- CRITICAL: Every row inserted here is scoped to the NEW demo shop_id
-- (00000000-0000-4000-8000-00000000DE01). The real production shop
-- (00000000-0000-4000-8000-000000000001) is NEVER referenced or modified.
--
-- Demo login: login_id = 'DEMO2026' (globally unique; login API resolves
-- login_id without a shop filter, so a clearly-demo value is used instead
-- of a numeric one that could collide with a real user's id).
--
-- Fixed IDs are used throughout (not random) so the demo tenant is easy to
-- reference and clean up later. All inserts are idempotent (ON CONFLICT
-- DO NOTHING) so re-running is safe.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Demo shop
-- ---------------------------------------------------------------------------
INSERT INTO public.shops (
  id, name, owner_name, ps_enabled, billiard_enabled, pingpong_enabled,
  shifts_per_day, ps_station_count, billiard_table_count, pingpong_table_count
)
VALUES (
  '00000000-0000-4000-8000-00000000DE01',
  'Super Remontada — Demo',
  'حساب تجريبي',
  TRUE, TRUE, TRUE,
  1, 2, 2, 1
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. Demo owner user (full access — isolated fake shop makes owner-level safe)
-- ---------------------------------------------------------------------------
INSERT INTO public.users (
  id, shop_id, login_id, display_name, role, permissions, is_active
)
VALUES (
  '00000000-0000-4000-8000-00000000DE02',
  '00000000-0000-4000-8000-00000000DE01',
  'DEMO2026',
  'مدير تجريبي',
  'owner',
  '{"manage_sessions": true, "manage_shifts": true, "record_sales": true, "manage_settings": true, "manage_team": true}'::jsonb,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Demo stations
-- ---------------------------------------------------------------------------
INSERT INTO public.stations (id, shop_id, name, station_type, sort_order, is_active) VALUES
  ('00000000-0000-4000-8000-00000000DE10', '00000000-0000-4000-8000-00000000DE01', 'PS1',            'playstation', 1, TRUE),
  ('00000000-0000-4000-8000-00000000DE11', '00000000-0000-4000-8000-00000000DE01', 'PS2',            'playstation', 2, TRUE),
  ('00000000-0000-4000-8000-00000000DE20', '00000000-0000-4000-8000-00000000DE01', 'بلياردو 1',       'billiard',     1, TRUE),
  ('00000000-0000-4000-8000-00000000DE21', '00000000-0000-4000-8000-00000000DE01', 'بلياردو 2',       'billiard',     2, TRUE),
  ('00000000-0000-4000-8000-00000000DE30', '00000000-0000-4000-8000-00000000DE01', 'بينغ بونغ 1',     'pingpong',     1, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Demo pricing rules
--    UNIQUE (shop_id, station_type, play_type, play_subtype, unit) is
--    respected for every row:
--    - playstation/pingpong: play_type='normal', play_subtype = mode
--    - billiard: play_type IN (normal, combo), play_subtype IN (single, multi, triple, quad)
-- ---------------------------------------------------------------------------
INSERT INTO public.pricing_rules (shop_id, station_type, mode, unit, rate, play_type, play_subtype) VALUES
  -- PlayStation (normal / single + multi, hour + game)
  ('00000000-0000-4000-8000-00000000DE01', 'playstation', 'single', 'hour', 30, 'normal', 'single'),
  ('00000000-0000-4000-8000-00000000DE01', 'playstation', 'single', 'game', 10, 'normal', 'single'),
  ('00000000-0000-4000-8000-00000000DE01', 'playstation', 'multi',  'hour', 60, 'normal', 'multi'),
  ('00000000-0000-4000-8000-00000000DE01', 'playstation', 'multi',  'game', 20, 'normal', 'multi'),
  -- Ping pong (normal / single + multi, hour + game)
  ('00000000-0000-4000-8000-00000000DE01', 'pingpong',    'single', 'hour', 20, 'normal', 'single'),
  ('00000000-0000-4000-8000-00000000DE01', 'pingpong',    'single', 'game',  5, 'normal', 'single'),
  ('00000000-0000-4000-8000-00000000DE01', 'pingpong',    'multi',  'hour', 35, 'normal', 'multi'),
  ('00000000-0000-4000-8000-00000000DE01', 'pingpong',    'multi',  'game',  8, 'normal', 'multi'),
  -- Billiard (normal + combo, single/multi/triple/quad, hour + game)
  ('00000000-0000-4000-8000-00000000DE01', 'billiard',    'single', 'hour', 25, 'normal', 'single'),
  ('00000000-0000-4000-8000-00000000DE01', 'billiard',    'single', 'game',  7, 'normal', 'single'),
  ('00000000-0000-4000-8000-00000000DE01', 'billiard',    'multi',  'hour', 50, 'normal', 'multi'),
  ('00000000-0000-4000-8000-00000000DE01', 'billiard',    'multi',  'game', 15, 'normal', 'multi'),
  ('00000000-0000-4000-8000-00000000DE01', 'billiard',    'single', 'hour', 35, 'combo',  'single'),
  ('00000000-0000-4000-8000-00000000DE01', 'billiard',    'single', 'game', 10, 'combo',  'single'),
  ('00000000-0000-4000-8000-00000000DE01', 'billiard',    'multi',  'hour', 60, 'combo',  'triple'),
  ('00000000-0000-4000-8000-00000000DE01', 'billiard',    'multi',  'game', 20, 'combo',  'triple'),
  ('00000000-0000-4000-8000-00000000DE01', 'billiard',    'multi',  'hour', 75, 'combo',  'quad'),
  ('00000000-0000-4000-8000-00000000DE01', 'billiard',    'multi',  'game', 25, 'combo',  'quad')
ON CONFLICT (shop_id, station_type, play_type, play_subtype, unit) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Demo products (drinks)
-- ---------------------------------------------------------------------------
INSERT INTO public.products (id, shop_id, name, price, is_active) VALUES
  ('00000000-0000-4000-8000-00000000DE40', '00000000-0000-4000-8000-00000000DE01', 'بيبسي',             10, TRUE),
  ('00000000-0000-4000-8000-00000000DE41', '00000000-0000-4000-8000-00000000DE01', 'مياه معدنية',        5, TRUE),
  ('00000000-0000-4000-8000-00000000DE42', '00000000-0000-4000-8000-00000000DE01', 'شاي',               10, TRUE),
  ('00000000-0000-4000-8000-00000000DE43', '00000000-0000-4000-8000-00000000DE01', 'قهوة',              15, TRUE),
  ('00000000-0000-4000-8000-00000000DE44', '00000000-0000-4000-8000-00000000DE01', 'عصير برتقال',       20, TRUE),
  ('00000000-0000-4000-8000-00000000DE45', '00000000-0000-4000-8000-00000000DE01', 'مشروب طاقة',        50, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Demo history: 2 closed shifts (within the archive's 30-day window)
-- ---------------------------------------------------------------------------
-- Shift 1 (3 days ago) — PS1 time session + billiard games session
INSERT INTO public.shifts (id, shop_id, responsible_name, opened_by_user_id, shift_number, status, opened_at, closed_at) VALUES (
  '00000000-0000-4000-8000-00000000DE50',
  '00000000-0000-4000-8000-00000000DE01',
  'مدير تجريبي',
  '00000000-0000-4000-8000-00000000DE02',
  1,
  'closed',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days' + INTERVAL '6 hours'
)
ON CONFLICT (id) DO NOTHING;

-- Shift 2 (1 day ago) — PS2 time session + pingpong games session
INSERT INTO public.shifts (id, shop_id, responsible_name, opened_by_user_id, shift_number, status, opened_at, closed_at) VALUES (
  '00000000-0000-4000-8000-00000000DE51',
  '00000000-0000-4000-8000-00000000DE01',
  'مدير تجريبي',
  '00000000-0000-4000-8000-00000000DE02',
  2,
  'closed',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day' + INTERVAL '5 hours'
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Demo sessions (completed, scoped to demo shop + demo shifts)
-- ---------------------------------------------------------------------------
-- Shift 1: PS1 single/time 2h @30 = 60 ; Billiard 1 single/games 5 @7 = 35
INSERT INTO public.sessions (
  id, shop_id, shift_id, station_id, mode, billing_mode, status,
  start_time, end_time, games_count, calculated_cost, duration_hours,
  play_type, play_subtype, games_model
) VALUES
  (
    '00000000-0000-4000-8000-00000000DE60',
    '00000000-0000-4000-8000-00000000DE01',
    '00000000-0000-4000-8000-00000000DE50',
    '00000000-0000-4000-8000-00000000DE10',
    'single', 'time', 'completed',
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
    NULL, 60.00, 2.00,
    NULL, NULL, NULL
  ),
  (
    '00000000-0000-4000-8000-00000000DE61',
    '00000000-0000-4000-8000-00000000DE01',
    '00000000-0000-4000-8000-00000000DE50',
    '00000000-0000-4000-8000-00000000DE20',
    'single', 'games', 'completed',
    NOW() - INTERVAL '3 days' + INTERVAL '30 minutes', NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
    5, 35.00, NULL,
    'normal', 'single', 'entries'
  )
ON CONFLICT (id) DO NOTHING;

-- Shift 2: PS2 multi/time 1.5h @60 = 90 ; Pingpong single/games 8 @5 = 40
INSERT INTO public.sessions (
  id, shop_id, shift_id, station_id, mode, billing_mode, status,
  start_time, end_time, games_count, calculated_cost, duration_hours,
  play_type, play_subtype, games_model
) VALUES
  (
    '00000000-0000-4000-8000-00000000DE62',
    '00000000-0000-4000-8000-00000000DE01',
    '00000000-0000-4000-8000-00000000DE51',
    '00000000-0000-4000-8000-00000000DE11',
    'multi', 'time', 'completed',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '90 minutes',
    NULL, 90.00, 1.50,
    NULL, NULL, NULL
  ),
  (
    '00000000-0000-4000-8000-00000000DE63',
    '00000000-0000-4000-8000-00000000DE01',
    '00000000-0000-4000-8000-00000000DE51',
    '00000000-0000-4000-8000-00000000DE30',
    'single', 'games', 'completed',
    NOW() - INTERVAL '1 day' + INTERVAL '1 hour', NOW() - INTERVAL '1 day' + INTERVAL '4 hours',
    8, 40.00, NULL,
    'normal', 'single', 'entries'
  )
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Game entries matching the games-model sessions (schema consistency)
-- ---------------------------------------------------------------------------
INSERT INTO public.billiard_game_entries (id, shop_id, session_id, play_type, play_subtype, games_count, price_per_game) VALUES (
  '00000000-0000-4000-8000-00000000DE70',
  '00000000-0000-4000-8000-00000000DE01',
  '00000000-0000-4000-8000-00000000DE61',
  'normal', 'single', 5, 7.00
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.station_game_entries (id, shop_id, session_id, mode, games_count, price_per_game) VALUES (
  '00000000-0000-4000-8000-00000000DE71',
  '00000000-0000-4000-8000-00000000DE01',
  '00000000-0000-4000-8000-00000000DE63',
  'single', 8, 5.00
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. Demo sale_items (drinks sold during the demo shifts)
-- ---------------------------------------------------------------------------
INSERT INTO public.sale_items (id, shop_id, shift_id, session_id, product_id, quantity, unit_price, total_price) VALUES
  ('00000000-0000-4000-8000-00000000DE80', '00000000-0000-4000-8000-00000000DE01', '00000000-0000-4000-8000-00000000DE50', '00000000-0000-4000-8000-00000000DE60', '00000000-0000-4000-8000-00000000DE40', 2, 10.00, 20.00),
  ('00000000-0000-4000-8000-00000000DE81', '00000000-0000-4000-8000-00000000DE01', '00000000-0000-4000-8000-00000000DE50', '00000000-0000-4000-8000-00000000DE61', '00000000-0000-4000-8000-00000000DE41', 1,  5.00,  5.00),
  ('00000000-0000-4000-8000-00000000DE82', '00000000-0000-4000-8000-00000000DE01', '00000000-0000-4000-8000-00000000DE51', '00000000-0000-4000-8000-00000000DE62', '00000000-0000-4000-8000-00000000DE42', 3, 10.00, 30.00),
  ('00000000-0000-4000-8000-00000000DE83', '00000000-0000-4000-8000-00000000DE01', '00000000-0000-4000-8000-00000000DE51', '00000000-0000-4000-8000-00000000DE63', '00000000-0000-4000-8000-00000000DE43', 1, 15.00, 15.00),
  ('00000000-0000-4000-8000-00000000DE84', '00000000-0000-4000-8000-00000000DE01', '00000000-0000-4000-8000-00000000DE51', NULL,                                      '00000000-0000-4000-8000-00000000DE44', 1, 20.00, 20.00)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 10. Demo expenses (fake, attached to the demo shifts)
-- ---------------------------------------------------------------------------
INSERT INTO public.expenses (id, shop_id, shift_id, description, amount, category, expense_date) VALUES
  ('00000000-0000-4000-8000-00000000DE90', '00000000-0000-4000-8000-00000000DE01', '00000000-0000-4000-8000-00000000DE50', 'استبدال كرة بلياردو',       20, 'صيانة', CURRENT_DATE - 3),
  ('00000000-0000-4000-8000-00000000DE91', '00000000-0000-4000-8000-00000000DE01', '00000000-0000-4000-8000-00000000DE51', 'مصروفات تشغيل و كهرباء',    30, 'تشغيل', CURRENT_DATE - 1)
ON CONFLICT (id) DO NOTHING;

COMMIT;
