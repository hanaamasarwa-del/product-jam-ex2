import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

/**
 * The Supabase client for the BROWSER.
 *
 * It is used for ONE thing: logging in and out, and knowing who is logged in.
 *
 * It is NOT used to read or write your data. Every table has Row Level
 * Security turned on with no policies, which makes the publishable key
 * useless for data access - on purpose. To read data, call the server:
 *
 *     import { api } from "./api";
 *     const events = await api("/api/events");
 *
 * See "About Row Level Security" in docs/02-supabase-setup.md for why.
 */
/*
 * The two fallbacks below matter more than they look.
 *
 * createClient throws immediately if the URL is empty, and this file is
 * imported on every page - so before anything renders. On a fresh clone
 * with an empty .env that means a blank white page and a console error,
 * instead of the "you have not set up Supabase yet" screen.
 *
 * So we hand it harmless placeholders when nothing is configured. Nothing
 * calls out to them: SUPABASE_ENABLED is false, and the app shows the
 * setup message instead.
 */
export const supabase = createClient(
  SUPABASE_URL || "https://not-configured.supabase.co",
  SUPABASE_PUBLISHABLE_KEY || "not-configured",
  {
    auth: {
      // Keep the user logged in when they close the tab and come back.
      persistSession: true,
      autoRefreshToken: true,
      // Finish the "Sign in with Google" round trip when the browser comes
      // back to our site with a code in the URL.
      detectSessionInUrl: true,
    },
  },
);
