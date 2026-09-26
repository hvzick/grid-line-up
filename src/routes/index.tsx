import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Film } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Game Room — Grid Glory" },
      { name: "description", content: "Choose a game and challenge a friend in Grid Glory." },
      { property: "og:title", content: "Game Room — Grid Glory" },
      { property: "og:description", content: "Choose a game and challenge a friend in Grid Glory." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden px-5 py-6 sm:px-8 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <header className="flex items-center justify-between">
          <Link to="/" className="font-display text-2xl tracking-[0.12em] text-foreground">
            GRID <span className="text-primary">GLORY</span>
          </Link>
          <span className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Multiplayer arcade
          </span>
        </header>

        <section className="mx-auto mt-4 max-w-2xl text-center sm:mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-accent">Pick your next challenge</p>
          <h1 className="mt-2 font-display text-5xl tracking-wide text-foreground sm:text-7xl">THE GAME ROOM</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            Choose a game, bring a friend, and see who comes out on top.
          </p>
        </section>

        <section aria-label="Available games" className="mt-6 grid flex-1 content-center gap-4 md:grid-cols-2 md:gap-5">
          <Link
            to="/bingo"
            aria-label="Open Bingo Duel game information"
            className="group relative flex min-h-64 flex-col overflow-hidden rounded-3xl border border-primary/35 bg-card/90 p-5 shadow-2xl shadow-black/10 transition hover:-translate-y-1 hover:border-primary/70 hover:shadow-primary/10 sm:min-h-72 sm:p-7"
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-52 w-52 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/15" />
            <div className="relative flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Available now
              </span>
              <span className="font-display text-2xl tracking-wider text-muted-foreground/60">01</span>
            </div>

            <div className="relative my-auto flex items-center gap-5 py-5">
              <BingoMark />
              <div>
                <h2 className="font-display text-5xl tracking-wide text-foreground sm:text-6xl">BINGO DUEL</h2>
                <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
                  Build your 5×5 board, call numbers, and race to five lines.
                </p>
              </div>
            </div>

            <div className="relative flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs font-bold uppercase tracking-[0.17em] text-muted-foreground">Vs bot · Online 1v1</span>
              <span className="inline-flex items-center gap-1 font-display text-xl tracking-wide text-primary transition group-hover:gap-2">
                View game <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          <Link to="/movie" aria-label="Open Guess the Movie game" className="group relative flex min-h-64 flex-col overflow-hidden rounded-3xl border border-accent/30 bg-card/80 p-5 transition hover:-translate-y-1 hover:border-accent/70 sm:min-h-72 sm:p-7">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-accent">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Available now
              </span>
              <span className="font-display text-2xl tracking-wider text-muted-foreground/60">02</span>
            </div>

            <div className="my-auto flex flex-col items-center py-4 text-center">
              <div className="grid h-20 w-20 place-items-center rounded-[1.5rem] border border-border bg-secondary/80 text-accent sm:h-24 sm:w-24">
                <Film className="h-10 w-10" strokeWidth={1.5} />
              </div>
              <h2 className="mt-4 font-display text-4xl tracking-wide text-foreground sm:text-5xl">GUESS THE MOVIE</h2>
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">Reveal the title one consonant at a time. Nine wrong guesses and the movie wins.</p>
            </div>

            <div className="flex items-center justify-between border-t border-border/70 pt-4">
              <span className="text-xs font-bold uppercase tracking-[0.17em] text-muted-foreground">Vs AI · Online 1v1</span>
              <span className="inline-flex items-center gap-1 font-display text-xl tracking-wide text-accent transition group-hover:gap-2">View game <ArrowUpRight className="h-4 w-4" /></span>
            </div>
          </Link>
        </section>

        <footer className="relative mt-4 text-center text-xs text-muted-foreground/70">
          More games, more rivalries.
        </footer>
      </div>
    </main>
  );
}

function BingoMark() {
  const marked = new Set([2, 6, 7, 8, 12, 16, 17, 18, 22]);

  return (
    <div aria-hidden="true" className="grid h-[4.6rem] w-[4.6rem] shrink-0 grid-cols-5 gap-1 rounded-2xl border border-border bg-background/60 p-2 shadow-inner">
      {Array.from({ length: 25 }, (_, index) => (
        <span key={index} className={`rounded-[3px] ${marked.has(index) ? "bg-accent" : "bg-muted"}`} />
      ))}
    </div>
  );
}
