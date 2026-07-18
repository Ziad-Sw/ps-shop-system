ALTER TABLE public.users
ADD COLUMN deactivated_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.users.deactivated_at IS 'Set to NOW() on soft-delete (is_active=false). Used by the 30-day rolling-window purge to calculate when a user row can be permanently deleted. NULL for active users.';
