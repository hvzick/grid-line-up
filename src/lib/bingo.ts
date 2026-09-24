export type Grid = (number | null)[]; // length 25
export type PlayerController = "human" | "bot" | "remote";

export const LINES: number[][] = (() => {
  const l: number[][] = [];
  for (let r = 0; r < 5; r++) l.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) l.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  l.push([0, 6, 12, 18, 24]);
  l.push([4, 8, 12, 16, 20]);
  return l;
})();

export function shuffle<T>(a: T[]): T[] {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export const emptyGrid = (): Grid => Array(25).fill(null);

export function fillRandom(grid: Grid): number[] {
  const used = new Set(grid.filter((n): n is number => n !== null));
  const remaining = shuffle(
    Array.from({ length: 25 }, (_, i) => i + 1).filter((n) => !used.has(n)),
  );
  return grid.map((n) => (n === null ? remaining.shift()! : n));
}

export function completedLines(grid: number[], called: Set<number>): number[][] {
  return LINES.filter((line) => line.every((i) => called.has(grid[i]!)));
}

export function botPick(grid: number[], called: Set<number>): number {
  const options = grid.filter((n) => !called.has(n));
  let best = options[0];
  let bestScore = -1;
  for (const n of shuffle(options)) {
    const idx = grid.indexOf(n);
    let score = 0;
    for (const line of LINES) {
      if (!line.includes(idx)) continue;
      const marked = line.filter((i) => called.has(grid[i]!)).length;
      score += marked === 4 ? 100 : marked * marked + 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = n;
    }
  }
  return best!;
}

export function randomUncalled(called: Set<number>): number {
  const opts = Array.from({ length: 25 }, (_, i) => i + 1).filter((n) => !called.has(n));
  return opts[Math.floor(Math.random() * opts.length)]!;
}

export type Difficulty = "easy" | "medium" | "hard";

function hardPick(grid: number[], called: Set<number>): number {
  const options = shuffle(grid.filter((n) => !called.has(n)));
  let best = options[0]!;
  let bestScore = -Infinity;
  for (const n of options) {
    const idx = grid.indexOf(n);
    let score = 0;
    let linesTouched = 0;
    for (const line of LINES) {
      if (!line.includes(idx)) continue;
      linesTouched++;
      const marked = line.filter((i) => called.has(grid[i]!)).length;
      score += marked === 4 ? 1000 : marked * marked * 3 + 1;
    }
    score += linesTouched * 2; // favor intersections (diagonals, center)
    if (score > bestScore) {
      bestScore = score;
      best = n;
    }
  }
  return best;
}

export function botPickFor(difficulty: Difficulty, grid: number[], called: Set<number>): number {
  if (difficulty === "easy") return randomUncalled(called);
  if (difficulty === "medium") return Math.random() < 0.5 ? randomUncalled(called) : botPick(grid, called);
  return hardPick(grid, called);
}
