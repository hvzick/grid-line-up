import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MOVIES, type MovieCategory } from "./movie-game";

export type MovieSlot = "p1" | "p2";
const codeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newCode() {
  return Array.from({ length: 6 }, () => codeChars[Math.floor(Math.random() * codeChars.length)]).join("");
}

async function loadRoom(code: string) {
  const { data, error } = await supabaseAdmin.from("movie_rooms").select("*").eq("room_code", code.toUpperCase()).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Movie room not found");
  return data;
}

async function loadPlayers(roomId: string) {
  const { data, error } = await supabaseAdmin.from("movie_room_players").select("*").eq("room_id", roomId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function requirePlayer(code: string, token: string) {
  const room = await loadRoom(code);
  const players = await loadPlayers(room.id);
  const me = players.find((player) => player.player_token === token);
  if (!me) throw new Error("You are not in this movie room");
  return { room, players, me, slot: me.slot as MovieSlot };
}

export async function createMovieRoom(token: string) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: room, error } = await supabaseAdmin.from("movie_rooms").insert({ room_code: newCode() }).select().single();
    if (error || !room) continue;
    const { error: playerError } = await supabaseAdmin.from("movie_room_players").insert({ room_id: room.id, slot: "p1", player_token: token });
    if (!playerError) return room.room_code;
    await supabaseAdmin.from("movie_rooms").delete().eq("id", room.id);
  }
  throw new Error("Could not create a movie room. Please try again.");
}

export async function joinMovieRoom(code: string, token: string) {
  const room = await loadRoom(code);
  const players = await loadPlayers(room.id);
  if (players.some((player) => player.player_token === token)) return room.room_code;
  if (room.status !== "waiting" || players.length >= 2) throw new Error("This movie room is full or already started");
  const { error } = await supabaseAdmin.from("movie_room_players").insert({ room_id: room.id, slot: "p2", player_token: token });
  if (error) throw new Error("Could not join this movie room");
  await supabaseAdmin.from("movie_rooms").update({ status: "choosing" }).eq("id", room.id).eq("status", "waiting");
  return room.room_code;
}

function present(room: Awaited<ReturnType<typeof loadRoom>>, players: Awaited<ReturnType<typeof loadPlayers>>, slot: MovieSlot) {
  const me = players.find((player) => player.slot === slot);
  const opponent = players.find((player) => player.slot !== slot);
  const canSeeTitle = slot === room.setter_slot || room.status === "finished";
  return {
    code: room.room_code,
    status: room.status as "waiting" | "choosing" | "playing" | "finished",
    mySlot: slot,
    myChoice: me?.choice as "guess" | "set" | null,
    opponentReady: !!opponent?.choice,
    guesserSlot: room.guesser_slot as MovieSlot | null,
    setterSlot: room.setter_slot as MovieSlot | null,
    role: slot === room.guesser_slot ? "guesser" as const : slot === room.setter_slot ? "setter" as const : null,
    category: room.category as MovieCategory | null,
    title: canSeeTitle ? room.movie_title : null,
    maskedTitle: room.movie_title ? [...room.movie_title].map((char) => (/[aeiou]/i.test(char) || !/[a-z]/i.test(char) || room.guessed_letters.includes(char.toUpperCase()) ? char : "_")).join("") : null,
    guessedLetters: room.guessed_letters,
    wrongGuesses: room.wrong_guesses,
    winner: room.winner as MovieSlot | null,
  };
}

export async function getMovieRoom(code: string, token: string) {
  const { room, players, slot } = await requirePlayer(code, token);
  return present(room, players, slot);
}

export async function chooseMovieRole(code: string, token: string, choice: "guess" | "set") {
  const { room, players, slot } = await requirePlayer(code, token);
  if (room.status !== "choosing") throw new Error("This room is no longer choosing roles");
  await supabaseAdmin.from("movie_room_players").update({ choice }).eq("room_id", room.id).eq("slot", slot);
  const freshPlayers = await loadPlayers(room.id);
  const p1 = freshPlayers.find((player) => player.slot === "p1");
  const p2 = freshPlayers.find((player) => player.slot === "p2");
  if (p1?.choice && p2?.choice) {
    let guesser: MovieSlot;
    if (p1.choice !== p2.choice) guesser = p1.choice === "guess" ? "p1" : "p2";
    else guesser = Math.random() < 0.5 ? "p1" : "p2";
    const setter: MovieSlot = guesser === "p1" ? "p2" : "p1";
    await supabaseAdmin.from("movie_rooms")
      .update({ guesser_slot: guesser, setter_slot: setter })
      .eq("id", room.id).eq("status", "choosing").is("guesser_slot", null);
  }
  return getMovieRoom(code, token);
}

export async function setMovieAnswer(code: string, token: string, category: MovieCategory, title: string) {
  const { room, slot } = await requirePlayer(code, token);
  if (room.status !== "choosing" || room.setter_slot !== slot) throw new Error("Only the movie setter can choose the answer");
  const canonicalTitle = MOVIES[category].find((movie) => movie === title);
  if (!canonicalTitle) throw new Error("Choose a movie from the list");
  const { error } = await supabaseAdmin.from("movie_rooms").update({
    category,
    movie_title: canonicalTitle,
    guessed_letters: [],
    wrong_guesses: 0,
    status: "playing",
  }).eq("id", room.id).eq("status", "choosing");
  if (error) throw new Error(error.message);
  return getMovieRoom(code, token);
}

export async function guessMovieLetter(code: string, token: string, rawLetter: string) {
  const { room, slot } = await requirePlayer(code, token);
  const letter = rawLetter.toUpperCase();
  if (room.status !== "playing" || room.guesser_slot !== slot) throw new Error("It is not your turn to guess");
  if (!/^[A-Z]$/.test(letter) || "AEIOU".includes(letter)) throw new Error("Guess a consonant");
  if (room.guessed_letters.includes(letter)) return getMovieRoom(code, token);
  const guessedLetters = [...room.guessed_letters, letter];
  const wrongGuesses = room.wrong_guesses + (room.movie_title?.toUpperCase().includes(letter) ? 0 : 1);
  const solved = [...(room.movie_title ?? "").toUpperCase()].every((char) => !/[A-Z]/.test(char) || "AEIOU".includes(char) || guessedLetters.includes(char));
  const finished = solved || wrongGuesses >= 9;
  const { error } = await supabaseAdmin.from("movie_rooms").update({
    guessed_letters: guessedLetters,
    wrong_guesses: wrongGuesses,
    ...(finished ? { status: "finished", winner: solved ? slot : room.setter_slot } : {}),
  }).eq("id", room.id).eq("status", "playing");
  if (error) throw new Error(error.message);
  return getMovieRoom(code, token);
}
