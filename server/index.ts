import { Hono } from "hono";
import type { ApiError } from "@shared/index";
import type { AppEnv } from "./env";
import { fail } from "./lib/errors";
import { requireAuth } from "./middleware/auth";
import { events } from "./routes/events";
import { health } from "./routes/health";
import { me } from "./routes/me";
import { uploads } from "./routes/uploads";

/**
 * This is the server. It runs on Cloudflare Workers, NOT in the browser.
 *
 * Everything it handles lives under /api/*. Every other URL is served by the
 * browser app in client/ (see wrangler.jsonc).
 */
const app = new Hono<AppEnv>();

// ---------------------------------------------------------------------------
// Public routes. No login required.
// IMPORTANT: these must stay ABOVE the `app.use` line below. Hono runs things
// in the order you register them, and that order is what makes these public.
// ---------------------------------------------------------------------------
app.route("/api/health", health);

// ---------------------------------------------------------------------------
// Everything registered BELOW this line requires a logged-in user.
// Requests without a valid token get a 401 and never reach the handler.
// ---------------------------------------------------------------------------
app.use("/api/*", requireAuth);

app.route("/api/me", me);
app.route("/api/events", events);
app.route("/api/uploads", uploads);

// Any /api/* URL we did not define above. Without this, an unknown API URL
// would fall through and return the HTML page, which is very confusing to debug.
app.all("/api/*", (c) =>
  fail(c, 404, "not_found", "There is no such address on the server."),
);

app.onError((err, c) => {
  console.error(err);
  return fail(c, 500, "internal_error", "Something went wrong on the server.");
});

// Proves the @shared alias resolves in the Workers build as well as the browser.
export type { ApiError };

export default app;
