import {
  explainRequestSchema,
  picturesQuerySchema,
  type Explanation,
} from "@shared/schemas/nasa";
import { Hono } from "hono";
import type { Context } from "hono";
import type { AppEnv } from "../env";
import { fail, validate } from "../lib/errors";
import { GEMINI_MODEL, explainInHebrew } from "../lib/gemini";
import { fetchPictureText, fetchRandomPictures } from "../lib/nasa";
import { createAdminClient } from "../lib/supabase";
import { UpstreamError } from "../lib/upstream";

/*
 * NASA pictures, explained in Hebrew by Gemini. The steps are in
 * docs/design.md. Two things to keep in mind while reading:
 *
 *   - The Gemini key lives only here, on the server. The browser never calls
 *     NASA or Gemini; it calls us. (NASA's official APOD endpoint needs no
 *     key - see server/lib/nasa.ts.)
 *   - The explanations are saved in `apod_explanations`, ONE row per date,
 *     shared by everyone. That row doubles as a lock, so two people tapping
 *     the same card do not make two paid Gemini calls.
 */

const TABLE = "apod_explanations";

/** How long a request may hold a date's lock before another may take it. */
const LEASE_MS = 60_000;

type Db = ReturnType<typeof createAdminClient>;

type CacheRow = {
  date: string;
  status: "pending" | "done";
  title_he: string | null;
  summary_he: string | null;
  tags: string[] | null;
  claimed_at: string;
};

/** The finished explanation in a row. Only call this for a `done` row. */
function toExplanation(row: CacheRow): Explanation {
  return {
    date: row.date,
    title_he: row.title_he ?? "",
    summary_he: row.summary_he ?? "",
    tags: (row.tags ?? []) as Explanation["tags"],
  };
}

/**
 * Turns a failed call to NASA or Gemini into OUR answer. The user gets our
 * wording and our status code, never the other server's: its codes (a 403 for
 * a wrong key, a 429 for a rate limit) say things about OUR setup that are
 * not for the visitor, and mean nothing to them.
 */
function upstreamFail(c: Context<AppEnv>, error: unknown) {
  if (!(error instanceof UpstreamError)) throw error;
  // Log which service and what happened - never the URL or the key.
  console.error("upstream failed:", error.message);

  if (error.service === "nasa") {
    if (error.kind === "not_found") {
      return fail(c, 404, "not_found", "NASA has no picture for that date.");
    }
    if (error.kind === "timeout") {
      return fail(
        c,
        504,
        "nasa_timeout",
        "NASA took too long to answer. Please try again.",
      );
    }
    return fail(
      c,
      502,
      "nasa_unavailable",
      "We could not get pictures from NASA right now. Please try again later.",
    );
  }

  if (error.kind === "timeout") {
    return fail(
      c,
      504,
      "gemini_timeout",
      "The explanation took too long to write. Please try again.",
    );
  }
  if (error.kind === "invalid_response") {
    return fail(
      c,
      502,
      "gemini_invalid_response",
      "The explanation did not come out right. Please try again.",
    );
  }
  return fail(
    c,
    502,
    "gemini_unavailable",
    "We could not write the explanation right now. Please try again later.",
  );
}

type ClaimResult =
  | { kind: "claimed" }
  | { kind: "done"; explanation: Explanation }
  | { kind: "busy" }
  | { kind: "error" };

/**
 * Tries to become the one request that asks Gemini about `date`.
 *
 * `claimedAt` is this request's own stamp. Everything we do to the row
 * afterwards is conditional on that stamp still being there, so if another
 * request took the row over, we cannot overwrite or delete theirs.
 */
async function claim(
  db: Db,
  date: string,
  claimedAt: string,
): Promise<ClaimResult> {
  // Twice at most: the row we find can vanish (its owner failed and cleaned
  // up) or change hands between our two looks at it.
  for (let attempt = 0; attempt < 2; attempt++) {
    // Insert, and do nothing if the date already has a row. In SQL this is
    // `insert ... on conflict (date) do nothing returning date`, which is one
    // atomic step: of any number of simultaneous requests, exactly one gets a
    // row back.
    const inserted = await db
      .from(TABLE)
      .upsert(
        { date, status: "pending", claimed_at: claimedAt },
        { onConflict: "date", ignoreDuplicates: true },
      )
      .select("date");
    if (inserted.error) {
      console.error("claim insert failed:", inserted.error);
      return { kind: "error" };
    }
    if (inserted.data.length > 0) return { kind: "claimed" };

    // Somebody else has a row for this date. Look at it.
    const existing = await db
      .from(TABLE)
      .select("date, status, title_he, summary_he, tags, claimed_at")
      .eq("date", date)
      .maybeSingle();
    if (existing.error) {
      console.error("claim read failed:", existing.error);
      return { kind: "error" };
    }
    const row = existing.data as CacheRow | null;
    if (!row) continue; // It vanished; try to claim it again.

    if (row.status === "done") {
      return { kind: "done", explanation: toExplanation(row) };
    }

    // Pending. If it is fresh, its owner is still working: wait.
    if (Date.now() - Date.parse(row.claimed_at) < LEASE_MS) {
      return { kind: "busy" };
    }

    // Pending for too long: its owner probably died. Take it over, but only
    // if it is STILL the same stale claim. Of two requests doing this at once,
    // only one update matches.
    const takeover = await db
      .from(TABLE)
      .update({ claimed_at: claimedAt })
      .eq("date", date)
      .eq("status", "pending")
      .eq("claimed_at", row.claimed_at)
      .select("date");
    if (takeover.error) {
      console.error("claim takeover failed:", takeover.error);
      return { kind: "error" };
    }
    if (takeover.data.length > 0) return { kind: "claimed" };
    // Lost the race. Loop once more to see what the winner left.
  }
  return { kind: "busy" };
}

/** Gives the date back after a failure, so the next request can try again. */
async function release(db: Db, date: string, claimedAt: string) {
  const { error } = await db
    .from(TABLE)
    .delete()
    .eq("date", date)
    .eq("status", "pending")
    .eq("claimed_at", claimedAt);
  // If this fails, the row just waits out the 60 seconds and gets taken over.
  if (error) console.error("release failed:", error);
}

export const nasa = new Hono<AppEnv>()

  // GET /api/nasa/pictures?count=N - random pictures, with any Hebrew
  // explanation that is already saved.
  .get("/pictures", validate("query", picturesQuerySchema), async (c) => {
    const { count } = c.req.valid("query");

    let pictures;
    try {
      pictures = await fetchRandomPictures(count);
    } catch (error) {
      return upstreamFail(c, error);
    }

    // Which of these dates already have a finished explanation? A pending row
    // has no text yet, so it does not count.
    const dates = [...new Set(pictures.map((picture) => picture.date))];
    const { data, error } = await createAdminClient(c.env)
      .from(TABLE)
      .select("date, title_he, summary_he, tags")
      .eq("status", "done")
      .in("date", dates);
    if (error) {
      console.error("read explanations failed:", error);
      return fail(c, 500, "database_error", "Could not load the explanations.");
    }

    const saved = new Map(
      (data as CacheRow[]).map((row) => [row.date, toExplanation(row)]),
    );
    return c.json(
      pictures.map((picture) => {
        const found = saved.get(picture.date);
        return {
          ...picture,
          hebrew: found
            ? {
                title_he: found.title_he,
                summary_he: found.summary_he,
                tags: found.tags,
              }
            : null,
        };
      }),
    );
  })

  // POST /api/nasa/explanations - explain one picture in Hebrew.
  // The browser sends ONLY the date.
  .post("/explanations", validate("json", explainRequestSchema), async (c) => {
    const { date } = c.req.valid("json");
    const db = createAdminClient(c.env);

    // 1. Already explained? Then there is nothing to pay for.
    const first = await db
      .from(TABLE)
      .select("date, status, title_he, summary_he, tags, claimed_at")
      .eq("date", date)
      .maybeSingle();
    if (first.error) {
      console.error("read explanation failed:", first.error);
      return fail(c, 500, "database_error", "Could not load the explanation.");
    }
    const found = first.data as CacheRow | null;
    if (found?.status === "done") return c.json(toExplanation(found));

    // 2. The title and text come from NASA, never from the browser. (This is
    // free, so it comes before the paid step. If it fails, nothing is locked.)
    let picture;
    try {
      picture = await fetchPictureText(date);
    } catch (error) {
      return upstreamFail(c, error);
    }

    // 3. Claim the date, so only one request calls Gemini.
    const claimedAt = new Date().toISOString();
    const claimed = await claim(db, date, claimedAt);
    if (claimed.kind === "done") return c.json(claimed.explanation);
    if (claimed.kind === "error") {
      return fail(c, 500, "database_error", "Could not save the explanation.");
    }
    if (claimed.kind === "busy") {
      return fail(
        c,
        409,
        "explanation_in_progress",
        "This picture is being explained right now. Try again in a few seconds.",
      );
    }

    // 4. We own the date. Ask Gemini. If anything goes wrong, give it back.
    let explanation;
    try {
      explanation = await explainInHebrew(c.env, picture);
    } catch (error) {
      await release(db, date, claimedAt);
      return upstreamFail(c, error);
    }

    // 5. Save it, still only if the date is still ours.
    const saved = await db
      .from(TABLE)
      .update({
        status: "done",
        title_he: explanation.title_he,
        summary_he: explanation.summary_he,
        tags: explanation.tags,
        model: GEMINI_MODEL,
      })
      .eq("date", date)
      .eq("status", "pending")
      .eq("claimed_at", claimedAt)
      .select("date");
    if (saved.error) {
      console.error("save explanation failed:", saved.error);
      await release(db, date, claimedAt);
      return fail(c, 500, "database_error", "Could not save the explanation.");
    }
    if (saved.data.length === 0) {
      // We took too long and someone took the date over. See what they left.
      const latest = await db
        .from(TABLE)
        .select("date, status, title_he, summary_he, tags, claimed_at")
        .eq("date", date)
        .maybeSingle();
      const row = latest.data as CacheRow | null;
      if (row?.status === "done") return c.json(toExplanation(row));
      return fail(
        c,
        409,
        "explanation_in_progress",
        "This picture is being explained right now. Try again in a few seconds.",
      );
    }

    return c.json(
      {
        date,
        title_he: explanation.title_he,
        summary_he: explanation.summary_he,
        tags: explanation.tags,
      } satisfies Explanation,
      201,
    );
  });
