import { describe, expect, it } from "vitest";
import {
  CELL_COUNT,
  newGame,
  nextPlayer,
  playMove,
  replay,
  WINNING_LINES,
  type GameState,
} from "./rules";

/*
 * The rules of big-three: 4x4, three in a row wins, X first.
 *
 * Board cells, for reading the tests:
 *
 *      0  1  2  3
 *      4  5  6  7
 *      8  9 10 11
 *     12 13 14 15
 */

/** Plays moves that must all be legal (the game may be unfinished). */
function play(moves: number[]): GameState {
  let state = newGame();
  for (const cell of moves) {
    const next = playMove(state, cell);
    if (!next.ok) throw new Error(`test setup: ${next.error.message}`);
    state = next.state;
  }
  return state;
}

describe("the board", () => {
  it("has 24 lines of three that can win", () => {
    // 8 across + 8 down + 4 diagonal each way.
    expect(WINNING_LINES).toHaveLength(24);
  });

  it("never counts a line that wraps around the edge", () => {
    const wrapping = WINNING_LINES.filter(
      (line) => line.includes(2) && line.includes(3) && line.includes(4),
    );
    expect(wrapping).toHaveLength(0);
  });

  it("starts empty with X to play", () => {
    const game = newGame();
    expect(game.board).toHaveLength(CELL_COUNT);
    expect(game.board.every((cell) => cell === null)).toBe(true);
    expect(game.result).toBeNull();
    expect(nextPlayer(game)).toBe("X");
  });
});

describe("playing moves", () => {
  it("alternates X and O, starting with X", () => {
    const first = playMove(newGame(), 5);
    expect(first.ok && first.state.board[5]).toBe("X");
    if (!first.ok) return;
    expect(nextPlayer(first.state)).toBe("O");

    const second = playMove(first.state, 6);
    expect(second.ok && second.state.board[6]).toBe("O");
    if (!second.ok) return;
    expect(nextPlayer(second.state)).toBe("X");
    expect(second.state.moves).toEqual([5, 6]);
  });

  it("does not change the game it was given", () => {
    const before = newGame();
    const boardCopy = [...before.board];
    playMove(before, 0);
    expect(before.board).toEqual(boardCopy);
    expect(before.moves).toEqual([]);
    expect(before.result).toBeNull();
  });

  it("keeps going after two in a row", () => {
    const game = play([0, 4, 1]);
    expect(game.result).toBeNull();
  });
});

describe("winning", () => {
  it("X wins with three across", () => {
    const game = play([0, 4, 1, 5, 2]);
    expect(game.result).toBe("x_wins");
    expect(game.winningLine).toEqual([0, 1, 2]);
  });

  it("X wins with the last three of a row", () => {
    const game = play([1, 4, 2, 5, 3]);
    expect(game.result).toBe("x_wins");
    expect(game.winningLine).toEqual([1, 2, 3]);
  });

  it("X wins with three down", () => {
    const game = play([0, 1, 4, 2, 8]);
    expect(game.result).toBe("x_wins");
    expect(game.winningLine).toEqual([0, 4, 8]);
  });

  it("X wins on the diagonal going down and right", () => {
    const game = play([0, 1, 5, 2, 10]);
    expect(game.result).toBe("x_wins");
    expect(game.winningLine).toEqual([0, 5, 10]);
  });

  it("X wins on the diagonal going down and left", () => {
    const game = play([3, 0, 6, 1, 9]);
    expect(game.result).toBe("x_wins");
    expect(game.winningLine).toEqual([3, 6, 9]);
  });

  it("O wins too, and the game says so", () => {
    // X: 0, 1, 15. O: 5, 6, 7 across the second row.
    const game = play([0, 5, 1, 6, 15, 7]);
    expect(game.result).toBe("o_wins");
    expect(game.winningLine).toEqual([5, 6, 7]);
    expect(nextPlayer(game)).toBeNull();
  });

  it("does not count three that wrap around the edge", () => {
    // X has 2, 3 and 4: the end of one row and the start of the next.
    const game = play([2, 8, 3, 9, 4]);
    expect(game.result).toBeNull();
  });

  it("does not count three that are not next to each other", () => {
    // X has 0, 2 and 3: a gap at 1.
    const game = play([0, 4, 2, 5, 3]);
    expect(game.result).toBeNull();
  });

  it("does not count three of different players", () => {
    const game = play([0, 1, 2]);
    expect(game.result).toBeNull();
  });

  it("ends the game on three, even though four fit on the row", () => {
    const game = play([0, 4, 1, 5, 2]);
    expect(game.result).toBe("x_wins");
    expect(game.moves).toHaveLength(5);
  });

  it("counts a win on the very last move as a win, not a draw", () => {
    // Found by searching: the board fills up on move 16 and that move makes
    // three in a row (6, 9, 12) for O.
    const moves = [3, 8, 2, 6, 14, 1, 5, 0, 13, 9, 11, 7, 10, 15, 4, 12];
    const game = play(moves);
    expect(game.moves).toHaveLength(16);
    expect(game.result).toBe("o_wins");
    expect(game.winningLine).toEqual([6, 9, 12]);
  });
});

describe("drawing", () => {
  // The final board:   X X O O
  //                    O O X X
  //                    X X O O
  //                    O O X X
  // No three in a row anywhere, for either player.
  const drawMoves = [0, 2, 1, 3, 6, 4, 7, 5, 8, 10, 9, 11, 14, 12, 15, 13];

  it("is a draw when the board is full and nobody has three in a row", () => {
    const game = play(drawMoves);
    expect(game.moves).toHaveLength(16);
    expect(game.result).toBe("draw");
    expect(game.winningLine).toBeNull();
    expect(nextPlayer(game)).toBeNull();
  });

  it("is not decided before the last move", () => {
    const almost = play(drawMoves.slice(0, 15));
    expect(almost.result).toBeNull();
    expect(nextPlayer(almost)).toBe("O");
  });
});

describe("illegal moves", () => {
  it("rejects a cell that is already taken", () => {
    const game = play([5]);
    const result = playMove(game, 5);
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "cell_taken" }),
    });
  });

  it("rejects a cell that does not exist", () => {
    for (const cell of [-1, 16, 100]) {
      const result = playMove(newGame(), cell);
      expect(result.ok).toBe(false);
      expect(!result.ok && result.error.code).toBe("invalid_cell");
    }
  });

  it("rejects a move that is not a whole number", () => {
    for (const cell of [1.5, Number.NaN, Infinity]) {
      const result = playMove(newGame(), cell);
      expect(!result.ok && result.error.code).toBe("invalid_cell");
    }
  });

  it("leaves the game as it was after a rejected move", () => {
    const game = play([5, 6]);
    playMove(game, 5);
    expect(game.moves).toEqual([5, 6]);
    expect(nextPlayer(game)).toBe("X");
  });
});

describe("playing after the game ends", () => {
  it("rejects a move after a win", () => {
    const won = play([0, 4, 1, 5, 2]);
    const result = playMove(won, 10);
    expect(!result.ok && result.error.code).toBe("game_over");
  });

  it("rejects a move after a draw", () => {
    const drawn = play([0, 2, 1, 3, 6, 4, 7, 5, 8, 10, 9, 11, 14, 12, 15, 13]);
    const result = playMove(drawn, 0);
    expect(!result.ok && result.error.code).toBe("game_over");
  });

  it("says the game is over even if the move would also be illegal", () => {
    const won = play([0, 4, 1, 5, 2]);
    const result = playMove(won, 99);
    expect(!result.ok && result.error.code).toBe("game_over");
  });
});

describe("replay (what the server uses to check a saved game)", () => {
  it("accepts a real game that ended in a win", () => {
    const result = replay([0, 4, 1, 5, 2]);
    expect(result.ok && result.state.result).toBe("x_wins");
  });

  it("accepts a real game that ended in a draw", () => {
    const result = replay([
      0, 2, 1, 3, 6, 4, 7, 5, 8, 10, 9, 11, 14, 12, 15, 13,
    ]);
    expect(result.ok && result.state.result).toBe("draw");
  });

  it("works out the result itself", () => {
    // The caller never says who won; replay does.
    const result = replay([0, 5, 1, 6, 15, 7]);
    expect(result.ok && result.state.result).toBe("o_wins");
  });

  it("rejects a game that is not finished", () => {
    const result = replay([0, 4, 1, 5]);
    expect(!result.ok && result.error.code).toBe("game_not_finished");
  });

  it("rejects a game 'won' in 2 moves", () => {
    const result = replay([0, 1]);
    expect(!result.ok && result.error.code).toBe("game_not_finished");
  });

  it("rejects no moves at all", () => {
    const result = replay([]);
    expect(!result.ok && result.error.code).toBe("game_not_finished");
  });

  it("rejects a cell played twice, and says which move", () => {
    const result = replay([0, 4, 0]);
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "cell_taken", moveIndex: 2 }),
    });
  });

  it("rejects a cell that does not exist, and says which move", () => {
    const result = replay([0, 4, 1, 20]);
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "invalid_cell", moveIndex: 3 }),
    });
  });

  it("rejects a move after the game was already won", () => {
    // X has three across after move 5 (index 4); the sixth move should not exist.
    const result = replay([0, 4, 1, 5, 2, 10]);
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "game_over", moveIndex: 5 }),
    });
  });

  it("rejects more than 16 moves", () => {
    const result = replay([
      0, 2, 1, 3, 6, 4, 7, 5, 8, 10, 9, 11, 14, 12, 15, 13, 0,
    ]);
    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: "game_over", moveIndex: 16 }),
    });
  });

  it("does not change the list of moves it was given", () => {
    const moves = [0, 4, 1, 5, 2];
    replay(moves);
    expect(moves).toEqual([0, 4, 1, 5, 2]);
  });
});
