-- The "full story" length option has been removed from the app; only "short" remains.
-- Update the column default and backfill any existing rows so nothing references 'full'.
ALTER TABLE public.stories ALTER COLUMN length_pref SET DEFAULT 'short';
UPDATE public.stories SET length_pref = 'short' WHERE length_pref = 'full';
