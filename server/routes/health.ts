import { Hono } from "hono";
import type { AppEnv } from "../env";
import { createAdminClient } from "../lib/supabase";

/**
 * Is the app working?
 *
 * Public, so you can open it in a browser or curl it while setting things
 * up. It answers two questions at once: is the server running, and can it
 * reach the database.
 *
 * It also serves as the keep-alive: a free Supabase project is paused
 * after a week with no database activity, and the GitHub Action in
 * .github/workflows/keepalive.yml calls this twice a week so that the
 * query below keeps it awake. That is why this checks the database rather
 * than just replying "ok" - a ping that touches nothing would not prevent
 * the pause.
 */
export const health = new Hono<AppEnv>().get("/", async (c) => {
  if (!c.env.SUPABASE_URL || !c.env.SUPABASE_SECRET_KEY) {
    return c.json({ ok: false, database: "not_configured" }, 503);
  }

  // The cheapest query there is: ask for at most one id.
  const { error } = await createAdminClient(c.env)
    .from("events")
    .select("id")
    .limit(1);

  if (error) {
    console.error("health check: database unreachable:", error);
    return c.json({ ok: false, database: "unreachable" }, 503);
  }

  return c.json({ ok: true, database: "ok" });
});
