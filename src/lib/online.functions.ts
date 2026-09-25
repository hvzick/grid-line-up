import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as S from "./online.server";

const tokenSchema = z.string().min(8).max(64);
const withCode = z.object({ token: tokenSchema, code: z.string().min(4).max(10) });

export const quickMatch = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => ({ code: await S.quick(data.token) }));

export const createRoom = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => ({ code: await S.createPrivate(data.token) }));

export const joinRoom = createServerFn({ method: "POST" })
  .inputValidator((d) => withCode.parse(d))
  .handler(async ({ data }) => {
    try {
      return { code: await S.joinPrivate(data.code, data.token), error: null };
    } catch (e) {
      return { code: null, error: (e as Error).message };
    }
  });

export const getMatchState = createServerFn({ method: "POST" })
  .inputValidator((d) => withCode.parse(d))
  .handler(async ({ data }) => {
    try {
      const { match, players, slot } = await S.requireSlot(data.code, data.token);
      await S.tick(match, players);
      const r = await S.requireSlot(data.code, data.token);
      return { state: S.buildState(r.match, r.players, slot), error: null };
    } catch (e) {
      return { state: null, error: (e as Error).message };
    }
  });

export const submitGrid = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    withCode.extend({ grid: z.array(z.number().int().nullable()).length(25) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { match, players, slot } = await S.requireSlot(data.code, data.token);
    await S.submitGrid(match, players, slot, data.grid);
    return { ok: true };
  });

export const callNumber = createServerFn({ method: "POST" })
  .inputValidator((d) => withCode.extend({ n: z.number().int().min(1).max(25) }).parse(d))
  .handler(async ({ data }) => {
    const { match, players, slot } = await S.requireSlot(data.code, data.token);
    await S.doCall(match, players, slot, data.n);
    return { ok: true };
  });

export const requestRematch = createServerFn({ method: "POST" })
  .inputValidator((d) => withCode.parse(d))
  .handler(async ({ data }) => {
    const { match } = await S.requireSlot(data.code, data.token);
    return { code: await S.rematch(match, data.token) };
  });

export const cancelMatch = createServerFn({ method: "POST" })
  .inputValidator((d) => withCode.parse(d))
  .handler(async ({ data }) => {
    const { match, slot } = await S.requireSlot(data.code, data.token);
    await S.cancel(match, slot);
    return { ok: true };
  });
