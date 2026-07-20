-- ---------------------------------------------------------------------------
-- Migration 002: Make expenses.shift_id nullable, add category & expense_date
-- ---------------------------------------------------------------------------

ALTER TABLE public.expenses
  ALTER COLUMN shift_id DROP NOT NULL;

ALTER TABLE public.expenses
  ADD COLUMN category TEXT;

ALTER TABLE public.expenses
  ADD COLUMN expense_date DATE NOT NULL DEFAULT CURRENT_DATE;

CREATE INDEX expenses_expense_date_idx ON public.expenses (expense_date);
