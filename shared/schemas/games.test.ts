import { describe, expect, it } from "vitest";
import { createGameSchema } from "./games";

/*
 * createGameSchema only checks the SHAPE of a request. Whether the moves make
 * a game that could really be played is checked by replay(), in
 * shared/game/rules.test.ts.
 */

const fiveMoves = [0, 4, 1, 5, 2];

describe("createGameSchema", () => {
  it("accepts a list of moves", () => {
    const result = createGameSchema.safeParse({ moves: fiveMoves });
    expect(result.success).toBe(true);
  });

  it("accepts the longest game, 16 moves", () => {
    const moves = Array.from({ length: 16 }, (_, i) => i);
    expect(createGameSchema.safeParse({ moves }).success).toBe(true);
  });

  it("ignores anything but the moves, so a result cannot be sent", () => {
    const result = createGameSchema.safeParse({
      moves: fiveMoves,
      result: "o_wins",
      owner_id: "someone-else",
    });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ moves: fiveMoves });
  });

  it("rejects a missing list", () => {
    const result = createGameSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["moves"]);
  });

  it("rejects moves that are not a list", () => {
    expect(createGameSchema.safeParse({ moves: "0,4,1,5,2" }).success).toBe(
      false,
    );
    expect(createGameSchema.safeParse({ moves: { 0: 1 } }).success).toBe(false);
    expect(createGameSchema.safeParse({ moves: null }).success).toBe(false);
  });

  it("rejects a move that is not a number", () => {
    const result = createGameSchema.safeParse({ moves: [0, 4, "1", 5, 2] });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["moves", 2]);
  });

  it("rejects a move that is not a whole number", () => {
    expect(
      createGameSchema.safeParse({ moves: [0, 4, 1.5, 5, 2] }).success,
    ).toBe(false);
  });

  it("rejects a cell outside the board", () => {
    expect(
      createGameSchema.safeParse({ moves: [0, 4, -1, 5, 2] }).success,
    ).toBe(false);
    expect(
      createGameSchema.safeParse({ moves: [0, 4, 16, 5, 2] }).success,
    ).toBe(false);
  });

  it("rejects too few moves for any game to be over", () => {
    expect(createGameSchema.safeParse({ moves: [0, 4, 1, 5] }).success).toBe(
      false,
    );
    expect(createGameSchema.safeParse({ moves: [] }).success).toBe(false);
  });

  it("rejects more moves than the board has cells", () => {
    const moves = Array.from({ length: 17 }, (_, i) => i % 16);
    expect(createGameSchema.safeParse({ moves }).success).toBe(false);
  });
});
