-- Test data for shift management testing
-- This migration creates test data to verify shift management functionality

-- Insert a test user if not exists
INSERT INTO public.users (id, shop_id, login_id, display_name, role, permissions, is_active)
VALUES (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'test_user',
  'مستخدم تجريبي',
  'owner',
  '{"manage_sessions": true, "manage_shifts": true, "record_sales": true, "manage_settings": true, "manage_team": true}'::jsonb,
  true
)
ON CONFLICT (shop_id, login_id) DO NOTHING;

-- Insert a test station for PlayStation
INSERT INTO public.stations (id, shop_id, name, station_type, sort_order, is_active)
VALUES (
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  'PS1',
  'playstation',
  1,
  true
)
ON CONFLICT DO NOTHING;
