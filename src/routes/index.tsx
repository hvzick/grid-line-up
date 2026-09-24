import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bingo Duel — 1v1 Number Bingo" },
      { name: "description", content: "Fill your 5x5 grid, call numbers, and complete 5 lines first to win." },
      { property: "og:title", content: "Bingo Duel — 1v1 Number Bingo" },
      { property: "og:description", content: "Fill your 5x5 grid, call numbers, and complete 5 lines first to win." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="font-display text-8xl tracking-wide text-primary">BINGO DUEL</h1>
      <p className="mt-2 text-muted-foreground">1v1 number bingo on a 5x5 grid</p>
      <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
        <Link
          to="/play"
          className="rounded-xl bg-primary px-6 py-4 font-display text-3xl tracking-wide text-primary-foreground transition hover:scale-[1.02]"
        >
          Play vs Bot
        </Link>
        <button
          disabled
          className="cursor-not-allowed rounded-xl border border-border bg-secondary px-6 py-4 font-display text-3xl tracking-wide text-muted-foreground"
        >
          vs Friend <span className="block text-sm font-sans">Coming soon</span>
        </button>
      </div>
      <section className="mt-12 rounded-xl bg-card p-6 text-left text-sm leading-relaxed">
        <h2 className="font-display text-2xl tracking-wide text-accent">How to play</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-card-foreground/90">
          <li>You have 2 minutes to place numbers 1–25 on your grid. Empty cells get filled randomly.</li>
          <li>Take turns calling a number (15 seconds each, or one is picked for you). It's crossed on both grids.</li>
          <li>Complete rows, columns or diagonals. First to 5 lines — B·I·N·G·O — wins.</li>
        </ol>
      </section>
    </main>
  );
}
