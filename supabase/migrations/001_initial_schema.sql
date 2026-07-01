-- PS Shop System — initial schema (multi-tenant-ready)
-- Every table except shops carries shop_id for future SaaS expansion.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- shops
-- ---------------------------------------------------------------------------
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  ps_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  billiard_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  shifts_per_day INTEGER NOT NULL DEFAULT 1 CHECK (shifts_per_day >= 1 AND shifts_per_day <= 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER shops_set_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- users (team members — login by login_id, no password in MVP scaffold)
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  login_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, login_id)
);

CREATE INDEX users_shop_id_idx ON public.users (shop_id);

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- stations (PlayStation devices + billiard tables)
-- ---------------------------------------------------------------------------
CREATE TABLE public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  station_type TEXT NOT NULL CHECK (station_type IN ('playstation', 'billiard')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX stations_shop_id_idx ON public.stations (shop_id);

CREATE TRIGGER stations_set_updated_at
  BEFORE UPDATE ON public.stations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- pricing_rules (single/multi rates per station type)
-- ---------------------------------------------------------------------------
CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  station_type TEXT NOT NULL CHECK (station_type IN ('playstation', 'billiard')),
  mode TEXT NOT NULL CHECK (mode IN ('single', 'multi')),
  unit TEXT NOT NULL CHECK (unit IN ('hour', 'game')),
  rate NUMERIC(10, 2) NOT NULL CHECK (rate >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (shop_id, station_type, mode)
);

CREATE INDEX pricing_rules_shop_id_idx ON public.pricing_rules (shop_id);

CREATE TRIGGER pricing_rules_set_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- shifts
-- ---------------------------------------------------------------------------
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  responsible_name TEXT NOT NULL,
  opened_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  shift_number INTEGER NOT NULL CHECK (shift_number >= 1),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX shifts_shop_id_idx ON public.shifts (shop_id);
CREATE INDEX shifts_shop_status_idx ON public.shifts (shop_id, status);

CREATE TRIGGER shifts_set_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sessions (server-recorded start/end times)
-- ---------------------------------------------------------------------------
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE RESTRICT,
  mode TEXT NOT NULL CHECK (mode IN ('single', 'multi')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  games_count INTEGER CHECK (games_count IS NULL OR games_count >= 0),
  calculated_cost NUMERIC(10, 2) CHECK (calculated_cost IS NULL OR calculated_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT sessions_end_after_start CHECK (
    end_time IS NULL OR end_time >= start_time
  )
);

CREATE INDEX sessions_shop_id_idx ON public.sessions (shop_id);
CREATE INDEX sessions_shift_id_idx ON public.sessions (shift_id);
CREATE INDEX sessions_station_status_idx ON public.sessions (station_id, status);

CREATE TRIGGER sessions_set_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products (drinks)
-- ---------------------------------------------------------------------------
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX products_shop_id_idx ON public.products (shop_id);

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- sale_items (drink sales linked to shift/session)
-- ---------------------------------------------------------------------------
CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX sale_items_shop_id_idx ON public.sale_items (shop_id);
CREATE INDEX sale_items_shift_id_idx ON public.sale_items (shift_id);

-- ---------------------------------------------------------------------------
-- expenses (daily/shift expenses for archive review)
-- ---------------------------------------------------------------------------
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX expenses_shop_id_idx ON public.expenses (shop_id);
CREATE INDEX expenses_shift_id_idx ON public.expenses (shift_id);

-- ---------------------------------------------------------------------------
-- seed: single shop row (MVP single-tenant)
-- ---------------------------------------------------------------------------
INSERT INTO public.shops (id, name, ps_enabled, billiard_enabled, shifts_per_day)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'محل البلايستيشن',
  TRUE,
  TRUE,
  1
);

-- RLS enabled with permissive MVP policies; tightened in auth step.
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mvp_allow_all_shops" ON public.shops FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mvp_allow_all_users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mvp_allow_all_stations" ON public.stations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mvp_allow_all_pricing_rules" ON public.pricing_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mvp_allow_all_shifts" ON public.shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mvp_allow_all_sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mvp_allow_all_products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mvp_allow_all_sale_items" ON public.sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "mvp_allow_all_expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
