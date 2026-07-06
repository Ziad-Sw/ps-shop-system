-- Add owner_name column to shops table
ALTER TABLE public.shops 
ADD COLUMN owner_name TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.shops.owner_name IS 'اسم صاحب المحل';
