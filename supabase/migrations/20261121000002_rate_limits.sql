-- Create rate_limits table for atomic server-side rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
    key text PRIMARY KEY,
    points integer NOT NULL DEFAULT 1,
    expire_at timestamp with time zone NOT NULL
);

-- Enable Row Level Security (Service role only, no public access)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Index on expire_at for lookup performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_expire_at ON public.rate_limits (expire_at);

-- Atomic stored procedure for rate limit check & increment
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_key text,
    p_max_points integer,
    p_window_seconds integer
) RETURNS boolean AS $$
DECLARE
    v_now timestamptz := clock_timestamp();
    v_expire timestamptz := v_now + (p_window_seconds || ' seconds')::interval;
    v_points integer;
BEGIN
    -- Delete expired key if present
    DELETE FROM public.rate_limits WHERE key = p_key AND expire_at <= v_now;

    -- Upsert points
    INSERT INTO public.rate_limits (key, points, expire_at)
    VALUES (p_key, 1, v_expire)
    ON CONFLICT (key) DO UPDATE
    SET points = public.rate_limits.points + 1
    RETURNING points INTO v_points;

    -- Check if exceeded
    IF v_points > p_max_points THEN
        RETURN false; -- Exceeded
    ELSE
        RETURN true;  -- Allowed
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
