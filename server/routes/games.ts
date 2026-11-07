import { replay } from "@shared/game/rules";
import { createGameSchema } from "@shared/schemas/games";
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { fail, validate } from "../lib/errors";
import { createAdminClient } from "../lib/supabase";

/*
 * Finished big-three games. Same pattern as events.ts: a game belongs to the
 * person who played it, so every query is filtered by `c.get("user").id`.
 *
 * The rule that matters most in this file: THE SERVER NEVER TRUSTS THE
 * BROWSER ABOUT HOW A GAME WENT. The browser sends only the list of moves.
 * We play them again ourselves with the same pure functions the page uses
 * (shared/game/rules.ts), and save the result WE calculated.
 */

/** The columns we send to the browser. */
const COLUMNS = "id, owner_id, moves, result, created_at";

export const games = new Hono<AppEnv>()

  // GET /api/games - the logged-in user's games, newest first.
  .get("/", async (c) => {
    const supabase = createAdminClient(c.env);
    const { data, error } = await supabase
      .from("games")
      .select(COLUMNS)
      // This line is what keeps user B from seeing user A's games.
      .eq("owner_id", c.get("user").id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("list games failed:", error);
      return fail(c, 500, "database_error", "Could not load the games.");
    }
    return c.json(data);
  })

  // POST /api/games - save a finished game. Responds 201 with the saved game.
  .post("/", validate("json", createGameSchema), async (c) => {
    const { moves } = c.req.valid("json");

    // Play the game again from the first move. If it could not really have
    // been played, or it did not end, nothing is saved.
    const replayed = replay(moves);
    if (!replayed.ok) {
      const { message, moveIndex } = replayed.error;
      return fail(
        c,
        422,
        "invalid_game",
        moveIndex === undefined ? message : `Move ${moveIndex + 1}: ${message}`,
      );
    }
    const { result } = replayed.state;
    if (result === null) {
      // replay() only succeeds for a finished game, so this cannot happen.
      // It is here so the type is honest, and so a bug fails loudly.
      console.error("replay returned an unfinished game:", moves);
      return fail(c, 500, "internal_error", "Could not check the game.");
    }

    const supabase = createAdminClient(c.env);
    const { data, error } = await supabase
      .from("games")
      // owner_id comes from the verified token, and result from our own
      // replay. Neither is read from the request body.
      .insert({ owner_id: c.get("user").id, moves, result })
      .select(COLUMNS)
      .single();

    if (error) {
      console.error("create game failed:", error);
      return fail(c, 500, "database_error", "Could not save the game.");
    }
    return c.json(data, 201);
  });
