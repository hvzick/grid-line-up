import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, Film } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createMovieRoom, joinMovieRoom } from "@/lib/movie-game.functions";
import { getPlayerToken } from "@/lib/player-token";

export const Route = createFileRoute("/movie")({
  head: () => ({ meta: [{ title: "Guess the Movie — Grid Glory" }, { name: "description", content: "Guess a Hollywood or Bollywood movie before you run out of tries." }] }),
  component: MovieInfo,
});

function MovieInfo() {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-3 sm:px-8 sm:py-4">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All games</Link>
          <Link to="/" className="font-display text-xl tracking-[0.12em] text-foreground">GRID <span className="text-primary">GLORY</span></Link>
        </header>
        <section className="mx-auto mt-8 max-w-2xl text-center sm:mt-10">
          <Film className="mx-auto h-10 w-10 text-accent" />
          <p className="mt-4 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-accent">Game 02 · Available now</p>
          <h1 className="mt-1 font-display text-5xl leading-none tracking-wide text-foreground sm:text-7xl">GUESS THE MOVIE</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">Hollywood or Bollywood? Uncover the title by guessing its consonants. Vowels are revealed to get you started.</p>
        </section>
        <section aria-label="Choose how to play" className="mx-auto mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
          <Link to="/movie-play" search={{ mode: "ai" }} className="inline-flex min-h-16 items-center justify-between rounded-xl bg-primary px-5 py-3 font-display text-2xl tracking-wide text-primary-foreground transition hover:-translate-y-0.5 hover:brightness-110 sm:text-3xl">Play vs AI <ArrowUpRight className="h-5 w-5" /></Link>
          <MovieOnlineLobby />
        </section>
        <section className="mx-auto mt-7 max-w-2xl rounded-2xl border border-border bg-card/80 p-4 sm:p-5">
          <h2 className="font-display text-2xl tracking-wide text-accent sm:text-3xl">HOW TO PLAY</h2>
          <ol className="mt-3 space-y-2 text-sm leading-snug text-card-foreground/90">
            <li className="flex gap-3"><Step n="1" /><span>Choose Hollywood or Bollywood. Vowels and spaces are revealed in the movie title.</span></li>
            <li className="flex gap-3"><Step n="2" /><span>Guess consonants one at a time. Each wrong guess crosses off one letter in HOLLYWOOD or BOLLYWOOD.</span></li>
            <li className="flex gap-3"><Step n="3" /><span>You have 9 wrong guesses. In online play, one player sets the movie and the other guesses.</span></li>
          </ol>
        </section>
      </div>
    </main>
  );
}

function MovieOnlineLobby() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enter = (room: string) => navigate({ to: "/movie-play", search: { mode: "pvp", room } });
  const create = async () => {
    setBusy(true); setError(null);
    try { const result = await createMovieRoom({ data: { token: getPlayerToken() } }); enter(result.code); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const join = async () => {
    setBusy(true); setError(null);
    try {
      const result = await joinMovieRoom({ data: { token: getPlayerToken(), code: code.trim().toUpperCase() } });
      if (result.error || !result.code) throw new Error(result.error ?? "Could not join room");
      enter(result.code);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <Dialog>
      <DialogTrigger asChild><button className="inline-flex min-h-16 w-full items-center justify-between rounded-xl bg-accent px-5 py-3 font-display text-2xl tracking-wide text-accent-foreground transition hover:-translate-y-0.5 hover:brightness-110 sm:text-3xl">Online 1v1 <ArrowUpRight className="h-5 w-5" /></button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-3xl tracking-wide">Play Online</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <button disabled={busy} onClick={create} className="w-full rounded-xl bg-primary px-5 py-4 text-left text-primary-foreground disabled:opacity-50"><div className="font-display text-2xl tracking-wide">Create Private Room</div><div className="text-sm opacity-80">Share a room code with a friend</div></button>
          <div className="rounded-xl bg-secondary p-4"><div className="font-display text-2xl tracking-wide">Join Private Room</div><div className="mt-2 flex gap-2"><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" className="w-full rounded-lg border border-border bg-background px-3 py-2 font-display text-2xl tracking-[0.3em] uppercase" /><button disabled={busy || code.trim().length !== 6} onClick={join} className="rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-40">Join</button></div></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Step({ n }: { n: string }) { return <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary font-display text-lg text-secondary-foreground">{n}</span>; }
