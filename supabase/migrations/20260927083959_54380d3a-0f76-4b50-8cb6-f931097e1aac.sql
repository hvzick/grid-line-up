CREATE TABLE public.movie_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','choosing','playing','finished')),
  created_at timestamptz NOT NULL DEFAULT now(),
  guesser_slot text CHECK (guesser_slot IN ('p1','p2')),
  setter_slot text CHECK (setter_slot IN ('p1','p2')),
  category text CHECK (category IN ('hollywood','bollywood')),
  movie_title text,
  guessed_letters text[] NOT NULL DEFAULT '{}',
  wrong_guesses integer NOT NULL DEFAULT 0 CHECK (wrong_guesses BETWEEN 0 AND 9),
  winner text CHECK (winner IN ('p1','p2'))
);
CREATE TABLE public.movie_room_players (
  room_id uuid NOT NULL REFERENCES public.movie_rooms(id) ON DELETE CASCADE,
  slot text NOT NULL CHECK (slot IN ('p1','p2')),
  player_token text NOT NULL,
  choice text CHECK (choice IN ('guess','set')),
  PRIMARY KEY (room_id, slot),
  UNIQUE (room_id, player_token)
);
GRANT ALL ON public.movie_rooms TO service_role;
GRANT ALL ON public.movie_room_players TO service_role;
ALTER TABLE public.movie_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_room_players ENABLE ROW LEVEL SECURITY;