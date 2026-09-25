# Online 1v1 PvP: Quick Match + Private Rooms

## What you'll get
- Home: "vs Friend (Coming soon)" becomes **Play Online (1v1)**. It opens a menu with three choices:
  1. **Quick Match**: shows a "Searching for opponent..." screen with a Cancel button and pairs you with the next waiting player.
  2. **Create Private Room**: gives you a 6-letter code and a copy-invite-link button.
  3. **Join Private Room**: a box where you type the code.
- **Setup**: once both players are in, you both get the same 2:00 countdown. Press Ready or wait for the timer, and any empty cells get filled randomly. The match starts when both players are locked in.
- **Match**: a fair coin toss decides who goes first. Each turn is 15 seconds, and a number is picked at random if time runs out. Every called number is crossed off on both screens right away. You never see the numbers on your opponent's board, only their BINGO letter count.
- **End**: the first player to 5 lines wins (if both reach 5 on the same call, the player who called it wins). Both boards are then shown side by side with the lines highlighted, plus Rematch and Home buttons.
- Players stay anonymous (no sign-up). Each browser gets its own saved player ID.

## Steps
1. Turn on Lovable Cloud. Add a `matches` table with live updates.
2. Build the lobby menu, the searching screen and the room code/link screens.
3. Add a new online game page at `/online/$code`, reusing the existing board pieces.
4. Keep the game's rules and moves on the server so neither player can cheat.
5. Add Rematch, which starts a new room for the same two players.

## Technical details
- Table `matches`: id, room_code (unique), is_public, player1_id, player2_id, player1_grid int[], player2_grid int[], player1_ready, player2_ready, current_turn, called_numbers int[], status (waiting/setup/playing/finished), winner (p1/p2), setup_deadline, turn_deadline, rematch_code, created_at.
- Grids are kept private. They live in a separate `match_grids` table that no player can read directly. Server functions check every move, the line counts and the winner, and send each client only its own grid. The opponent's grid is shown only when the match is finished.
- `find_or_create_match(player_id)`: a Postgres function that uses `FOR UPDATE SKIP LOCKED` to pick up the oldest waiting public room, or creates a new one if none is waiting.
- Server functions: createRoom, joinRoom, quickMatch, cancelSearch, submitGrid, callNumber, claimTimeout (either player can trigger it after the deadline passes; the server checks the deadline), requestRematch.
- Clients subscribe to live changes on their own `matches` row. The deadlines on the server are what count, and the clocks on screen just count down to them.
- The row itself holds no secrets, so anonymous players are allowed to read `matches`. All writes go only through server functions that use the admin client.
- The first turn is decided on the server when both players are ready.
- The bot mode stays as it is.
