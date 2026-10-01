import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { OnlineLobby } from "@/components/OnlineLobby";

export const Route = createFileRoute("/bingo")({
  head: () => ({
    meta: [
      { title: "Bingo Duel — Grid Glory" },
      { name: "description", content: "Fill your 5×5 grid, call numbers, and complete five lines to win Bingo Duel." },
      { property: "og:title", content: "Bingo Duel — Grid Glory" },
      { property: "og:description", content: "Fill your 5×5 grid, call numbers, and complete five lines to win Bingo Duel." },
    ],
  }),
  component: BingoInfo,
});

function BingoInfo() {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-3 sm:px-8 sm:py-4">
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All games
          </Link>
          <Link to="/" className="font-display text-xl tracking-[0.12em] text-foreground">
            GRID <span className="text-primary">GLORY</span>
          </Link>
        </header>

        <section className="mx-auto mt-5 max-w-2xl text-center sm:mt-6">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-accent">Game 01 · Available now</p>
          <h1 className="mt-1 font-display text-6xl leading-none tracking-wide text-foreground sm:text-7xl">BINGO DUEL</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
            A head-to-head number game. Plan your grid, watch every call, and be the first to complete five lines.
          </p>
        </section>

        <section aria-label="Choose how to play" className="mx-auto mt-5 grid max-w-2xl gap-3 sm:mt-6 sm:grid-cols-2">
          <Link
            to="/play"
            className="inline-flex min-h-14 items-center justify-between rounded-xl bg-primary px-5 py-3 font-display text-2xl tracking-wide text-primary-foreground transition hover:-translate-y-0.5 hover:brightness-110 sm:text-3xl"
          >
            Play vs Bot <ArrowUpRight className="h-5 w-5" />
          </Link>
          <OnlineLobby />
        </section>

        <section className="mx-auto mt-5 max-w-2xl rounded-2xl border border-border bg-card/80 p-4 sm:mt-6 sm:p-5">
          <h2 className="font-display text-2xl tracking-wide text-accent sm:text-3xl">HOW TO PLAY</h2>
          <ol className="mt-2 space-y-2 text-sm leading-snug text-card-foreground/90 sm:mt-3">
            <li className="flex gap-3"><Step n="1" /> <span>You have 2 minutes to place numbers 1–25 on your grid. Empty cells get filled randomly.</span></li>
            <li className="flex gap-3"><Step n="2" /> <span>Take turns calling a number (15 seconds each, or one is picked for you). It’s crossed on both grids.</span></li>
            <li className="flex gap-3"><Step n="3" /> <span>Complete rows, columns or diagonals. First to 5 lines — B·I·N·G·O — wins.</span></li>
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">
            Want the full rulebook? Read our <Link to="/number-bingo-rules" className="font-semibold text-primary underline underline-offset-2">number bingo rules and strategy guide</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}

function Step({ n }: { n: string }) {
  return <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary font-display text-lg text-secondary-foreground">{n}</span>;
}
