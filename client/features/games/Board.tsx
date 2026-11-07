import { BOARD_SIZE, type Cell } from "@shared/game/rules";
import type { CSSProperties } from "react";
import styles from "./Board.module.css";

type BoardProps = {
  board: readonly Cell[];
  /** The three cells that won, to highlight. `null` if there is no winner. */
  winningLine: readonly number[] | null;
  /** True once the game is over: nothing can be clicked any more. */
  disabled: boolean;
  onCellClick: (cell: number) => void;
};

/**
 * Draws the board. It knows nothing about the rules: it shows the cells it is
 * given and says which one was clicked. Everything about what a move MEANS
 * lives in shared/game/rules.ts.
 */
export function Board({
  board,
  winningLine,
  disabled,
  onCellClick,
}: BoardProps) {
  return (
    <div
      role="group"
      aria-label="Game board"
      className={styles.board}
      style={{ "--size": BOARD_SIZE } as CSSProperties}
    >
      {board.map((mark, cell) => {
        const row = Math.floor(cell / BOARD_SIZE) + 1;
        const column = (cell % BOARD_SIZE) + 1;
        return (
          <button
            key={cell}
            type="button"
            className={styles.cell}
            data-player={mark ?? undefined}
            data-winning={winningLine?.includes(cell) || undefined}
            disabled={disabled || mark !== null}
            aria-label={`Row ${row}, column ${column}: ${mark ?? "empty"}`}
            onClick={() => onCellClick(cell)}
          >
            {mark}
          </button>
        );
      })}
    </div>
  );
}
