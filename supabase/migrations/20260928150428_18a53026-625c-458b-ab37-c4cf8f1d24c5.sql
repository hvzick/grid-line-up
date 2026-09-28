DROP POLICY IF EXISTS "Anyone can view matches" ON public.matches;
REVOKE SELECT ON public.matches FROM anon, authenticated;
GRANT ALL ON public.matches TO service_role;