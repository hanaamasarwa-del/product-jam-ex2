-- Finished big-three games (4x4 board, three in a row wins), one row per game.
-- See docs/design.md.
--
-- Only the moves are the source of truth. The server replays them with the
-- rules in shared/game/ and saves the result it calculated itself, so the
-- browser can never tell us who won.

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),

  -- Who played it. `on delete cascade` means deleting a user deletes their games.
  owner_id uuid not null references auth.users (id) on delete cascade,

  -- Cell numbers in the order they were played, 0 to 15, row by row
  -- (cell = 4 * row + column). X plays first, so even positions are X's moves
  -- and odd positions are O's.
  moves smallint[] not null,

  result text not null,

  created_at timestamptz not null default now(),

  -- The fastest possible win is X's third move, which is move 5.
  -- A full board is 16 moves.
  constraint games_moves_length_check
    check (cardinality(moves) between 5 and 16),

  -- Every move is a real cell. (A null inside the array also fails this.)
  constraint games_moves_cells_check
    check (moves <@ array[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]::smallint[]),

  constraint games_result_check
    check (result in ('x_wins', 'o_wins', 'draw'))

  -- What a check constraint cannot do, the server does by replaying the moves:
  -- no cell played twice, no move after someone won, the game really ended on
  -- the last move, and `result` is the real result.
);

-- The only way games are read is "my games, newest first".
create index if not exists games_owner_id_created_at_idx
  on public.games (owner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security: ON, with NO policies, same as `events`. All access goes
-- through our server, which decides who sees what in server/routes/.
-- Do not add policies here. See docs/02-supabase-setup.md.
-- ---------------------------------------------------------------------------
alter table public.games enable row level security;
