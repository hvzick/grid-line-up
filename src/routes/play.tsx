import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  botPick,
  completedLines,
  emptyGrid,
  fillRandom,
  randomUncalled,
  type Grid,
} from "@/lib/bingo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Play vs Bot — Bingo Duel" },
      { name: "description", content: "Challenge the bot in a 1v1 number bingo match." },
      { property: "og:title", content: "Play vs Bot — Bingo Duel" },
      { property: "og:description", content: "Challenge the bot in a 1v1 number bingo match." },
    ],
  }),
  component: PlayPage,
});

const SETUP_TIME = 120;
const TURN_TIME = 15;
type Phase = "setup" | "playing" | "finished";
type Turn = "p1" | "p2";

function PlayPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [myGrid, setMyGrid] = useState<Grid>(emptyGrid);
  const [botGrid, setBotGrid] = useState<number[]>([]);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [called, setCalled] = useState<number[]>([]);
  const [turn, setTurn] = useState<Turn>("p1");
  const [timeLeft, setTimeLeft] = useState(SETUP_TIME);
  const [winner, setWinner] = useState<Turn | null>(null);

  const calledSet = useMemo(() => new Set(called), [called]);
  const myFull = myGrid.every((n) => n !== null);
  const myLines = phase === "setup" ? [] : completedLines(myGrid as number[], calledSet);
  const botLines = botGrid.length ? completedLines(botGrid, calledSet) : [];

  const startGame = (grid: Grid) => {
    setMyGrid(fillRandom(grid));
    setBotGrid(fillRandom(emptyGrid()));
    setCalled([]);
    setTurn("p1");
    setTimeLeft(TURN_TIME);
    setPhase("playing");
  };

  const reset = () => {
    setPhase("setup");
    setMyGrid(emptyGrid());
    setBotGrid([]);
    setCalled([]);
    setWinner(null);
    setSelectedNum(null);
    setTimeLeft(SETUP_TIME);
  };

  const call = (n: number) => {
    if (phase !== "playing" || calledSet.has(n)) return;
    const next = new Set(calledSet).add(n);
    setCalled((c) => [...c, n]);
    const meWin = completedLines(myGrid as number[], next).length >= 5;
    const botWin = completedLines(botGrid, next).length >= 5;
    if (meWin || botWin) {
      setWinner(meWin && botWin ? turn : meWin ? "p1" : "p2");
      setPhase("finished");
      return;
    }
    setTurn((t) => (t === "p1" ? "p2" : "p1"));
    setTimeLeft(TURN_TIME);
  };

  // countdown
  useEffect(() => {
    if (phase === "finished") return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase, turn, called.length]);

  // timeouts
  useEffect(() => {
    if (timeLeft > 0) return;
    if (phase === "setup") startGame(myGrid);
    else if (phase === "playing" && turn === "p1") call(randomUncalled(calledSet));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // bot turn
  useEffect(() => {
    if (phase !== "playing" || turn !== "p2") return;
    const id = setTimeout(() => call(botPick(botGrid, calledSet)), 900 + Math.random() * 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turn, called.length]);

  const usedNums = new Set(myGrid.filter((n): n is number => n !== null));
  const nextFree = () => {
    for (let i = 1; i <= 25; i++) if (!usedNums.has(i)) return i;
    return null;
  };

  const onSetupCell = (idx: number) => {
    const g = [...myGrid];
    if (g[idx] !== null) {
      g[idx] = null;
    } else {
      const n = selectedNum && !usedNums.has(selectedNum) ? selectedNum : nextFree();
      if (n === null) return;
      g[idx] = n;
      setSelectedNum(null);
    }
    setMyGrid(g);
  };

  const mins = Math.floor(Math.max(timeLeft, 0) / 60);
  const secs = String(Math.max(timeLeft, 0) % 60).padStart(2, "0");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between">
        <Link to="/" className="font-display text-3xl tracking-wide text-primary">
          BINGO DUEL
        </Link>
        {phase !== "finished" && (
          <div className="text-right">
            <div className="text-xs uppercase text-muted-foreground">
              {phase === "setup" ? "Fill your grid" : turn === "p1" ? "Your turn" : "Bot is thinking…"}
            </div>
            <div
              className={cn(
                "font-display text-4xl tabular-nums",
                timeLeft <= 5 && phase === "playing" ? "text-primary" : "text-foreground",
              )}
            >
              {phase === "setup" ? `${mins}:${secs}` : `${Math.max(timeLeft, 0)}s`}
            </div>
          </div>
        )}
      </header>

      {phase === "setup" && (
        <section className="mt-6 flex flex-col items-center gap-6">
          <BoardView
            grid={myGrid}
            onCell={onSetupCell}
            called={calledSet}
            lines={[]}
          />
          <div className="flex max-w-md flex-wrap justify-center gap-1.5">
            {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                disabled={usedNums.has(n)}
                onClick={() => setSelectedNum(n === selectedNum ? null : n)}
                className={cn(
                  "h-9 w-9 rounded-md text-sm font-bold transition",
                  usedNums.has(n)
                    ? "bg-muted text-muted-foreground/40"
                    : n === selectedNum
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Pick a number (or none for the next one) then tap a cell. Tap a filled cell to clear it.
          </p>
          <div className="flex gap-3">
            <Btn onClick={() => setMyGrid(fillRandom(myGrid))} variant="secondary">Random fill</Btn>
            <Btn onClick={() => setMyGrid(emptyGrid())} variant="secondary">Clear</Btn>
            <Btn onClick={() => startGame(myGrid)} disabled={!myFull}>Ready</Btn>
          </div>
        </section>
      )}

      {phase !== "setup" && (
        <>
          {phase === "finished" && (
            <div className="mt-6 rounded-xl bg-card p-6 text-center">
              <h2 className={cn("font-display text-6xl tracking-wide", winner === "p1" ? "text-accent" : "text-primary")}>
                {winner === "p1" ? "You win!" : "Bot wins"}
              </h2>
              <div className="mt-4 flex justify-center gap-3">
                <Btn onClick={reset}>Play again</Btn>
                <Link to="/" className="rounded-lg bg-secondary px-5 py-2.5 font-semibold text-secondary-foreground">
                  Home
                </Link>
              </div>
            </div>
          )}
          <div className="mt-6 grid gap-8 md:grid-cols-2">
            <div className="flex flex-col items-center gap-3">
              <PlayerLabel name="You" lines={myLines.length} active={turn === "p1" && phase === "playing"} />
              <BoardView
                grid={myGrid}
                called={calledSet}
                lines={myLines}
                onCell={(i) => turn === "p1" && call(myGrid[i] as number)}
                interactive={phase === "playing" && turn === "p1"}
              />
            </div>
            <div className="flex flex-col items-center gap-3">
              <PlayerLabel name="Bot" lines={botLines.length} active={turn === "p2" && phase === "playing"} />
              {phase === "finished" ? (
                <BoardView grid={botGrid} called={calledSet} lines={botLines} />
              ) : (
                <div className="grid aspect-square w-full max-w-sm place-items-center rounded-2xl border-2 border-dashed border-border bg-card/50 font-display text-3xl tracking-wide text-muted-foreground">
                  Hidden
                </div>
              )}
            </div>
          </div>
          <div className="mt-8">
            <h3 className="text-xs uppercase text-muted-foreground">Called numbers</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {called.map((n, i) => (
                <span
                  key={n}
                  className={cn(
                    "animate-pop rounded-md px-2 py-1 text-sm font-bold",
                    i % 2 === 0 ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground",
                  )}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function PlayerLabel({ name, lines, active }: { name: string; lines: number; active: boolean }) {
  return (
    <div className="flex w-full max-w-sm items-center justify-between">
      <span className={cn("font-display text-2xl tracking-wide", active && "text-accent")}>
        {name} {active && "●"}
      </span>
      <span className="flex gap-1">
        {"BINGO".split("").map((l, i) => (
          <span
            key={l}
            className={cn(
              "grid h-8 w-8 place-items-center rounded font-display text-xl",
              i < lines ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {l}
          </span>
        ))}
      </span>
    </div>
  );
}

function BoardView({
  grid,
  called,
  lines,
  onCell,
  interactive = true,
}: {
  grid: (number | null)[];
  called: Set<number>;
  lines: number[][];
  onCell?: (i: number) => void;
  interactive?: boolean;
}) {
  const lineCells = new Set(lines.flat());
  return (
    <div className="grid w-full max-w-sm grid-cols-5 gap-2 rounded-2xl bg-card p-3">
      {grid.map((n, i) => {
        const isCalled = n !== null && called.has(n);
        const inLine = lineCells.has(i);
        return (
          <button
            key={i}
            disabled={!onCell || !interactive || isCalled}
            onClick={() => onCell?.(i)}
            className={cn(
              "aspect-square rounded-lg font-display text-3xl transition",
              n === null && "border-2 border-dashed border-border bg-transparent",
              n !== null && !isCalled && "animate-pop bg-tile text-tile-foreground",
              isCalled && !inLine && "bg-primary text-primary-foreground line-through",
              inLine && "bg-accent text-accent-foreground",
              onCell && interactive && !isCalled && "hover:scale-105 cursor-pointer",
            )}
          >
            {n ?? ""}
          </button>
        );
      })}
    </div>
  );
}

function Btn({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg px-5 py-2.5 font-semibold transition disabled:opacity-40",
        variant === "primary" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </button>
  );
}
