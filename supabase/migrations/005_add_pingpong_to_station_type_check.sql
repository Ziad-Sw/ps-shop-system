-- Add pingpong to station_type check constraints

-- Update pricing_rules station_type check
ALTER TABLE public.pricing_rules 
DROP CONSTRAINT IF EXISTS pricing_rules_station_type_check;

ALTER TABLE public.pricing_rules 
ADD CONSTRAINT pricing_rules_station_type_check 
CHECK (station_type IN ('playstation', 'billiard', 'pingpong'));

-- Update stations station_type check
ALTER TABLE public.stations 
DROP CONSTRAINT IF EXISTS stations_station_type_check;

ALTER TABLE public.stations 
ADD CONSTRAINT stations_station_type_check 
CHECK (station_type IN ('playstation', 'billiard', 'pingpong'));
