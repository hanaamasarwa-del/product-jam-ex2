# Design: Parts 1 and 2

This is the plan for the database and the API, written before any code for Parts
1 (big-three tic-tac-toe) and 2 (space pictures). Plans change when I build;
those changes go in a **What changed and why** section at the end.

**Conventions**

- Every endpoint is under `/api/*`, below `requireAuth` in `server/index.ts`, so
  every endpoint can also answer `401`. It is not repeated below.
- Errors always use the kit's shape from `server/lib/errors.ts`:
  `{ "error": { "code": "...", "message": "..." } }`. A `400` from `validate()`
  also has `"fields": { "<field>": "<message>" }`.
- `400` means the request is malformed (wrong type, out of range, missing).
  `422` means the request is well formed but describes something impossible (an
  illegal game).
- Both tables have Row Level Security **on, with no policies**. Only my server
  reads or writes them, with the secret key.
- Both tables are created with `npx supabase migration new <name>`, never in the
  Table Editor.

## 1. The database

### Table `games`

One row per **finished** big-three game (4×4 board, three in a row wins),
belonging to one user.

| Column       | Type          | Rules                                                                                                                |
| ------------ | ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `id`         | `uuid`        | primary key, default `gen_random_uuid()`                                                                             |
| `owner_id`   | `uuid`        | foreign key to `auth.users(id)`, not null, `on delete cascade`                                                       |
| `moves`      | `smallint[]`  | not null. Cell numbers in the order they were played; X plays first, so even positions are X and odd positions are O |
| `result`     | `text`        | not null, `check (result in ('x_wins', 'o_wins', 'draw'))`                                                           |
| `created_at` | `timestamptz` | not null, default `now()`                                                                                            |

Cells are numbered 0 to 15, row by row: cell `4 * row + column`.

Constraints beyond the column rules:

- `check (cardinality(moves) between 5 and 16)`. The fastest possible win is X's
  third move, which is move 5. A full board is 16 moves.
- `check (moves <@ array[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]::smallint[])`.
  Every move is a real cell.
- Index on `(owner_id, created_at desc)`, because "my games, newest first" is
  the only way the table is read.

What the database **cannot** check, and my server does by replaying the moves
with the functions in `shared/game/`: no cell is played twice, no move comes
after someone already won, the game really ended on the last move, and `result`
is the real result. A `check` constraint cannot look inside an array that
deeply, and the rules should live in one place anyway.

There is no `variant` column, because the app only has one variant.

### Table `apod_explanations`

One row per NASA picture date, **shared by all users**. It holds the Hebrew
explanation that Gemini wrote, and it also acts as a lock while Gemini is
working (see the trade-off).

| Column       | Type          | Rules                                                           |
| ------------ | ------------- | --------------------------------------------------------------- |
| `date`       | `date`        | primary key. The APOD date of the picture                       |
| `status`     | `text`        | not null, `check (status in ('pending', 'done'))`               |
| `title_he`   | `text`        | null while pending                                              |
| `summary_he` | `text`        | null while pending                                              |
| `tags`       | `text[]`      | null while pending                                              |
| `model`      | `text`        | null while pending. Which Gemini model wrote it                 |
| `claimed_at` | `timestamptz` | not null, default `now()`. When a request last claimed this row |
| `created_at` | `timestamptz` | not null, default `now()`                                       |

Constraint: a finished row must be complete.

```sql
check (
  status = 'pending'
  or (
    title_he is not null and length(trim(title_he)) > 0
    and summary_he is not null and length(trim(summary_he)) > 0
    and tags is not null and cardinality(tags) between 1 and 5
    and model is not null
  )
)
```

There is no foreign key: the cache belongs to no user. The tag list (`galaxy`,
`planet`, `nebula`, `earth`, `sun`, `moon`, `star`, `comet`, `black-hole`,
`spacecraft`) is checked by a Zod schema in `shared/`, not by the database, so
that adding a tag never needs a migration.

## 2. The API

### `POST /api/games`: save a finished game

- **Receives:** `{ "moves": [0, 5, 1, 6, 2] }`. Only the moves. The browser
  never sends the result, the owner or the date.
- **Answers:** `201` with `{ id, owner_id, moves, result, created_at }`.
  `result` is the one the server calculated by replaying the moves.
- **Errors:**
  - `400 invalid_input`: `moves` is missing or not an array, an item is not an
    integer from 0 to 15, or the length is not between 5 and 16.
  - `422 invalid_game`: the moves cannot be a real game. The message says why: a
    cell was played twice, a move came after the game was already won, or the
    moves ended before the game was over.
  - `500 database_error`: the insert failed.
- **Tables:** writes `games`, with `owner_id` taken from the verified login
  token, never from the body.

### `GET /api/games`: my games

- **Receives:** nothing.
- **Answers:** `200` with an array of
  `{ id, owner_id, moves, result, created_at }`, newest first. There is no limit
  on how many.
- **Errors:** `500 database_error`.
- **Tables:** reads `games`, `where owner_id = <logged-in user>`. This filter is
  what keeps one user from seeing another's games.

There is no `GET /api/games/:id`, `PATCH` or `DELETE`. The page only needs to
save a game and list games, so those endpoints are not built.

### `GET /api/nasa/pictures?count=N`: random pictures

- **Receives:** an optional query `count`, an integer from 1 to 20. Default 20.
- **Answers:** `200` with an array of up to `count` pictures:
  `{ date, title, explanation, media_type, url, hdurl?, thumbnail_url?, copyright?, hebrew }`.
  `hebrew` is `{ title_he, summary_he, tags }` if that date has a finished
  explanation, otherwise `null`. The server calls NASA's
  `https://api.nasa.gov/planetary/apod?count=N`, and checks NASA's answer with a
  Zod schema before using it.
- **Errors:**
  - `400 invalid_input`: `count` is not an integer from 1 to 20.
  - `502 nasa_unavailable`: NASA answered with an error or a rate limit, or its
    answer did not match what we expect. My server answers with its own message,
    not NASA's.
  - `504 nasa_timeout`: NASA did not answer in time.
  - `500 database_error`: reading the cache failed.
- **Tables:** reads `apod_explanations` (rows with `status = 'done'` for the
  returned dates). Writes nothing.

### `POST /api/nasa/explanations`: explain one picture in Hebrew

- **Receives:** `{ "date": "2024-03-15" }`. Only the date. The title and text
  Gemini reads come from NASA, fetched by the server, never from the browser.
- **Answers:**
  - `200` with `{ date, title_he, summary_he, tags }` if the explanation already
    existed. Neither NASA nor Gemini is called for it beyond the check below.
  - `201` with the same body if this request just created it.
- **Errors:**
  - `400 invalid_input`: `date` is not a valid `YYYY-MM-DD` date, is before
    `1995-06-16` (the first APOD), or is in the future.
  - `404 not_found`: NASA has no picture for that date.
  - `409 explanation_in_progress`: another request is already asking Gemini for
    this date. The page waits a few seconds and asks again.
  - `502 nasa_unavailable`: NASA failed, was rate limited, or sent a bad answer.
  - `502 gemini_unavailable`: Gemini failed or was rate limited.
  - `502 gemini_invalid_response`: Gemini's answer did not pass the Zod schema
    (for example, a tag that is not in the list, or 0 or 6 tags).
  - `504 nasa_timeout` / `504 gemini_timeout`: the other server did not answer
    in time.
  - `500 database_error`: a database read or write failed.
- **Tables:** reads and writes `apod_explanations`.
- **Order of work**, which is the concurrency strategy:
  1. Validate `date` (400).
  2. Read the row for the date. If `status = 'done'`, answer `200`.
  3. Fetch the picture's title and text from NASA (404, 502, 504). This is free,
     so it comes before the paid step. If it fails, nothing was claimed.
  4. **Claim the date**, in one atomic statement:
     `insert (date, status) values (<date>, 'pending') on conflict (date) do nothing returning date`.
     - A row came back: this request owns the date. Go to step 5.
     - Nothing came back: someone else has a row. Read it. If it is `done`,
       answer `200`. If it is `pending` and `claimed_at` is under 60 seconds
       old, answer `409`. If it is `pending` and older than 60 seconds, its
       owner probably died, so try to **take over** with a conditional update:
       `update ... set claimed_at = now() where date = <date> and status = 'pending' and claimed_at < now() - interval '60 seconds' returning date`.
       Only one request can win that update. The winner goes to step 5; the
       others answer `409`.
  5. Call Gemini with a time limit of 25 seconds, and check the answer with the
     Zod schema (502, 504).
  6. `update ... set status = 'done', title_he, summary_he, tags, model where date = <date>`.
     Answer `201`.
  7. If step 5 or 6 fails, delete the `pending` row for that date so the next
     request can try again, then answer with the error. If even that delete
     fails, the 60-second takeover in step 4 cleans up.

## 3. One trade-off: one shared explanation per date, with a database lock

**The decision.** The Hebrew explanation is stored once per date and shared by
every user, and the same row acts as a lock so that Gemini is called at most
once per date.

**The other way.** Store one explanation per user, with the key
`(owner_id, date)`. Or skip the lock and let simultaneous requests both call
Gemini, keeping the first answer saved.

**Why I chose this.** The assignment says never to pay twice for the same
answer. NASA's text for a date is the same for everyone, so there is nothing
user-specific to keep. A shared row means a picture costs one Gemini call in
total, however many users ask, and the second user gets an instant answer. The
lock matters because the free Gemini tier has a low rate limit and two people
tapping the same card is exactly what happens in a class. Without it, both
requests would call Gemini and one answer would be thrown away.

**What it costs.**

- Everyone sees the same text. A bad or odd answer is stuck for all users until
  the row is deleted by hand.
- There is no per-user history of what someone asked for.
- A second request that arrives while the first is working gets a `409`, and the
  page has to wait and ask again. That is extra code on the page.
- The `pending` state can get stuck if the Worker dies mid-request. The 60
  second takeover fixes that, but it is one more rule to get right, and a very
  slow Gemini call (over 60 seconds) could be taken over while still running.
  The 25 second Gemini limit keeps that from happening.
