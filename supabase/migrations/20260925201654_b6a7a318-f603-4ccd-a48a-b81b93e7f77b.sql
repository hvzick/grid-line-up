CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL UNIQUE,
  is_public boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'waiting',
  p1_ready boolean NOT NULL DEFAULT false,
  p2_ready boolean NOT NULL DEFAULT false,
  current_turn text,
  called_numbers integer[] NOT NULL DEFAULT '{}',
  winner text,
  setup_deadline timestamptz,
  turn_deadline timestamptz,
  rematch_code text,
  version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.matches TO anon, authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view matches" ON public.matches FOR SELECT TO anon, authenticated USING (true);
ALTER TABLE public.matches REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;

CREATE TABLE public.match_players (
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  slot text NOT NULL,
  player_token text NOT NULL,
  grid integer[],
  PRIMARY KEY (match_id, slot)
);
GRANT ALL ON public.match_players TO service_role;
ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.find_or_create_match(_token text, _code text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE m public.matches;
BEGIN
  SELECT * INTO m FROM public.matches mt
  WHERE mt.is_public AND mt.status = 'waiting'
    AND mt.created_at > now() - interval '10 minutes'
    AND NOT EXISTS (SELECT 1 FROM public.match_players p WHERE p.match_id = mt.id AND p.player_token = _token)
  ORDER BY mt.created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  IF FOUND THEN
    INSERT INTO public.match_players(match_id, slot, player_token) VALUES (m.id, 'p2', _token);
    UPDATE public.matches SET status = 'setup', setup_deadline = now() + interval '122 seconds', version = version + 1 WHERE id = m.id;
    RETURN m.room_code;
  END IF;
  INSERT INTO public.matches(room_code, is_public) VALUES (_code, true) RETURNING * INTO m;
  INSERT INTO public.match_players(match_id, slot, player_token) VALUES (m.id, 'p1', _token);
  RETURN m.room_code;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.find_or_create_match(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_or_create_match(text, text) TO service_role;