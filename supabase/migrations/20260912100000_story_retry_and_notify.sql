-- Tracks automatic retry attempts (for scenes that fail to render, e.g. out
-- of memory) and whether the "your story is ready" email has been sent, so
-- the background cron sweep and the client don't send it twice.
ALTER TABLE public.stories ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.stories ADD COLUMN notified_at TIMESTAMPTZ;
