/*
 * The rules of "big-three": tic-tac-toe on a 4x4 board, where THREE in a row
 * wins. X goes first.
 *
 * Everything here is a pure function: it only looks at what it is given, and
 * it never changes it. There is no React, no database and no clock in this
 * file. That is on purpose. The page uses these functions to play, and the
 * server uses the very same ones to check a saved game, so the two can never
 * disagree about the rules.
 *
 * The board is a flat list of 16 cells, numbered row by row:
 *
 *      0  1  2  3
 *      4  5  6  7
 *      8  9 10 11
 *     12 13 14 15
 *
 * so the cell in row `r` and column `c` is number `4 * r + c`.
 */

export const BOARD_SIZE = 4;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;
export const WIN_LENGTH = 3;
/**
 * The fewest moves a finished game can have: X needs three marks, and O plays
 * between them, so the earliest win is move 5.
 */
export const MIN_GAME_LENGTH = 2 * WIN_LENGTH - 1;

export type Player = "X" | "O";
export type Cell = Player | null;

/** The result strings are the same ones the `games` table allows. */
export type GameResult = "x_wins" | "o_wins" | "draw";

export type GameState = {
  /** 16 cells. Never changed; every move makes a new array. */
  readonly board: readonly Cell[];
  /** Cell numbers in the order they were played. X plays the even positions. */
  readonly moves: readonly number[];
  /** `null` while the game is still going. */
  readonly result: GameResult | null;
  /** The three cells that won, or `null` (no winner yet, or a draw). */
  readonly winningLine: readonly number[] | null;
};

export type GameErrorCode =
  /** The move is not a whole number from 0 to 15. */
  | "invalid_cell"
  /** That cell already has an X or an O. */
  | "cell_taken"
  /** A move came after the game was already won or drawn. */
  | "game_over"
  /** The moves stop before anyone won and before the board is full. */
  | "game_not_finished";

export type GameError = {
  readonly code: GameErrorCode;
  /** Plain English, safe to show to a person. */
  readonly message: string;
  /** Which move (counting from 0) was wrong. Only set by `replay`. */
  readonly moveIndex?: number;
};

/** Either it worked and you get the new game, or it didn't and you get why. */
export type MoveResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly error: GameError };

/**
 * Every line of three cells that wins: three next to each other, across, down
 * or diagonally. A line never wraps around the edge of the board, so cells
 * 2, 3 and 4 are NOT a line (3 is the end of one row, 4 the start of the next).
 */
export const WINNING_LINES: readonly (readonly number[])[] = buildLines();

function buildLines(): number[][] {
  // Steps as [rows, columns]: right, down, down-right, down-left.
  const directions: [number, number][] = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  const lines: number[][] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (const [dRow, dCol] of directions) {
        const endRow = row + dRow * (WIN_LENGTH - 1);
        const endCol = col + dCol * (WIN_LENGTH - 1);
        const fits =
          endRow >= 0 &&
          endRow < BOARD_SIZE &&
          endCol >= 0 &&
          endCol < BOARD_SIZE;
        if (!fits) continue;
        const line: number[] = [];
        for (let step = 0; step < WIN_LENGTH; step++) {
          line.push((row + dRow * step) * BOARD_SIZE + (col + dCol * step));
        }
        lines.push(line);
      }
    }
  }
  return lines;
}

/** An empty board, with X to play. */
export function newGame(): GameState {
  return {
    board: Array<Cell>(CELL_COUNT).fill(null),
    moves: [],
    result: null,
    winningLine: null,
  };
}

/** Whose turn it is, or `null` if the game is over. */
export function nextPlayer(state: GameState): Player | null {
  if (state.result !== null) return null;
  return state.moves.length % 2 === 0 ? "X" : "O";
}

/** The first line of three that belongs to one player, if there is one. */
function findWinningLine(
  board: readonly Cell[],
): { player: Player; line: readonly number[] } | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const first = board[a!];
    if (first !== null && first === board[b!] && first === board[c!]) {
      return { player: first!, line };
    }
  }
  return null;
}

/**
 * Plays one move and gives back the game after it. The game you pass in is
 * not changed.
 *
 * Wrong moves don't throw; they come back as `{ ok: false, error }`, so the
 * server can turn them into a clear answer.
 */
export function playMove(state: GameState, cell: number): MoveResult {
  if (state.result !== null) {
    return fail("game_over", "The game is already over.");
  }
  if (!Number.isInteger(cell) || cell < 0 || cell >= CELL_COUNT) {
    return fail(
      "invalid_cell",
      `A move must be a whole number from 0 to ${CELL_COUNT - 1}.`,
    );
  }
  if (state.board[cell] !== null) {
    return fail("cell_taken", `Cell ${cell} is already taken.`);
  }

  const player = nextPlayer(state) as Player;
  const board = state.board.map((existing, index) =>
    index === cell ? player : existing,
  );
  const moves = [...state.moves, cell];

  const win = findWinningLine(board);
  if (win) {
    return {
      ok: true,
      state: {
        board,
        moves,
        result: win.player === "X" ? "x_wins" : "o_wins",
        winningLine: win.line,
      },
    };
  }
  // Nobody won, and no cell is left: a draw.
  if (moves.length === CELL_COUNT) {
    return {
      ok: true,
      state: { board, moves, result: "draw", winningLine: null },
    };
  }
  return { ok: true, state: { board, moves, result: null, winningLine: null } };
}

/**
 * Plays a whole list of moves from an empty board, and checks that it is a
 * game that could really have been played, from the first move to the end.
 *
 * It fails if any move is illegal, if a move comes after the game was already
 * decided, or if the moves stop before the game is over. This is what the
 * server uses to check a game the browser wants to save.
 */
export function replay(moves: readonly number[]): MoveResult {
  let state = newGame();
  for (const [moveIndex, cell] of moves.entries()) {
    const next = playMove(state, cell);
    if (!next.ok) {
      return { ok: false, error: { ...next.error, moveIndex } };
    }
    state = next.state;
  }
  if (state.result === null) {
    return fail(
      "game_not_finished",
      "The game did not end: nobody has three in a row and the board is not full.",
    );
  }
  return { ok: true, state };
}

function fail(code: GameErrorCode, message: string): MoveResult {
  return { ok: false, error: { code, message } };
}
