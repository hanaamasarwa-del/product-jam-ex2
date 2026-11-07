-- The Hebrew explanation of each NASA "Astronomy Picture of the Day", written
-- by Gemini and saved so we never pay for the same answer twice.
-- See docs/design.md.
--
-- One row per picture DATE, shared by every user: NASA's text for a day is the
-- same for everybody, so nothing here belongs to a person (no owner_id).
--
-- The row is also a lock. While one request is waiting for Gemini, its row
-- has status = 'pending'. A second request for the same date sees that and
-- waits instead of calling Gemini again. The steps are in docs/design.md,
-- under POST /api/nasa/explanations.

create table if not exists public.apod_explanations (
  -- The APOD date of the picture.
  date date primary key,

  -- 'pending': a request has claimed this date and is asking Gemini.
  -- 'done': the explanation below is complete.
  status text not null,

  -- Empty while pending, filled in when done.
  title_he text,
  summary_he text,
  tags text[],
  -- Which Gemini model wrote it.
  model text,

  -- When a request last claimed this row. A 'pending' row older than 60
  -- seconds belongs to a request that probably died, so another request may
  -- take it over.
  claimed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint apod_explanations_status_check
    check (status in ('pending', 'done')),

  -- A finished row must be complete. The tag list itself (galaxy, planet, ...)
  -- is checked by a Zod schema in shared/schemas/nasa.ts, not here, so that
  -- adding a tag never needs a migration.
  constraint apod_explanations_done_is_complete_check
    check (
      status = 'pending'
      or (
        title_he is not null and length(trim(title_he)) > 0
        and summary_he is not null and length(trim(summary_he)) > 0
        and tags is not null and cardinality(tags) between 1 and 5
        and model is not null
      )
    )
);

-- ---------------------------------------------------------------------------
-- Row Level Security: ON, with NO policies, same as `events` and `games`. All
-- access goes through our server, which decides what happens in
-- server/routes/. Do not add policies here. See docs/02-supabase-setup.md.
-- ---------------------------------------------------------------------------
alter table public.apod_explanations enable row level security;
