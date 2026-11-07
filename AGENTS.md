# AGENTS.md

A starter web app for Product Jam: a React client, a Hono server on Cloudflare
Workers, and Supabase for the database and login.

## Folders

- `client/` - the React app, which runs in the browser.
  - `components/` - the shared UI components
  - `features/<name>/` - the hooks and forms for one kind of data
  - `pages/<section>/` - the screens, one folder per URL section (`/events/*` is
    in `pages/events/`), routed in `App.tsx`. Pages use `export default`.
  - `pages/Layout.tsx` - the header and footer around every page
  - `lib/`, `styles/`
- `server/` - the Hono app, which runs on Cloudflare Workers.
  - `routes/` - the API, registered in `server/index.ts`
  - `middleware/`, `lib/`
- `shared/` - TypeScript imported by both the client and the server.
- `supabase/` - database migrations and seed data.
- `docs/` - the guides, numbered in reading order.

The server runs on Cloudflare Workers, not Node: there is no file system, and
packages with native modules don't work.

## Commands

```bash
npm run dev         # http://localhost:3000, client and server together
npm run build       # into dist/
npm run preview     # build, then serve it
npm run typecheck   # tsc -b
npm run lint        # eslint
npm run format      # prettier --write
npm test            # vitest
```
