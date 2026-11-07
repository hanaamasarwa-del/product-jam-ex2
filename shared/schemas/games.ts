import { z } from "zod";
import { CELL_COUNT, MIN_GAME_LENGTH } from "../game/rules";

/*
 * What a "game" looks like, written once for both sides, like the events
 * schemas. The important rule is in what is MISSING from createGameSchema:
 * the browser sends only the moves. It never sends the result, the owner or
 * the date, because the server works those out itself.
 *
 * This schema only checks the SHAPE of the request (400). Whether the moves
 * make a game that could really be played is decided by `replay()` in
 * shared/game/rules.ts (422).
 */

/** The results a game can have. The same three the `games` table allows. */
export const gameResultSchema = z.enum(["x_wins", "o_wins", "draw"]);

/** A saved game, as the API returns it. Dates are ISO strings. */
export const gameSchema = z.object({
  id: z.string(),
  owner_id: z.string(),
  moves: z.array(z.number()),
  result: gameResultSchema,
  created_at: z.string(),
});

/** What you must send to save a game: just the moves, in the order played. */
export const createGameSchema = z.object({
  moves: z
    .array(
      z
        .number("Every move must be a number")
        .int("Every move must be a whole number")
        .min(0, `Every move must be a cell from 0 to ${CELL_COUNT - 1}`)
        .max(
          CELL_COUNT - 1,
          `Every move must be a cell from 0 to ${CELL_COUNT - 1}`,
        ),
      "Moves must be a list of cells",
    )
    .min(
      MIN_GAME_LENGTH,
      `A finished game has at least ${MIN_GAME_LENGTH} moves`,
    )
    .max(CELL_COUNT, `A game has at most ${CELL_COUNT} moves`),
});

export type Game = z.infer<typeof gameSchema>;
export type GameResultValue = z.infer<typeof gameResultSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
