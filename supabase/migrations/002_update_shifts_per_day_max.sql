-- Update shifts_per_day constraint from max 3 to max 4

ALTER TABLE public.shops 
DROP CONSTRAINT shops_shifts_per_day_check;

ALTER TABLE public.shops 
ADD CONSTRAINT shops_shifts_per_day_check 
CHECK (shifts_per_day >= 1 AND shifts_per_day <= 4);
