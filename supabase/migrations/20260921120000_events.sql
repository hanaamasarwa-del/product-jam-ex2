-- The example resource. Copy this file's shape when you add your own.
-- See docs/05-adding-a-feature.md.

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),

  -- Who created it. `references auth.users` means Postgres will refuse to
  -- store an event for a user who does not exist, and `on delete cascade`
  -- means deleting the user deletes their events.
  owner_id uuid not null references auth.users (id) on delete cascade,

  title text not null,
  description text,
  starts_at timestamptz not null,

  -- Path inside the Supabase Storage bucket.
  image_path text,

  created_at timestamptz not null default now()
);

-- Listing "my events" is the most common query, so give Postgres an index
-- for it instead of making it read the whole table every time.
create index if not exists events_owner_id_starts_at_idx
  on public.events (owner_id, starts_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security: ON, with NO policies. This is deliberate.
--
-- "No policies" means "nobody gets through". That makes the publishable key in
-- the browser useless for reading this table, which is exactly what we want:
-- all data access goes through our server, which uses the secret key and
-- bypasses RLS.
--
-- Do not add policies here. Decide who can see what in server/routes/, where
-- you can read the code and test it. See docs/02-supabase-setup.md.
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;
