# 4. Putting it on the internet

This publishes your app to Cloudflare, on a free plan with no card. You set it
up once, in the browser. After that, **every push to `main` goes live by
itself** - there is no deploy command to remember.

## Create a Cloudflare account

Sign up at [dash.cloudflare.com](https://dash.cloudflare.com). Free. You do not
need a domain name - Cloudflare gives you an address.

**One account per team.** At the end of the year you hand it over to the
organisation, along with the Supabase project.

## Name your app

Open `wrangler.jsonc` and change `name`:

```jsonc
"name": "my-app-name",
```

This becomes part of your address, so pick something real. It must be lowercase
letters, numbers and hyphens. Commit and push.

## Connect your repository

In Cloudflare: **Compute** → **Workers & Pages** → **Create** → **Import a
repository**. Connect your GitHub account and pick this repository.

> If the repository belongs to a GitHub organisation, an owner of that
> organisation may need to approve Cloudflare's access first. GitHub shows a
> "request" button - press it and ask them.

On the settings screen, fill in:

| Field                                  | Set it to                                |
| -------------------------------------- | ---------------------------------------- |
| **Project name**                       | exactly the `name` from `wrangler.jsonc` |
| **Build command**                      | leave empty                              |
| **Deploy command**                     | `npm run deploy`                         |
| **Builds for non-production branches** | off                                      |

Then open **Build variables** (under advanced settings) and add the `VITE_`
lines from your `.env`, one by one:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Press **Deploy**.

Three things that make the build fail, in order of how often:

- The project name does not match `wrangler.jsonc`. They must be identical.
- The deploy command is still the default `npx wrangler deploy`. That one
  refuses to run in this project on purpose - it would build the server a
  second, different way. It must be `npm run deploy`.
- Builds for other branches are on. They use the same default command, so they
  fail the same way.

When the build finishes, Cloudflare shows your address:

```
https://my-app-name.your-subdomain.workers.dev
```

**Write that address down.** The next steps all need it.

### Your first deploy may not load for a while

The very first time, your `workers.dev` address may refuse to connect, or your
browser may warn about the connection, for **up to about twenty minutes**.
Cloudflare is issuing the security certificate for your new address.

Nothing is wrong. Do not redeploy, do not rename the app. Make a cup of tea and
try again. (You can confirm the app itself is fine meanwhile by visiting the
same address with `http://` instead of `https://`.)

## Give the server its secret

**This is the step people forget, and it is the one that makes a working app
return errors in production.**

The build variables above only exist while the app is being built - they are
baked into the browser code. The server needs its own values while it is
running, and there is exactly one you have to type:

In your Worker: **Settings** → **Variables & Secrets** → **Add**. Set the type
to **Secret**:

| Name                  | Type   | Value                                           |
| --------------------- | ------ | ----------------------------------------------- |
| `SUPABASE_SECRET_KEY` | Secret | the `SUPABASE_SECRET_KEY` line from your `.env` |

> **Secret, not Text.** Every deploy clears out Text variables that are not
> written in `wrangler.jsonc`, so a Text value works once and vanishes on your
> next push. Secrets are kept.

Then open `https://your-address/api/health`. It should say:

```json
{ "ok": true, "database": "ok" }
```

If it says `not_configured`, the secret did not arrive - check the type is
**Secret**, and that you deployed at least once after adding it. If it says
`unreachable`, the URL is wrong: check `VITE_SUPABASE_URL` in the build
variables, since that is where the server's copy now comes from.

> Why two screens for one `.env`? Because two different machines need the values
> at two different moments. The `VITE_` lines are not variables in the finished
> app at all - Vite pastes them straight into the JavaScript while it builds, so
> they have to exist on the build machine. The secret key is read by the server
> while it is answering a request, on a different machine, long after the build
> is over. Cloudflare keeps them apart because they genuinely are apart, and
> that is the point: the build machine never needs the secret key, so the secret
> key never gets near anything the browser downloads.
>
> `SUPABASE_URL` used to be typed on both screens, because both halves need it.
> Now the build copies it over (see `serverUrlFromEnv` in `vite.config.ts`), so
> you type it once.

## Tell Supabase about the new address

Until you do this, **logging in on the deployed site will send people to
`localhost`** - which works on your machine and nowhere else. It is the single
most confusing bug at this stage.

In Supabase: **Authentication** → **URL Configuration**.

| Field             | Set it to                                                              |
| ----------------- | ---------------------------------------------------------------------- |
| **Site URL**      | `https://your-address.workers.dev`                                     |
| **Redirect URLs** | `https://your-address.workers.dev/**` _and_ `http://localhost:3000/**` |

Keep the localhost entry. You still need it to work on your own machine.

If you set up Google sign-in, that is the only change needed - the Google Cloud
Console redirect URI points at Supabase, not at your app, so it does not change.
See [3. Sign in with Google](03-google-sign-in.md).

## Keep the database awake

A free Supabase project is paused after about a week with no activity, and a
paused project means a broken app.

This repository has a GitHub Action that calls `/api/health` twice a week to
prevent that. Switch it on:

1. In your GitHub repository: **Settings** → **Secrets and variables** →
   **Actions** → the **Variables** tab.
2. **New repository variable**.
   - Name: `DEPLOY_URL`
   - Value: `https://your-address.workers.dev`
3. Go to the **Actions** tab, pick **Keep Supabase awake**, and press **Run
   workflow** to check it passes.

Until you add that variable the job skips itself, so it will not show a red
cross on a fresh repository.

> GitHub switches off scheduled workflows in a repository with no commits for 60
> days - exactly the quiet spell this is meant to cover. If you are away that
> long, come back and press **Run workflow** by hand.

## Deploying again

Push to `main`. That is it - Cloudflare builds and publishes every push, usually
within a minute or two.

Each push shows a check on the commit in GitHub. If it goes red, the build log
is in Cloudflare under your Worker → **Deployments**.

Secrets and build variables stay set. You only change them if a value changes.

## Before every push to main

Get in the habit of running the built version locally first:

```bash
npm run preview
```

This builds the app and serves the real output, the same way Cloudflare will. A
few things behave differently between `npm run dev` and the built app - deep
links being the main one - and this catches them before your users do.

## Hide the demo pages

Before handing the app to the organisation, add one more build variable:

```
VITE_SHOW_DEMOS = false
```

Then in **Deployments**, retry the latest build (or just push). That hides
`/components`, `/demos` and the "Demos" link in the header.

The demos' code is still there, just unreachable. To remove it for good, delete
`client/pages/demos/` and `client/features/budget/`, then follow the TypeScript
errors.

## Next

[5. Adding a feature](05-adding-a-feature.md) - the pattern to copy when you
start building.
