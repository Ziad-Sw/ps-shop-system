-- Migrate ps_station_count from shops to actual stations rows
-- This migration creates individual station rows for PlayStation devices
-- based on the ps_station_count value in shops table

-- Check if ps_station_count column exists (it should from migration 004)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shops' AND column_name = 'ps_station_count'
  ) THEN
    RAISE NOTICE 'ps_station_count column does not exist in shops table';
  ELSE
    RAISE NOTICE 'ps_station_count column exists, proceeding with migration';
  END IF;
END $$;

-- Create/update PlayStation stations based on ps_station_count
DO $$
DECLARE
  shop_record RECORD;
  current_count INTEGER;
  existing_count INTEGER;
  i INTEGER;
  new_station_name TEXT;
BEGIN
  -- Loop through all shops
  FOR shop_record IN SELECT id, ps_station_count FROM shops LOOP
    current_count := shop_record.ps_station_count;
    
    -- Count existing PlayStation stations for this shop
    SELECT COUNT(*) INTO existing_count
    FROM stations
    WHERE shop_id = shop_record.id AND station_type = 'playstation';
    
    -- If we need more stations, create them
    IF current_count > existing_count THEN
      FOR i IN existing_count + 1 .. current_count LOOP
        new_station_name := 'PS' || i;
        
        INSERT INTO stations (shop_id, name, station_type, sort_order, is_active)
        VALUES (shop_record.id, new_station_name, 'playstation', i, TRUE);
        
        RAISE NOTICE 'Created station % for shop %', new_station_name, shop_record.id;
      END LOOP;
    ELSIF current_count < existing_count THEN
      -- If we have too many stations, deactivate the excess (don't delete)
      UPDATE stations
      SET is_active = FALSE
      WHERE shop_id = shop_record.id
        AND station_type = 'playstation'
        AND sort_order > current_count;
        
      RAISE NOTICE 'Deactivated excess stations for shop %', shop_record.id;
    END IF;
  END LOOP;
END $$;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS stations_shop_type_active_idx 
ON stations(shop_id, station_type, is_active);

-- Add comment
COMMENT ON INDEX stations_shop_type_active_idx IS 'Index for efficient station queries by shop, type, and active status';
