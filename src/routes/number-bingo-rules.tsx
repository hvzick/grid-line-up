import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/number-bingo-rules")({
  head: () => ({
    meta: [
      { title: "Number Bingo: Rules, Setup & How to Play — Grid Glory" },
      { name: "description", content: "How to play number bingo: fill a 5×5 grid with numbers 1–25, call numbers in turns, and complete five lines to win. Full rules, strategies, and a free online version." },
      { property: "og:title", content: "Number Bingo: Rules, Setup & How to Play — Grid Glory" },
      { property: "og:description", content: "Full number bingo rules: 5×5 grid, numbers 1–25, turn-based calling, and five lines to win. Plus strategies and a free game to try." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NumberBingoRules,
});

function NumberBingoRules() {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-3 sm:px-8 sm:py-4">
      <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-3xl">
        <header className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All games
          </Link>
          <Link to="/" className="font-display text-xl tracking-[0.12em] text-foreground">
            GRID <span className="text-primary">GLORY</span>
          </Link>
        </header>

        <section className="mx-auto mt-6 max-w-2xl text-center">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-accent">Guide</p>
          <h1 className="mt-1 font-display text-5xl leading-none tracking-wide text-foreground sm:text-6xl">
            NUMBER BINGO: RULES & HOW TO PLAY
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Number bingo is a fast, head-to-head twist on classic bingo. Instead of waiting for a caller,
            you build your own board, then race your opponent to complete five lines. Here's the full
            rulebook, plus the strategies that win games.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-primary/35 bg-card/90 p-5 shadow-xl shadow-black/10 sm:p-6">
          <h2 className="font-display text-3xl tracking-wide text-primary">What is number bingo?</h2>
          <p className="mt-2 text-sm leading-relaxed text-card-foreground/90">
            Number bingo is a grid-based game for two or more players. Each player gets a 5×5 board of 25
            squares and writes the numbers 1 to 25 on it — one number per square, each used exactly once.
            Unlike classic bingo, where cards are pre-printed, part of the fun is deciding{" "}
            <em>where</em> to put each number. Players then take turns calling numbers; every called number
            gets crossed off everyone's board. The first player with five complete lines — B·I·N·G·O — wins.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-card-foreground/90">
            It's popular in classrooms as a math practice game and works great as a quick duel between
            friends. If you'd rather play it right now, <Link to="/play" className="font-semibold text-primary underline underline-offset-2">you can play number bingo free against the bot or another player</Link>.
          </p>
        </section>

        <section className="mt-5">
          <h2 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">HOW TO PLAY, STEP BY STEP</h2>
          <ol className="mt-3 space-y-3">
            <Step n="1" title="Set up your grid (2 minutes)">
              You get a blank 5×5 board — 25 empty squares. Place the numbers 1 through 25 wherever you
              like, one per square. Every number must appear exactly once. In the timed version, the clock
              runs for 2 minutes; any squares you leave empty are filled with random numbers, so use your
              time wisely.
            </Step>
            <Step n="2" title="Take turns calling numbers">
              Players alternate. On your turn you have up to 15 seconds to call one number; if you don't
              pick in time, one is chosen for you at random. The called number is crossed off on{" "}
              <em>every</em> player's board — including squares your opponent placed, not just your own.
            </Step>
            <Step n="3" title="Watch your lines form">
              A line is any complete row of 5, any complete column of 5, or either of the two long
              diagonals — 12 possible lines on a 5×5 board. A line counts as complete only when all five
              of its numbers have been called.
            </Step>
            <Step n="4" title="First to five lines wins">
              The first player to complete 5 lines shouts B·I·N·G·O and wins the round. If both players
              reach five lines on the same call, the player who made that call wins the tie.
            </Step>
          </ol>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card/80 p-5">
            <h2 className="font-display text-2xl tracking-wide text-accent">QUICK RULES</h2>
            <ul className="mt-2 space-y-1.5 text-sm leading-snug text-card-foreground/90">
              <li>· Board: 5×5 grid, 25 squares</li>
              <li>· Numbers: 1 to 25, each used once</li>
              <li>· Setup time: 2 minutes (then auto-fill)</li>
              <li>· Turn time: 15 seconds (then auto-call)</li>
              <li>· Lines: 5 rows + 5 columns + 2 diagonals = 12</li>
              <li>· Win: first to complete 5 lines</li>
              <li>· Tie: the caller of the deciding number wins</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card/80 p-5">
            <h2 className="font-display text-2xl tracking-wide text-accent">WHAT COUNTS AS A LINE?</h2>
            <p className="mt-2 text-sm leading-snug text-card-foreground/90">
              Any five squares in a straight unbroken run:
            </p>
            <ul className="mt-1.5 space-y-1.5 text-sm leading-snug text-card-foreground/90">
              <li>· <strong>Rows</strong> — 5 horizontal lines</li>
              <li>· <strong>Columns</strong> — 5 vertical lines</li>
              <li>· <strong>Diagonals</strong> — 2 corner-to-corner lines</li>
            </ul>
            <p className="mt-2 text-sm leading-snug text-card-foreground/90">
              Short two- or three-square runs don't count. The centre square is the most valuable on the
              board because it sits on four lines at once: its row, its column, and both diagonals.
            </p>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="font-display text-4xl tracking-wide text-foreground sm:text-5xl">STRATEGIES TO WIN</h2>
          <div className="mt-3 space-y-3">
            <Strategy title="Build around the centre">
              Place your numbers so that as many as possible sit on overlapping lines. The centre square
              touches four lines; edge-centre squares touch three. Packing your board around intersections
              means a single call can push several lines forward at once.
            </Strategy>
            <Strategy title="Balance your board">
              Don't cluster your numbers in one corner. Spread them across all five rows and columns so
              that early random calls still make progress somewhere. A lopsided board can stall for many
              turns.
            </Strategy>
            <Strategy title="Call to complete, not just to mark">
              When it's your turn, check whether any number completes a line for you right now. If several
              lines are at four of five, one good call can finish two at once. If nothing is close, call
              numbers that sit on your most crowded lines.
            </Strategy>
            <Strategy title="Use the setup clock deliberately">
              Rushing your grid in 10 seconds hands the advantage to chance. Sketch a quick plan first:
              centre and diagonals first, then fill outward. In timed play, always fill the high-value
              squares (centre, edges, diagonal crossings) before the clock beats you.
            </Strategy>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card/80 p-5 sm:p-6">
          <h2 className="font-display text-3xl tracking-wide text-accent sm:text-4xl">NUMBER BINGO FAQ</h2>
          <div className="mt-3 space-y-4">
            <Faq q="How do you play number bingo?">
              Each player fills a 5×5 grid with the numbers 1–25, one per square. Players take turns
              calling numbers — 15 seconds per turn in the timed version — and every called number is
              crossed off all boards. First to complete five full rows, columns, or diagonals wins.
            </Faq>
            <Faq q="How many numbers are in number bingo?">
              The classic 5×5 version uses the numbers 1 through 25 — one per square, with no repeats.
              Classroom variants sometimes use larger ranges, but 1–25 keeps every call meaningful.
            </Faq>
            <Faq q="What's the highest number on the board?">
              25. It's also a strategic pick for your board: it can go anywhere, so most players put it on
              a diagonal or the centre to protect a key line.
            </Faq>
            <Faq q="How is number bingo different from classic bingo?">
              In classic 75-ball bingo, cards are pre-printed and a host draws numbers randomly. In number
              bingo the players write the numbers themselves, which adds a planning phase, and turns
              rotate between players rather than a single caller driving the game.
            </Faq>
            <Faq q="Can I play number bingo online for free?">
              Yes — <Link to="/play" className="font-semibold text-primary underline underline-offset-2">Bingo Duel on Grid Glory</Link> is
              free, needs no sign-up, and plays exactly by these rules: 2-minute grid setup, 15-second
              turns, and first to five lines wins. You can play against the bot or duel a friend online.
            </Faq>
          </div>
        </section>

        <section className="mt-6 mb-8 rounded-2xl border border-primary/35 bg-card/90 p-5 text-center shadow-xl shadow-black/10 sm:p-6">
          <h2 className="font-display text-3xl tracking-wide text-foreground sm:text-4xl">READY TO PLAY?</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Put the rules into practice — build your grid and race the bot or a friend to five lines.
          </p>
          <div className="mx-auto mt-4 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/play"
              className="inline-flex min-h-14 items-center justify-between gap-3 rounded-xl bg-primary px-6 py-3 font-display text-2xl tracking-wide text-primary-foreground transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Play vs Bot <ArrowUpRight className="h-5 w-5" />
            </Link>
            <Link
              to="/bingo"
              className="inline-flex min-h-14 items-center justify-between gap-3 rounded-xl border border-accent/40 bg-card px-6 py-3 font-display text-2xl tracking-wide text-accent transition hover:-translate-y-0.5 hover:border-accent"
            >
              Play online 1v1 <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-border bg-card/80 p-4">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary font-display text-xl text-secondary-foreground">{n}</span>
      <div>
        <h3 className="font-display text-xl tracking-wide text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-card-foreground/90">{children}</p>
      </div>
    </li>
  );
}

function Strategy({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4">
      <h3 className="font-display text-xl tracking-wide text-foreground">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-card-foreground/90">{children}</p>
    </div>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-xl tracking-wide text-foreground">{q}</h3>
      <p className="mt-1 text-sm leading-relaxed text-card-foreground/90">{children}</p>
    </div>
  );
}
