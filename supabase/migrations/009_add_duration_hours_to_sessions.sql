-- Add duration_hours column to sessions table
-- This column stores the session duration in hours (with fractional minutes)
-- Calculation: duration_hours = EXTRACT(EPOCH FROM (end_time - start_time)) / 3600
-- Cost calculation: calculated_cost = duration_hours * rate

ALTER TABLE public.sessions
ADD COLUMN duration_hours NUMERIC(10, 2) CHECK (duration_hours IS NULL OR duration_hours >= 0);
