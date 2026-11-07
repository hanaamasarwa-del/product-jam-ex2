# 5. Adding a feature

The app comes with one worked example: **events**. It is a complete resource
that belongs to a user: a table, an API to create, read, update and delete it,
and the screens for it. Read it before you build anything of your own. Every
file this page mentions has an `events` version.

## The five places

Adding a resource touches five places, in this order. They go outside-in:
database first, screen last.

| #   | Where                             | What                       |
| --- | --------------------------------- | -------------------------- |
| 1   | `supabase/migrations/`            | the table                  |
| 2   | `shared/schemas/`                 | what counts as valid       |
| 3   | `server/routes/`                  | the API                    |
| 4   | `client/features/<name>/hooks.ts` | fetching it in the browser |
| 5   | `client/pages/<name>/`            | the screens                |

It is five files because the three-box model is real: the database, the server
and the browser are genuinely separate, and this is where they meet.

## 1. The table

A table is created by a migration: a new `.sql` file in `supabase/migrations/`.
Its name starts with a timestamp, so the files sort in the order they must run.
Never edit a migration that has already run; write a new one. Apply them with:

```bash
npx supabase db push
```

Before you write it, decide:

- **Who does a row belong to?** A row that belongs to a user points to
  `auth.users`.
- **What must always be true?** Which columns can never be empty, which values
  must be unique, and which have to stay in a range. Write these as constraints.
  The database is the last place bad data can be stopped, and the only one that
  can't be skipped.
- **How will you look it up?** Columns you filter or sort by often need an
  index.

Every table has Row Level Security turned on, with no policies. See
[About Row Level Security](02-supabase-setup.md#about-row-level-security) for
why.

## 2. What counts as valid

A Zod schema in `shared/schemas/` describes what valid data looks like. It lives
in `shared/` because both sides use it: the server checks every request against
it before saving, and the browser uses the types it produces. The browser can
check a form with it too, but the server's check is the one that counts. Anyone
can send your server anything, without using your page at all.

Get the TypeScript types from the schemas with `z.infer`, so the types and the
rules can never disagree. Write the error messages for people, not developers:
they are shown next to the field that was wrong.

## 3. The API

The routes go in `server/routes/`, registered in `server/index.ts`. Register a
route **below** the `app.use` line if you have to be logged in to use it.

The server talks to the database with a key that ignores every database rule, so
**your route code is the only thing that decides who can see and change what**.
For every query, ask yourself whose data it is, and how your code makes sure the
person asking is allowed to have it.

Errors always use the same shape. Use the helpers in `server/lib/errors.ts`.

## 4. Fetching it in the browser

The hooks in `client/features/<name>/hooks.ts` call your API with `api()` from
`client/lib/api.ts`, through TanStack Query: `useQuery` to read, `useMutation`
to change.

TanStack Query keeps a copy of what it fetched, and keeps showing it. After a
change, that copy is out of date until you tell it so. Work out how the `events`
hooks do this, and what the screen would show if they didn't.

## 5. The screens

The pages go in `client/pages/<name>/`, one folder per section of the URL, with
each page's CSS next to it. A page is a file that does
`export default function MyPage()`. To give it a URL, add two lines to
`client/App.tsx`: a `lazy(...)` import at the top and a `<Route>` below, inside
`<RequireAuth>` if you have to be logged in to see it. Use the components in
`client/components/` before you build new ones.

A screen is never only "with data in it". It is also loading, and it can fail,
and it can be empty. Design what each of these looks like, and make sure a user
always knows what is happening.

## Check it

```bash
npm run typecheck && npm run lint && npm test
```

Then use it the way real people will: create, change and delete, on a phone and
on a slow connection, and log in as someone who shouldn't see this data.
