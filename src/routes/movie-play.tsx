import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, Film, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Btn } from "@/components/bingo-ui";
import { chooseMovieRole, closeMovieRoom, getMovieRoom, guessMovieLetter, setMovieAnswer } from "@/lib/movie-game.functions";
import { initialMovieHints, MOVIES, normalizeMovie, type MovieCategory } from "@/lib/movie-game";
import { getPlayerToken } from "@/lib/player-token";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/movie-play")({
  validateSearch: z.object({ mode: z.enum(["ai", "pvp"]).catch("ai"), room: z.string().optional() }),
  head: () => ({ meta: [{ title: "Guess the Movie — Grid Glory" }] }),
  component: MoviePlay,
});

type MovieState = {
  code: string;
  status: "waiting" | "choosing" | "playing" | "finished";
  mySlot: "p1" | "p2";
  myChoice: "guess" | "set" | null;
  opponentReady: boolean;
  guesserSlot: "p1" | "p2" | null;
  setterSlot: "p1" | "p2" | null;
  role: "guesser" | "setter" | null;
  category: MovieCategory | null;
  title: string | null;
  maskedTitle: string | null;
  guessedLetters: string[];
  wrongGuesses: number;
  winner: "p1" | "p2" | null;
};

function MoviePlay() {
  const { mode, room } = Route.useSearch();
  const [category, setCategory] = useState<MovieCategory | null>(null);
  const [aiTitle, setAiTitle] = useState<string | null>(null);
  const [aiGuesses, setAiGuesses] = useState<string[]>([]);
  const [aiWrong, setAiWrong] = useState(0);
  const [state, setState] = useState<MovieState | null>(null);
  const [pendingChoice, setPendingChoice] = useState<"guess" | "set" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const token = useRef("");
  const [gone, setGone] = useState(false);
  const getFn = useCallback(getMovieRoom, []);

  const refresh = useCallback(async () => {
    if (!room) return;
    try {
      const result = await getFn({ data: { code: room, token: token.current } });
      if (result.state) { setState(result.state as MovieState); setError(null); }
      else {
        const message = result.error ?? "Could not load movie room";
        if (/doesn't exist|not in this movie room/i.test(message)) { setGone(true); setState(null); setError(null); }
        else setError(message);
      }
    } catch (reason) { setError((reason as Error).message); }
  }, [room, getFn]);

  useEffect(() => {
    if (mode !== "pvp" || !room) return;
    token.current = getPlayerToken();
    if (pendingClose) { window.clearTimeout(pendingClose); pendingClose = null; }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 1200);
    const code = room;
    const close = () => { void closeMovieRoom({ data: { code, token: token.current } }).catch(() => {}); };
    window.addEventListener("pagehide", close);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pagehide", close);
      // Delay so a quick dev remount doesn't close the room by mistake.
      pendingClose = window.setTimeout(() => { pendingClose = null; close(); }, 400);
    };
  }, [mode, room, refresh]);

  useEffect(() => { if (gone) setError(null); }, [gone]);

  const startAI = (nextCategory: MovieCategory) => {
    const choices = MOVIES[nextCategory];
    setCategory(nextCategory);
    setAiTitle(choices[Math.floor(Math.random() * choices.length)]!);
    setAiGuesses([]);
    setAiWrong(0);
  };
  const aiSolved = !!aiTitle && [...normalizeMovie(aiTitle)].every((char) => "aeiou".includes(char) || aiGuesses.includes(char.toUpperCase()));
  const aiFinished = aiSolved || aiWrong >= 9;

  const guessAI = (letter: string) => {
    if (!aiTitle || aiFinished || aiGuesses.includes(letter)) return;
    setAiGuesses((previous) => [...previous, letter]);
    if (!aiTitle.toUpperCase().includes(letter)) setAiWrong((wrong) => wrong + 1);
  };

  const guessOnline = async (letter: string) => {
    if (!room) return;
    try {
      const result = await guessMovieLetter({ data: { code: room, token: token.current, letter } });
      if (result.state) setState(result.state as MovieState);
    } catch (reason) { setError((reason as Error).message); }
  };
  const guessedLetters = mode === "ai" ? aiGuesses : state?.guessedLetters ?? [];
  const wrong = mode === "ai" ? aiWrong : state?.wrongGuesses ?? 0;
  const activeTitle = mode === "ai" ? aiTitle : state?.title;
  const maskedTitle = mode === "ai" ? aiTitle : state?.maskedTitle;
  const onlineFinished = state?.status === "finished";
  const hasWon = mode === "ai" ? aiSolved : state?.winner === state?.mySlot;
  const finished = mode === "ai" ? aiFinished : !!onlineFinished;
  const categoryWord = category ?? state?.category ?? "hollywood";
  const movieDisplay = useMemo(() => {
    if (mode === "pvp" && state?.role === "guesser") return state.maskedTitle ?? "";
    if (mode === "pvp" && state?.role === "setter" && state.title) {
      const hints = initialMovieHints(state.title);
      return [...state.title].map((char, index) => {
        if (char === " ") return " ";
        if (hints[index]) return hints[index];
        return state.guessedLetters.includes(char.toUpperCase()) ? char : "_";
      }).join("");
    }
    if (mode === "pvp") return state?.title ?? "";
    return aiTitle ? initialMovieHints(aiTitle).map((char, index) => char || (aiGuesses.some((letter) => aiTitle[index]?.toUpperCase() === letter) ? aiTitle[index] : "_" )).join("") : "";
  }, [mode, state?.role, state?.maskedTitle, state?.title, aiTitle, aiGuesses]);

  if (mode === "pvp" && !room) return <PageShell><Panel><p className="text-center text-muted-foreground">Create or join a private room from the Guess the Movie page.</p><Link to="/movie" className="mx-auto mt-4 block w-fit text-accent underline">Back to Guess the Movie</Link></Panel></PageShell>;

  if (mode === "pvp" && gone) return <PageShell><Panel className="text-center"><h1 className="font-display text-4xl tracking-wide">ROOM DOESN'T EXIST</h1><p className="mt-2 text-muted-foreground">This room was closed or never existed.</p><Link to="/movie" className="mx-auto mt-4 block w-fit text-accent underline">Back to Guess the Movie</Link></Panel></PageShell>;

  const copyInvite = async () => {
    if (!state) return;
    await navigator.clipboard.writeText(`${window.location.origin}/movie-play?mode=pvp&room=${state.code}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <PageShell>
      {error && <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {mode === "ai" && !category && (
        <Panel className="text-center">
          <Film className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-3 font-display text-4xl tracking-wide">CHOOSE YOUR MOVIE INDUSTRY</h1>
          <p className="mt-2 text-muted-foreground">Pick a category to get a mystery movie.</p>
          <CategoryButtons onSelect={startAI} />
        </Panel>
      )}

      {mode === "pvp" && !state && !error && <Panel className="text-center text-muted-foreground">Connecting to your movie room…</Panel>}

      {mode === "pvp" && state?.status === "waiting" && (
        <Panel className="text-center">
          <p className="text-muted-foreground">Share this room code with your opponent</p>
          <div className="mt-3 font-display text-6xl tracking-[0.24em] text-accent">{state.code}</div>
          <Btn className="mt-4" onClick={copyInvite}>{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? "Copied" : "Copy invite link"}</Btn>
          <p className="mt-4 text-sm text-muted-foreground">Waiting for your friend to join…</p>
        </Panel>
      )}

      {mode === "pvp" && state?.status === "choosing" && !state.role && (
        <Panel className="text-center">
          {!state.myChoice ? <>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Choose your role</p>
            <h1 className="mt-2 font-display text-4xl tracking-wide">HOW DO YOU WANT TO PLAY?</h1>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button aria-pressed={pendingChoice === "guess"} onClick={() => setPendingChoice("guess")} className={cn("rounded-xl p-5 text-left transition", pendingChoice === "guess" ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background" : "bg-secondary hover:bg-secondary/70")}><span className="font-display text-2xl">Guess the movie</span><span className="mt-1 block text-sm opacity-80">Your friend writes the secret movie name — you solve it.</span></button>
              <button aria-pressed={pendingChoice === "set"} onClick={() => setPendingChoice("set")} className={cn("rounded-xl p-5 text-left transition", pendingChoice === "set" ? "bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2 ring-offset-background" : "bg-secondary hover:bg-secondary/70")}><span className="font-display text-2xl">Give a movie</span><span className="mt-1 block text-sm opacity-80">You write the secret movie name — your friend solves it.</span></button>
            </div>
            <Btn className="mt-4" disabled={!pendingChoice} onClick={() => pendingChoice && chooseRole(room!, pendingChoice).then(setState).catch((e) => setError(e.message))}>Ready to play</Btn>
          </> : <><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Choice locked in</p><h1 className="mt-2 font-display text-4xl tracking-wide">WAITING FOR YOUR OPPONENT</h1><p className="mt-3 text-muted-foreground">{state.opponentReady ? "Assigning roles…" : "Once both players choose, the roles are set. Matching choices are decided at random."}</p><div className="mx-auto mt-5 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-accent" /></>}
        </Panel>
      )}

      {mode === "pvp" && state?.status === "choosing" && state.role === "guesser" && (
        <Panel className="text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Your role · Guesser</p><h1 className="mt-2 font-display text-4xl tracking-wide">GET READY TO GUESS</h1><p className="mt-3 text-muted-foreground">Your opponent is choosing a Hollywood or Bollywood movie.</p><div className="mx-auto mt-5 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-accent" /></Panel>
      )}

      {mode === "pvp" && state?.status === "choosing" && state.role === "setter" && (
        <Panel><p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-accent">Your role · Movie setter</p><h1 className="mt-2 text-center font-display text-4xl tracking-wide">PICK A MOVIE FOR THEM</h1><p className="mt-2 text-center text-sm text-muted-foreground">The title stays hidden from your opponent until the round ends.</p><MoviePicker busy={false} onSubmit={async (nextCategory, title) => {
          const result = await setMovieAnswer({ data: { code: room!, token: token.current, category: nextCategory, title } });
          setCategory(nextCategory); setState(result.state as MovieState);
        }} /></Panel>
      )}

      {(mode === "ai" && !!aiTitle || mode === "pvp" && state?.status === "playing") && (
        <>
          <div className="mb-4 flex items-center justify-between gap-4"><span className="rounded-full bg-accent/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-accent">{categoryWord}</span><span className="font-display text-2xl">{mode === "pvp" ? state?.role === "setter" ? "YOUR MOVIE" : "YOUR TURN TO GUESS" : "GUESS THE MOVIE"}</span><span className="font-display text-2xl text-primary">{9 - wrong} tries</span></div>
          <Panel>
            <div className="flex min-h-24 flex-wrap items-center justify-center gap-x-2 gap-y-3 py-2 sm:gap-x-3" aria-label="Movie title">
              {[...movieDisplay].map((char, index) => <span key={`${index}-${char}`} className={cn("px-0.5 text-center font-display text-3xl tracking-wide sm:text-5xl", char === " " ? "w-3 sm:w-6" : "min-w-[0.65em] border-b-2 border-border")}>{char === " " ? "" : char}</span>)}
            </div>
            {mode === "pvp" && state?.role === "setter" && <p className="mt-1 text-center text-sm text-muted-foreground">Your opponent has {wrong} wrong {wrong === 1 ? "guess" : "guesses"}.</p>}
            <WrongLetters category={categoryWord} wrong={wrong} />
            {finished && <div className="mt-5 border-t border-border pt-5 text-center"><h2 className={cn("font-display text-4xl tracking-wide", hasWon ? "text-accent" : "text-primary")}>{hasWon ? "YOU GOT IT!" : "ROUND OVER"}</h2><p className="mt-2 text-muted-foreground">{activeTitle ? <>The movie was <span className="font-semibold text-foreground">{activeTitle}</span></> : "The answer is revealed."}</p>{mode === "ai" && <Btn className="mt-4" onClick={() => { setCategory(null); setAiTitle(null); setAiGuesses([]); setAiWrong(0); }}><RotateCcw className="mr-2 h-4 w-4" /> Play again</Btn>}</div>}
          </Panel>
          {(mode === "ai" || state?.role === "guesser") && !finished && <Keyboard guessed={guessedLetters} onGuess={mode === "ai" ? guessAI : (letter) => void guessOnline(letter)} />}
        </>
      )}

      {mode === "pvp" && state?.status === "finished" && <Panel className="text-center"><h2 className={cn("font-display text-4xl tracking-wide", state.winner === state.mySlot ? "text-accent" : "text-primary")}>{state.winner === state.mySlot ? "YOU WIN!" : "ROUND OVER"}</h2><p className="mt-2 text-muted-foreground">The movie was <span className="font-semibold text-foreground">{state.title}</span></p><Btn className="mt-5" onClick={() => window.location.assign("/movie")}>Back to game menu</Btn></Panel>}
      <p className="mt-5 text-center text-xs text-muted-foreground">Wrong guesses cross letters off {categoryWord.toUpperCase()}.</p>
    </PageShell>
  );
}

let pendingClose: number | null = null;

async function chooseRole(code: string, choice: "guess" | "set") {
  const result = await chooseMovieRole({ data: { code, token: getPlayerToken(), choice } });
  return result.state as MovieState;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <main className="relative min-h-screen overflow-hidden px-4 py-4 sm:px-8 sm:py-6"><div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-accent/10 blur-3xl" /><div className="relative mx-auto max-w-4xl"><header className="relative flex items-center justify-center"><Link to="/movie" className="absolute left-0 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span></Link><Link to="/movie" className="font-display text-2xl tracking-wide text-primary">GUESS THE MOVIE</Link></header><div className="mt-7">{children}</div></div></main>;
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) { return <section className={cn("rounded-2xl border border-border bg-card/85 p-5 shadow-xl sm:p-7", className)}>{children}</section>; }

function CategoryButtons({ onSelect, selected }: { onSelect: (category: MovieCategory) => void; selected?: MovieCategory }) {
  return <div className="mx-auto mt-6 grid max-w-lg gap-3 sm:grid-cols-2">{(["hollywood", "bollywood"] as MovieCategory[]).map((item) => <button key={item} aria-pressed={selected === item} onClick={() => onSelect(item)} className={cn("rounded-xl px-5 py-4 font-display text-2xl tracking-wide transition", selected === item ? "bg-accent text-accent-foreground" : "bg-secondary hover:bg-accent/80 hover:text-accent-foreground")}>{item}</button>)}</div>;
}

function MoviePicker({ busy, onSubmit }: { busy: boolean; onSubmit: (category: MovieCategory, title: string) => Promise<void> }) {
  const [category, setCategory] = useState<MovieCategory>("hollywood");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clean = title.trim().replace(/\s+/g, " ");
  const valid = clean.length >= 2 && clean.length <= 60 && /[a-z]/i.test(clean) && /^[a-z0-9 '&:.,!?-]+$/i.test(clean);
  return <div className="mx-auto mt-5 max-w-xl">
    <CategoryButtons selected={category} onSelect={setCategory} />
    <label className="mt-5 block text-sm font-semibold text-muted-foreground">Type the secret movie name
      <input type="password" autoComplete="off" value={title} maxLength={60} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. The Dark Knight" className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground" />
    </label>
    <p className="mt-1 text-xs text-muted-foreground">English letters, numbers and spaces only. Hidden so your opponent can't peek.</p>
    {clean.length > 0 && <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">What your friend sees first</p>
      <div className="mt-2 flex min-h-14 flex-wrap items-center justify-center gap-x-2 gap-y-2" aria-label="Initial reveal preview">
        {[...initialMovieHints(clean)].map((char, index) => <span key={`${index}-${char}`} className={cn("px-0.5 text-center font-display text-2xl tracking-wide sm:text-3xl", char === " " ? "w-2 sm:w-4" : "min-w-[0.65em] border-b-2 border-border")}>{char === " " ? "" : char || "_"}</span>)}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">Vowels are shown from the start — your friend guesses the consonants.</p>
    </div>}
    <Btn className="mt-4 w-full" disabled={saving || busy || !valid} onClick={async () => { setSaving(true); setError(null); try { await onSubmit(category, clean); } catch (reason) { setError((reason as Error).message); } finally { setSaving(false); } }}>{saving ? "Starting…" : "Ready to play"}</Btn>
    {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
  </div>;
}

function WrongLetters({ category, wrong }: { category: MovieCategory; wrong: number }) {
  const word = category === "bollywood" ? "BOLLYWOOD" : "HOLLYWOOD";
  return <div className="mt-6 border-t border-border pt-4"><div className="text-center text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Wrong guesses · {wrong}/9</div><div className="mt-3 flex justify-center gap-1 sm:gap-2">{[...word].map((letter, index) => <span key={`${letter}-${index}`} className={cn("relative grid h-9 w-8 place-items-center rounded-md bg-secondary font-display text-xl sm:h-11 sm:w-10 sm:text-2xl", index < wrong && "text-muted-foreground/40")}><span className={index < wrong ? "line-through decoration-primary decoration-2" : ""}>{letter}</span></span>)}</div></div>;
}

function Keyboard({ guessed, onGuess }: { guessed: string[]; onGuess: (letter: string) => void }) {
  return <section aria-label="Guess a consonant" className="mx-auto mt-5 grid max-w-3xl grid-cols-7 gap-1.5 sm:grid-cols-11 sm:gap-2">{[..."BCDFGHJKLMNPQRSTVWXYZ"].map((letter) => <button key={letter} disabled={guessed.includes(letter)} onClick={() => onGuess(letter)} className={cn("h-11 rounded-lg bg-secondary font-display text-xl transition hover:bg-accent hover:text-accent-foreground disabled:cursor-default disabled:opacity-30 sm:h-12", guessed.includes(letter) && "line-through")}>{letter}</button>)}</section>;
}
