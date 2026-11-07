# 2. Setting up Supabase

Supabase gives you two things: somewhere to keep your data, and a way to log
people in. This page connects your copy of the app to your own Supabase project.

**One project per team.** Do not share one across teams.

## Create the project

1. Sign up at [supabase.com](https://supabase.com).
2. **New project**. Give it your app's name.
3. Choose a database password. **Save it somewhere** - you need it later on this
   page, and it is not shown again.
4. Pick the region closest to your users.
5. Wait a couple of minutes while it is created.

## Copy the keys

In your project, go to **Project Settings** -> **API Keys**. You need three
values, and they all go in `.env`.

| Where in the dashboard  | Looks like                     |
| ----------------------- | ------------------------------ |
| Project Overview -> URL | `https://abcdefgh.supabase.co` |
| API Keys -> publishable | `sb_publishable_...`           |
| API Keys -> secret      | `sb_secret_...`                |

Open `.env` and fill in the three blanks:

```bash
# public - reaches the browser
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SHOW_DEMOS=true

# private - stays on the server
SUPABASE_URL=${VITE_SUPABASE_URL}   # leave this line alone
SUPABASE_SECRET_KEY=sb_secret_...
```

The server needs the URL too, but it cannot read the `VITE_` copy, so that line
borrows the value instead of asking you to type it again. Leave it exactly as it
comes.

**The secret key is a password.** It can read and change anything in your
database, ignoring every rule. Never give it a `VITE_` prefix, and never paste
it into a file under `client/`. Anything with `VITE_` in front of it is shipped
to every visitor's browser.

`.env` is already in `.gitignore`, so git will not commit it. Leave it that way,
and send the values to your teammates some other way.

## Create the tables

The shape of your database lives in `supabase/migrations/`, as `.sql` files in
the repo. That way everyone on the team gets the same tables, and you can see in
git when they changed.

Apply them with the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
npx supabase db push
```

Your **project ref** is the part before `.supabase.co` in your URL - in
`https://abcdefgh.supabase.co` it is `abcdefgh`.

`link` asks for the database password you saved earlier.

`db push` runs any migration your project has not run yet, and remembers which
ones it has. Run it again whenever you add a migration, or after pulling someone
else's.

You should now see an `events` table under **Table Editor**, and an
`event-images` bucket under **Storage**.

## Check it worked

Start the app if it is not running:

```bash
npm run dev
```

Open **http://localhost:3000/api/health**. It should now say:

```json
{ "ok": true, "database": "ok" }
```

If it says `not_configured`, the un-prefixed lines in `.env` are empty, or the
dev server was started before you filled them in - stop it with `Ctrl+C` and
start it again. If it says `unreachable`, check `SUPABASE_URL` and
`SUPABASE_SECRET_KEY` for typos.

## Turn off email confirmation, for now

By default Supabase emails every new account a link they have to click before
they can log in. While you are building, that is a nuisance: the free plan only
sends a couple of emails an hour, they often land in spam, and everyone on the
team needs an account.

In Supabase: **Authentication** -> **Sign In / Providers** -> **Email**, and
turn off **Confirm email**. Save.

> Turn it back on before the organisation starts using the app for real,
> otherwise anyone can sign up with an address that is not theirs.

If you leave it on, signing up still works - the app tells you to go and check
your email - but you cannot log in until you click the link.

## Create an account

Open **http://localhost:3000/signin**, enter an email and a password, and press
**Sign Up**.

Use a real address, or at least a realistic one. Supabase rejects some obviously
fake domains, `@example.com` among them, with "Email address is invalid".

You should land back on the home page with your address shown **twice**:

- **hey ... :)** in the footer: what the browser knows from your login.
- **The server knows you as:** what the server says after checking your token.

The second one is the one that matters. It means the whole chain works: the
browser got a token, sent it to your server, and the server verified it against
Supabase independently.

## About Row Level Security

Open the `events` table in the dashboard and you will see **RLS enabled** with
no policies. That means: nobody reading the database directly can see anything.

That is deliberate, and it is the main safety net in this project. The
publishable key sits in every visitor's browser where anyone can read it;
because of RLS it is useless for getting at your data. All data goes through
your own server, which holds the secret key.

**Do not add policies.** Decide who can see what in `server/routes/`, where you
can read the code, test it, and explain it. See
[Adding a feature](05-adding-a-feature.md) for how.

## Optional: sample data

`supabase/seed.sql` adds a few example events, attached to the first user in
your project. Sign up first, then paste it into the dashboard's **SQL Editor**
and press Run. Entirely optional.

## Next

[3. Sign in with Google](03-google-sign-in.md).
