-- Add station count fields to shops table
ALTER TABLE public.shops 
ADD COLUMN ps_station_count INTEGER DEFAULT 0,
ADD COLUMN billiard_table_count INTEGER DEFAULT 0,
ADD COLUMN pingpong_table_count INTEGER DEFAULT 0,
ADD COLUMN pingpong_enabled BOOLEAN DEFAULT true;

-- Add comments
COMMENT ON COLUMN public.shops.ps_station_count IS 'عدد أجهزة البلايستيشن في المحل';
COMMENT ON COLUMN public.shops.billiard_table_count IS 'عدد طاولات البلياردو في المحل';
COMMENT ON COLUMN public.shops.pingpong_table_count IS 'عدد طاولات البينغ بونغ في المحل';
COMMENT ON COLUMN public.shops.pingpong_enabled IS 'تفعيل خدمة البينغ بونغ';
