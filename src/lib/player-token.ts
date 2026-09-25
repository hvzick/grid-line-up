const KEY = "bingo-duel-player";

export function getPlayerToken(): string {
  let t = localStorage.getItem(KEY);
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem(KEY, t);
  }
  return t;
}
