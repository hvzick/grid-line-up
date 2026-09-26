import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BoardView, Btn, PlayerLabel } from "@/components/bingo-ui";
import { completedLines, emptyGrid, fillRandom, type Grid } from "@/lib/bingo";
import {
  callNumber,
  cancelMatch,
  getMatchState,
  joinRoom,
  requestRematch,
  submitGrid,
} from "@/lib/online.functions";
import { getPlayerToken } from "@/lib/player-token";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/online/$code")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Online Match — Bingo Duel" },
      { name: "description", content: "Play a live 1v1 number bingo match against a real opponent." },
      { property: "og:title", content: "Online Match — Bingo Duel" },
      { property: "og:description", content: "Join my Bingo Duel room and play live 1v1 number bingo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OnlinePage,
});

type State = NonNullable<Awaited<ReturnType<typeof getMatchState>>["state"]>;

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return now;
}

function OnlinePage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getMatchState);
  const joinFn = useServerFn(joinRoom);
  const submitFn = useServerFn(submitGrid);
  const callFn = useServerFn(callNumber);
  const rematchFn = useServerFn(requestRematch);
  const cancelFn = useServerFn(cancelMatch);

  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Grid>(emptyGrid);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const now = useNow();
  const token = useRef("");
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const refresh = useCallback(async () => {
    const r = await getFn({ data: { token: token.current, code } });
    if (r.state) {
      setState(r.state);
      setError(null);
    } else if (r.error === "You are not in this match") {
      const j = await joinFn({ data: { token: token.current, code } });
      if (j.error) setError(j.error);
      else {
        const r2 = await getFn({ data: { token: token.current, code } });
        if (r2.state) setState(r2.state);
      }
    } else setError(r.error);
  }, [code, getFn, joinFn]);

  useEffect(() => {
    token.current = getPlayerToken();
    setState(null);
    setDraft(emptyGrid());
    refresh();
    const channel = supabase
      .channel(`match-${code}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "number_called" }, ({ payload }) => {
        const n = Number((payload as { n?: number })?.n);
        const from = (payload as { slot?: string })?.slot;
        if (!Number.isInteger(n)) return;
        setState((prev) => {
          if (!prev || prev.status !== "playing" || prev.called.includes(n)) return prev;
          return {
            ...prev,
            called: [...prev.called, n],
            currentTurn: from === "p1" ? "p2" : "p1",
            turnDeadline: new Date(Date.now() + 15_000).toISOString(),
          };
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "matches", filter: `room_code=eq.${code}` }, (payload) => {
        const row = payload.new as Record<string, unknown> | null;
        if (!row || !row["status"]) {
          refresh();
          return;
        }
        let needsRefresh = false;
        setState((prev) => {
          if (!prev) {
            needsRefresh = true;
            return prev;
          }
          const status = row["status"] as State["status"];
          const ready = prev.mySlot === "p1" ? row["p2_ready"] : row["p1_ready"];
          // grids / slots live in another table: only fetch when the phase changes
          if (status !== prev.status) needsRefresh = true;
          return {
            ...prev,
            status,
            currentTurn: (row["current_turn"] as State["currentTurn"]) ?? null,
            called: (row["called_numbers"] as number[]) ?? prev.called,
            winner: (row["winner"] as State["winner"]) ?? null,
            turnDeadline: (row["turn_deadline"] as string | null) ?? null,
            setupDeadline: (row["setup_deadline"] as string | null) ?? null,
            rematchCode: (row["rematch_code"] as string | null) ?? null,
            oppReady: !!ready || prev.oppReady,
          };
        });
        if (needsRefresh) refresh();
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [code, refresh]);

  // deadlines: ask server to resolve timeouts
  const setupLeft = state?.setupDeadline ? Math.ceil((Date.parse(state.setupDeadline) - 2000 - now) / 1000) : 0;
  const turnLeft = state?.turnDeadline ? Math.ceil((Date.parse(state.turnDeadline) - now) / 1000) : 0;
  const submittedRef = useRef(false);
  useEffect(() => {
    submittedRef.current = false;
  }, [code]);

  useEffect(() => {
    if (!state) return;
    if (state.status === "setup" && !state.myReady && setupLeft <= 0 && !submittedRef.current) {
      submittedRef.current = true;
      submitFn({ data: { token: token.current, code, grid: draftRef.current } }).then(refresh);
    }
  }, [state, setupLeft, code, submitFn, refresh]);

  const lastTick = useRef(0);
  useEffect(() => {
    if (!state) return;
    const overdue =
      (state.status === "setup" && state.setupDeadline && now > Date.parse(state.setupDeadline) + 1000) ||
      (state.status === "playing" && state.turnDeadline && now > Date.parse(state.turnDeadline) + 700);
    if (overdue && now - lastTick.current > 1500) {
      lastTick.current = now;
      refresh();
    }
  }, [now, state, refresh]);

  const calledSet = useMemo(() => new Set(state?.called ?? []), [state?.called]);

  if (error)
    return (
      <Shell>
        <div className="mt-16 text-center">
          <p className="text-lg">{error}</p>
          <Link to="/" className="mt-4 inline-block rounded-lg bg-secondary px-5 py-2.5 font-semibold text-secondary-foreground">
            Home
          </Link>
        </div>
      </Shell>
    );
  if (!state) return <Shell><p className="mt-16 text-center text-muted-foreground">Connecting…</p></Shell>;

  const leave = async () => {
    await cancelFn({ data: { token: token.current, code } });
    navigate({ to: "/" });
  };

  if (state.status === "waiting") {
    const link = `${window.location.origin}/online/${state.code}`;
    return (
      <Shell>
        <section className="mt-16 flex flex-col items-center gap-6 text-center">
          {state.isPublic ? (
            <>
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-accent" />
              <h2 className="font-display text-5xl tracking-wide">Searching for opponent…</h2>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">Share this code with your friend</p>
              <div className="font-display text-7xl tracking-[0.3em] text-accent">{state.code}</div>
              <Btn
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
              >
                {copied ? "Copied!" : "Copy invite link"}
              </Btn>
              <p className="text-sm text-muted-foreground">Waiting for your friend to join…</p>
            </>
          )}
          <Btn variant="secondary" onClick={leave}>Cancel</Btn>
        </section>
      </Shell>
    );
  }

  if (state.status === "setup") {
    const used = new Set(draft.filter((n): n is number => n !== null));
    const nextFree = () => {
      for (let i = 1; i <= 25; i++) if (!used.has(i)) return i;
      return null;
    };
    const onCell = (idx: number) => {
      const g = [...draft];
      if (g[idx] !== null) g[idx] = null;
      else {
        const n = selectedNum && !used.has(selectedNum) ? selectedNum : nextFree();
        if (n === null) return;
        g[idx] = n;
        setSelectedNum(null);
      }
      setDraft(g);
    };
    const secs = Math.max(setupLeft, 0);
    const timer = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

    if (state.myReady)
      return (
        <Shell right={<Timer label="Setup" value={timer} />}>
          <section className="mt-6 flex flex-col items-center gap-4">
            <BoardView grid={state.myGrid ?? []} called={calledSet} lines={[]} />
            <p className="text-muted-foreground">
              {state.oppReady ? "Starting…" : "Locked in. Waiting for opponent…"}
            </p>
          </section>
        </Shell>
      );

    return (
      <Shell right={<Timer label="Fill your grid" value={timer} />}>
        <section className="mt-6 flex flex-col items-center gap-6">
          <p className="text-sm text-muted-foreground">
            Opponent: {state.oppReady ? "ready ✓" : "filling their grid…"}
          </p>
          <BoardView grid={draft} onCell={onCell} called={calledSet} lines={[]} />
          <div className="flex max-w-md flex-wrap justify-center gap-1.5">
            {Array.from({ length: 25 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                disabled={used.has(n)}
                onClick={() => setSelectedNum(n === selectedNum ? null : n)}
                className={cn(
                  "h-9 w-9 rounded-md text-sm font-bold transition",
                  used.has(n)
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
          <div className="flex gap-3">
            <Btn onClick={() => setDraft(fillRandom(draft))} variant="secondary">Random fill</Btn>
            <Btn onClick={() => setDraft(emptyGrid())} variant="secondary">Clear</Btn>
            <Btn
              onClick={() => {
                submittedRef.current = true;
                submitFn({ data: { token: token.current, code, grid: draft } }).then(refresh);
              }}
            >
              Ready
            </Btn>
          </div>
          <p className="text-xs text-muted-foreground">Empty cells are filled randomly when you press Ready.</p>
        </section>
      </Shell>
    );
  }

  const me = state.mySlot;
  const myGrid = (state.myGrid ?? []) as number[];
  const myLines = completedLines(myGrid, calledSet);
  const oppLinesArr = state.oppGrid ? completedLines(state.oppGrid, calledSet) : [];
  const myTurn = state.status === "playing" && state.currentTurn === me;
  const finished = state.status === "finished";

  return (
    <Shell
      right={
        !finished && (
          <Timer
            label={myTurn ? "Your turn" : "Opponent's turn"}
            value={`${Math.max(turnLeft, 0)}s`}
            hot={turnLeft <= 5}
          />
        )
      }
    >
      {finished && (
        <div className="mt-6 rounded-xl bg-card p-6 text-center">
          <h2 className={cn("font-display text-6xl tracking-wide", state.winner === me ? "text-accent" : "text-primary")}>
            {state.winner === me ? "You win!" : "Opponent wins"}
          </h2>
          <div className="mt-4 flex justify-center gap-3">
            <Btn
              onClick={async () => {
                const r = await rematchFn({ data: { token: token.current, code } });
                navigate({ to: "/online/$code", params: { code: r.code } });
              }}
            >
              {state.rematchCode ? "Accept rematch" : "Rematch"}
            </Btn>
            <Link to="/" className="rounded-lg bg-secondary px-5 py-2.5 font-semibold text-secondary-foreground">
              Home
            </Link>
          </div>
          {state.rematchCode && <p className="mt-2 text-sm text-muted-foreground">Your opponent wants a rematch!</p>}
        </div>
      )}
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="flex flex-col items-center gap-3">
          <PlayerLabel name="You" lines={myLines.length} active={myTurn} />
          <BoardView
            grid={myGrid}
            called={calledSet}
            lines={myLines}
            onCell={(i) => myTurn && callFn({ data: { token: token.current, code, n: myGrid[i]! } })}
            interactive={myTurn}
          />
        </div>
        <div className="flex flex-col items-center gap-3">
          <PlayerLabel
            name="Opponent"
            lines={finished ? oppLinesArr.length : state.oppLines}
            active={state.status === "playing" && !myTurn}
          />
          {state.oppGrid ? (
            <BoardView grid={state.oppGrid} called={calledSet} lines={oppLinesArr} />
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
          {state.called.map((n, i) => (
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
    </Shell>
  );
}

function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="flex items-center justify-between">
        <Link to="/" className="font-display text-3xl tracking-wide text-primary">
          BINGO DUEL
        </Link>
        {right}
      </header>
      {children}
    </main>
  );
}

function Timer({ label, value, hot }: { label: string; value: string; hot?: boolean }) {
  return (
    <div className="text-right">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={cn("font-display text-4xl tabular-nums", hot ? "text-primary" : "text-foreground")}>{value}</div>
    </div>
  );
}
