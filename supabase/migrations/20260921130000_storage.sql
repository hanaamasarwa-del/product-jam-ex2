-- The bucket that event images go into.
--
-- `public = false` means nobody can fetch a file just by guessing its URL.
-- The browser never talks to storage directly: it uploads through
-- POST /api/uploads, and it reads images through short-lived "signed URLs"
-- that the server hands out. Same rule as the database - the server is the
-- only thing holding a key.
--
-- The two limits below are enforced by Supabase itself, as a backstop. The
-- server checks them too, earlier and with a friendlier error, in
-- server/routes/uploads.ts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- No storage policies, for the same reason there are no table policies:
-- the publishable key should not be able to reach this bucket at all.
