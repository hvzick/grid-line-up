import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { completedLines, emptyGrid, fillRandom, randomUncalled } from "./bingo";

export type Slot = "p1" | "p2";
const TURN_MS = 15_000;
const SETUP_MS = 122_000;

export function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function loadMatch(code: string) {
  const { data, error } = await supabaseAdmin.from("matches").select("*").eq("room_code", code.toUpperCase()).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Room not found");
  return data;
}

export async function loadPlayers(matchId: string) {
  const { data, error } = await supabaseAdmin.from("match_players").select("*").eq("match_id", matchId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function requireSlot(code: string, token: string) {
  const match = await loadMatch(code);
  const players = await loadPlayers(match.id);
  const me = players.find((p) => p.player_token === token);
  if (!me) throw new Error("You are not in this match");
  return { match, players, me, slot: me.slot as Slot };
}

export async function createPrivate(token: string) {
  for (let i = 0; i < 5; i++) {
    const code = genCode();
    const { data, error } = await supabaseAdmin.from("matches").insert({ room_code: code, is_public: false }).select().single();
    if (error) continue;
    await supabaseAdmin.from("match_players").insert({ match_id: data.id, slot: "p1", player_token: token });
    return code;
  }
  throw new Error("Could not create room");
}

export async function joinPrivate(code: string, token: string) {
  const match = await loadMatch(code);
  const players = await loadPlayers(match.id);
  if (players.some((p) => p.player_token === token)) return match.room_code;
  if (players.length >= 2 || match.status !== "waiting") throw new Error("Room is full");
  const { error } = await supabaseAdmin.from("match_players").insert({ match_id: match.id, slot: "p2", player_token: token });
  if (error) throw new Error("Room is full");
  await supabaseAdmin
    .from("matches")
    .update({ status: "setup", setup_deadline: new Date(Date.now() + SETUP_MS).toISOString(), version: match.version + 1 })
    .eq("id", match.id);
  await broadcastMatch(match.room_code);
  return match.room_code;
}

// The matches table is not publicly readable, so the server pushes
// row updates to both players over the realtime socket itself.
export async function broadcastMatch(code: string) {
  try {
    const fresh = await loadMatch(code);
    await supabaseAdmin
      .channel(`match-${fresh.room_code}`)
      .send({ type: "broadcast", event: "match_update", payload: fresh });
  } catch {
    // best effort; clients also re-fetch on deadline ticks
  }
}

type Match = Awaited<ReturnType<typeof loadMatch>>;
type Player = Awaited<ReturnType<typeof loadPlayers>>[number];

async function update(match: Match, patch: Partial<Match>) {
  const { data } = await supabaseAdmin
    .from("matches")
    .update({ ...patch, version: match.version + 1 })
    .eq("id", match.id)
    .eq("version", match.version)
    .select();
  const row = data?.[0];
  if (!row) return false;
  supabaseAdmin
    .channel(`match-${match.room_code}`)
    .send({ type: "broadcast", event: "match_update", payload: row })
    .catch(() => {});
  return true;
}

export async function startIfReady(match: Match, players: Player[]) {
  if (match.status !== "setup") return;
  if (players.length < 2 || players.some((p) => !p.grid)) return;
  await update(match, {
    status: "playing",
    p1_ready: true,
    p2_ready: true,
    current_turn: Math.random() < 0.5 ? "p1" : "p2",
    turn_deadline: new Date(Date.now() + TURN_MS).toISOString(),
  });
}

export async function submitGrid(match: Match, players: Player[], slot: Slot, grid: (number | null)[]) {
  if (match.status !== "setup") return;
  const valid = grid.length === 25 && grid.every((n) => n === null || (Number.isInteger(n) && n >= 1 && n <= 25));
  const nums = grid.filter((n): n is number => n !== null);
  const base = valid && new Set(nums).size === nums.length ? grid : emptyGrid();
  const final = fillRandom(base);
  const me = players.find((p) => p.slot === slot)!;
  if (me.grid) return;
  await supabaseAdmin.from("match_players").update({ grid: final }).eq("match_id", match.id).eq("slot", slot);
  me.grid = final;
  const fresh = await loadMatch(match.room_code);
  const readyPatch = slot === "p1" ? { p1_ready: true } : { p2_ready: true };
  const ok = await update(fresh, readyPatch);
  const after = await loadMatch(match.room_code);
  if (ok || after) await startIfReady(after, players);
}

export async function doCall(match: Match, players: Player[], slot: Slot, n: number) {
  if (match.status !== "playing" || match.current_turn !== slot) return false;
  const called = new Set(match.called_numbers);
  if (called.has(n) || n < 1 || n > 25) return false;
  called.add(n);
  const g1 = players.find((p) => p.slot === "p1")!.grid!;
  const g2 = players.find((p) => p.slot === "p2")!.grid!;
  const w1 = completedLines(g1, called).length >= 5;
  const w2 = completedLines(g2, called).length >= 5;
  const called_numbers = [...match.called_numbers, n];
  if (w1 || w2) {
    return await update(match, {
      called_numbers,
      status: "finished",
      winner: w1 && w2 ? slot : w1 ? "p1" : "p2",
      turn_deadline: null,
    });
  }
  return await update(match, {
    called_numbers,
    current_turn: slot === "p1" ? "p2" : "p1",
    turn_deadline: new Date(Date.now() + TURN_MS).toISOString(),
  });
}

export async function tick(match: Match, players: Player[]) {
  const now = Date.now();
  if (match.status === "setup" && match.setup_deadline && now > Date.parse(match.setup_deadline)) {
    for (const p of players) {
      if (!p.grid) {
        p.grid = fillRandom(emptyGrid());
        await supabaseAdmin.from("match_players").update({ grid: p.grid }).eq("match_id", match.id).eq("slot", p.slot);
      }
    }
    await startIfReady(match, players);
  } else if (match.status === "playing" && match.turn_deadline && now > Date.parse(match.turn_deadline) + 500) {
    await doCall(match, players, match.current_turn as Slot, randomUncalled(new Set(match.called_numbers)));
  }
}

export function buildState(match: Match, players: Player[], slot: Slot) {
  const me = players.find((p) => p.slot === slot);
  const opp = players.find((p) => p.slot !== slot);
  const called = new Set(match.called_numbers);
  return {
    code: match.room_code,
    isPublic: match.is_public,
    status: match.status as "waiting" | "setup" | "playing" | "finished",
    mySlot: slot,
    currentTurn: match.current_turn as Slot | null,
    called: match.called_numbers,
    winner: match.winner as Slot | null,
    setupDeadline: match.setup_deadline,
    turnDeadline: match.turn_deadline,
    rematchCode: match.rematch_code,
    myGrid: me?.grid ?? null,
    myReady: !!me?.grid,
    oppReady: !!opp?.grid,
    oppLines: opp?.grid ? completedLines(opp.grid, called).length : 0,
    oppGrid: match.status === "finished" ? (opp?.grid ?? null) : null,
  };
}

export async function rematch(match: Match, token: string) {
  if (match.rematch_code) {
    await joinPrivate(match.rematch_code, token);
    return match.rematch_code;
  }
  const code = await createPrivate(token);
  const ok = await update(match, { rematch_code: code });
  if (!ok) {
    const fresh = await loadMatch(match.room_code);
    if (fresh.rematch_code) {
      await joinPrivate(fresh.rematch_code, token);
      return fresh.rematch_code;
    }
  }
  return code;
}

export async function cancel(match: Match, slot: Slot) {
  if (match.status === "waiting" && slot === "p1") {
    await supabaseAdmin.from("matches").delete().eq("id", match.id);
  }
}

export async function quick(token: string) {
  const { data, error } = await supabaseAdmin.rpc("find_or_create_match", { _token: token, _code: genCode() });
  if (error) throw new Error(error.message);
  await broadcastMatch(data as string);
  return data as string;
}
