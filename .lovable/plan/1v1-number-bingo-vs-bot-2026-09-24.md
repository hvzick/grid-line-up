# 1v1 Number Bingo (vs Bot)

A classic "Bingo" style duel: both players fill a 5x5 grid with 1-25, then take turns calling numbers. A called number gets crossed off on both grids. The first to complete 5 lines (rows, columns, or diagonals) wins.

## Screens / flow

```text
Home -> Mode select -> Setup (2:00) -> Play (15s per turn) -> Result
```

1. **Home / Mode select** (`/`)
   - Title, short rules, two buttons: "Play vs Bot" (active) and "Play vs Friend" (disabled, "Coming soon").
2. **Setup phase** (`/play`)
   - Your 5x5 grid. Click a cell to place the next number (1, 2, 3...), or pick a number from a 1-25 tray, then a cell. Click a filled cell to clear it.
   - "Random fill" and "Clear" buttons.
   - 2:00 countdown. When it hits zero, empty cells are filled randomly with the remaining numbers. "Ready" button to start early once full.
   - Bot fills its grid randomly (hidden).
3. **Play phase**
   - You go first. Click any uncrossed number on your grid to call it; it's crossed on both grids.
   - 15s turn timer shown as a ring/bar. If time runs out, a random uncalled number is picked for you.
   - Bot then takes its turn after a short "thinking" delay (~1s), choosing smartly (the number that best advances its own lines).
   - Line counter "B I N G O" letters light up for each completed line, for both players (bot's grid stays hidden, but its letter count is shown).
   - Log of called numbers.
4. **Result**
   - Winner banner (or draw if both reach 5 on the same call — caller wins ties is avoided; treat simultaneous as the caller's win).
   - Both grids revealed side by side with completed lines highlighted.
   - "Play again" and "Home" buttons.

## Rules implemented
- Unique numbers 1-25 per grid.
- 12 possible lines: 5 rows, 5 columns, 2 diagonals. Win at 5 completed lines.
- Win check after every call for both players; if both hit 5 on the same call, the player who called wins.

## Visual direction
Retro arcade-board look: deep navy background, warm cream grid tiles, bold condensed display font (Bebas Neue) with a clean body font, neon coral for crossed cells and lime for completed lines. Tiles pop in with small animations.

## Technical details
- Pure frontend, no backend needed. Game state in a `useReducer` (phases: setup, playing, finished).
- Game logic in `src/lib/bingo.ts` (line detection, random fill, bot move picker) — structured so a second human player can plug in later via a `PlayerController` type (human | bot | remote).
- Routes: `src/routes/index.tsx` (home), `src/routes/play.tsx` (game). Each with its own head metadata.
- Timers via `setInterval` with cleanup; design tokens added in `src/styles.css`; fonts linked in `__root.tsx`.
