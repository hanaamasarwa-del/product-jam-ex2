# Product Jam Starter Kit

The starting point for Product Jam projects. It is a web app you can log into,
that stores data in a database and runs on the internet for free.

New here? Start with **[docs/01-quickstart.md](docs/01-quickstart.md)**.

## How the code is organised

There are three folders, and every file belongs to exactly one of them. Knowing
which one you are in tells you what your code can do.

| Folder    | Where it runs               | What it can do                                     |
| --------- | --------------------------- | -------------------------------------------------- |
| `client/` | In the visitor's browser    | Draw the screen. Cannot touch the database.        |
| `server/` | On Cloudflare, in the cloud | Talk to the database. Holds the secret keys.       |
| `shared/` | Both of the above           | Plain data rules that both sides have to agree on. |

The browser never reads the database directly. It asks the server, at a URL
starting with `/api/`, and the server answers.

### The server runs on Cloudflare Workers

It is not a normal Node.js server:

- There is no file system, and packages with native modules don't work. That
  means no `sharp`, `bcrypt` or `nodemailer`. Use libraries that work with
  `fetch`, or an HTTP API.
- Each request gets about 10ms of CPU. Waiting for the network is free; heavy
  computation is not.
- Nothing is kept in memory between requests. Anything you need later goes in
  the database.

### Before you add a library

Ask first before adding a framework or a big library. That especially means
Tailwind, Next.js, an ORM, a state or form library, CSS-in-JS or an i18n
framework. The kit already has a way to do each of these.

## Getting started

You need [Node.js](https://nodejs.org) version 24 or newer. Check with
`node --version`.

```bash
npm install          # download the libraries this project needs
cp .env.example .env               # then fill it in
npm run dev          # start the app
```

Then open **http://localhost:3000** in your browser.

That file needs real values from Supabase before login will work - see
[docs/02-supabase-setup.md](docs/02-supabase-setup.md).

## The commands

| Command             | What it does                                                                             |
| ------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`       | Runs the app on your machine at http://localhost:3000, and reloads when you save a file. |
| `npm run build`     | Packs the app up for the internet, into the `dist/` folder.                              |
| `npm run preview`   | Builds, then runs the packed version. **Use this to check things before pushing.**       |
| `npm run typecheck` | Checks that the types line up. Catches a lot of mistakes.                                |
| `npm run lint`      | Looks for likely bugs and rule violations.                                               |
| `npm run format`    | Tidies the spacing and punctuation of every file.                                        |
| `npm test`          | Runs the tests.                                                                          |

## The component gallery

With the app running, open **http://localhost:3000/components**.

Every component is on that page, in each of its variants, with a switch to flip
the whole thing between right-to-left and left-to-right. Look here before
building any UI - there is probably already a component for it. It is also the
quickest way to see what a change to `client/styles/tokens.css` does.

## The demos

**http://localhost:3000/demos** lists small, complete examples to copy from:

- **HTML elements** - every plain HTML element, styled by
  `client/styles/global.css`. Keep it open while you change the look.
- **Data visualisation** - data from a public API, drawn as a chart.

Before handing the app over, hide the gallery and the demos by setting
`VITE_SHOW_DEMOS=false` - see
[Hide the demo pages](docs/04-deploy.md#hide-the-demo-pages).

## Documentation

1. [Quickstart](docs/01-quickstart.md) - get it running on your machine
2. [Supabase setup](docs/02-supabase-setup.md) - the database and login
3. [Google sign-in](docs/03-google-sign-in.md) - "Sign in with Google"
4. [Deploy](docs/04-deploy.md) - put it on the internet
5. [Adding a feature](docs/05-adding-a-feature.md) - the pattern to copy
