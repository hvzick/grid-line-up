import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createRoom, joinRoom, quickMatch } from "@/lib/online.functions";
import { getPlayerToken } from "@/lib/player-token";

export function OnlineLobby() {
  const navigate = useNavigate();
  const quickFn = useServerFn(quickMatch);
  const createFn = useServerFn(createRoom);
  const joinFn = useServerFn(joinRoom);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = (c: string) => navigate({ to: "/online", search: { room: c } });

  const run = async (fn: () => Promise<string | null>) => {
    setBusy(true);
    setError(null);
    try {
      const c = await fn();
      if (c) go(c);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const opt = "w-full rounded-xl px-5 py-4 text-left transition hover:scale-[1.01] disabled:opacity-50";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="rounded-xl bg-accent px-6 py-4 font-display text-3xl tracking-wide text-accent-foreground transition hover:scale-[1.02]">
          Play Online (1v1)
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-3xl tracking-wide">Play Online</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <button
            disabled={busy}
            className={`${opt} bg-primary text-primary-foreground`}
            onClick={() => run(async () => (await quickFn({ data: { token: getPlayerToken() } })).code)}
          >
            <div className="font-display text-2xl tracking-wide">Quick Match</div>
            <div className="text-sm opacity-80">Get paired with a random player</div>
          </button>
          <button
            disabled={busy}
            className={`${opt} bg-secondary text-secondary-foreground`}
            onClick={() => run(async () => (await createFn({ data: { token: getPlayerToken() } })).code)}
          >
            <div className="font-display text-2xl tracking-wide">Create Private Room</div>
            <div className="text-sm opacity-80">Get a code to share with a friend</div>
          </button>
          <form
            className="rounded-xl bg-secondary p-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                const r = await joinFn({ data: { token: getPlayerToken(), code: code.trim().toUpperCase() } });
                if (r.error) throw new Error(r.error);
                return r.code;
              });
            }}
          >
            <div className="font-display text-2xl tracking-wide text-secondary-foreground">Join Private Room</div>
            <div className="mt-2 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 font-display text-2xl tracking-[0.3em] uppercase"
              />
              <button
                disabled={busy || code.trim().length < 6}
                className="rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-40"
              >
                Join
              </button>
            </div>
          </form>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
