# 1. Getting it running on your machine

By the end of this page the app will be running in your browser. It will not be
able to log you in yet - that is page 2.

## Before you start

You need **Node.js version 24 or newer**. Check by opening a terminal and
running:

```bash
node --version
```

If that says something older, or "command not found", install the LTS version
from [nodejs.org](https://nodejs.org).

You also need **git**, and an editor. We recommend
[VS Code](https://code.visualstudio.com) - this project suggests a few useful
extensions when you open it.

## Get the code

Clone it from github:

```bash
git clone https://github.com/YOU/YOUR-REPO.git
cd YOUR-REPO
```

## Install the dependencies

```bash
npm install
```

_Dependencies_ are the libraries this project is built on. They are not kept in
git, so everyone runs this once after cloning. It creates a `node_modules`
folder - you never need to look inside it.

## Create your settings file

The project needs one file that is **not** in git, because it holds values
specific to you and your team. There is an example to copy:

```bash
cp .env.example .env
```

Leave it empty for now. Page 2 fills it in.

Open it and you will see it is in two halves, with a warning between them.

| Half                     | Read by                        | Ends up                                              |
| ------------------------ | ------------------------------ | ---------------------------------------------------- |
| lines starting `VITE_`   | the browser app, at build time | **public**, inside the JavaScript everyone downloads |
| lines without the prefix | the server, at run time        | **private**, never sent to anyone                    |

A secret key must never have `VITE_` in front of it.

## Start it

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

You should see a welcome page. One command runs both halves: the browser app,
and the server that answers `/api/*`. Save a file and the page updates by
itself.

To stop it, press `Ctrl+C` in the terminal.

## Check the server is alive

Open **http://localhost:3000/api/health**.

You will see something like:

```json
{ "ok": false, "database": "not_configured" }
```

That is correct for now - you have not connected a database yet. Once you finish
page 2 it will say `{ "ok": true, "database": "ok" }`.

## Common commands

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm install`       | Downloads the libraries. Run again when they change. |
| `npm run dev`       | Runs the app locally and reloads when you save.      |
| `npm run typecheck` | Checks the types line up. Catches a lot of mistakes. |
| `npm run lint`      | Looks for likely bugs.                               |
| `npm run format`    | Tidies up spacing and punctuation in every file.     |
| `npm test`          | Runs the tests.                                      |

## Next

[2. Setting up Supabase](02-supabase-setup.md) - the database and logging in.
