import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as S from "./movie-game.server";

const token = z.string().min(8).max(64);
const roomData = z.object({ token, code: z.string().length(6) });

export const createMovieRoom = createServerFn({ method: "POST" })
  .validator((data) => z.object({ token }).parse(data))
  .handler(async ({ data }) => ({ code: await S.createMovieRoom(data.token) }));

export const joinMovieRoom = createServerFn({ method: "POST" })
  .validator((data) => roomData.parse(data))
  .handler(async ({ data }) => {
    try {
      return { code: await S.joinMovieRoom(data.code, data.token), error: null };
    } catch (error) {
      return { code: null, error: (error as Error).message };
    }
  });

export const getMovieRoom = createServerFn({ method: "POST" })
  .validator((data) => roomData.parse(data))
  .handler(async ({ data }) => {
    try {
      return { state: await S.getMovieRoom(data.code, data.token), error: null };
    } catch (error) {
      return { state: null, error: (error as Error).message };
    }
  });

export const chooseMovieRole = createServerFn({ method: "POST" })
  .validator((data) => roomData.extend({ choice: z.enum(["guess", "set"]) }).parse(data))
  .handler(async ({ data }) => ({ state: await S.chooseMovieRole(data.code, data.token, data.choice) }));

export const setMovieAnswer = createServerFn({ method: "POST" })
  .validator((data) => roomData.extend({ category: z.enum(["hollywood", "bollywood"]), title: z.string().min(1).max(100) }).parse(data))
  .handler(async ({ data }) => ({ state: await S.setMovieAnswer(data.code, data.token, data.category, data.title) }));

export const guessMovieLetter = createServerFn({ method: "POST" })
  .validator((data) => roomData.extend({ letter: z.string().length(1) }).parse(data))
  .handler(async ({ data }) => ({ state: await S.guessMovieLetter(data.code, data.token, data.letter) }));
