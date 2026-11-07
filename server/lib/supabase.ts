import { createClient } from "@supabase/supabase-js";
import type { Bindings } from "../env";

/**
 * The Supabase client for the SERVER.
 *
 * It uses the secret key, which ignores every database rule. That is why it
 * only ever exists here, on Cloudflare, and never in client/.
 *
 * Because it can read and write anything, YOUR handler is what keeps users
 * apart. Whenever data belongs to a person, filter by their id:
 *
 *     .eq("owner_id", c.get("user").id)
 *
 * Build a new one per request. Do not make one at the top of a file: it needs
 * values from `c.env`, which only exist once a request arrives.
 */
export function createAdminClient(env: Bindings) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
      // There is no browser here, so there is nowhere to save a session and
      // no user to keep logged in. Without these, the library looks for
      // localStorage and crashes.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
