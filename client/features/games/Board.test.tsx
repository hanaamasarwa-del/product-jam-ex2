import { newGame, playMove, replay, type GameState } from "@shared/game/rules";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Board } from "./Board";

/*
 * There is no browser in these tests, so we render the board to a string and
 * read the HTML. That is enough to check what each cell says and which ones
 * can be clicked. (The click itself is one line, `onClick`.)
 */

function render(state: GameState) {
  return renderToStaticMarkup(
    <Board
      board={state.board}
      winningLine={state.winningLine}
      disabled={state.result !== null}
      onCellClick={() => {}}
    />,
  );
}

/** Pulls the opening tag of each cell button out of the HTML. */
function cells(html: string) {
  return html.match(/<button[^>]*>/g) ?? [];
}

describe("Board", () => {
  it("draws 16 cells, all empty and playable at the start", () => {
    const html = render(newGame());
    const buttons = cells(html);
    expect(buttons).toHaveLength(16);
    expect(buttons.every((tag) => tag.includes("disabled"))).toBe(false);
    expect(html).toContain('aria-label="Row 1, column 1: empty"');
    expect(html).toContain('aria-label="Row 4, column 4: empty"');
  });

  it("shows the marks and stops them being clicked", () => {
    const first = playMove(newGame(), 5);
    if (!first.ok) throw new Error("setup");
    const second = playMove(first.state, 6);
    if (!second.ok) throw new Error("setup");

    const buttons = cells(render(second.state));
    // Cell 5 is row 2, column 2.
    expect(buttons[5]).toContain('aria-label="Row 2, column 2: X"');
    expect(buttons[5]).toContain("disabled");
    expect(buttons[6]).toContain('aria-label="Row 2, column 3: O"');
    expect(buttons[6]).toContain("disabled");
    expect(buttons[7]).not.toContain("disabled");
  });

  it("highlights the three winning cells and disables the whole board", () => {
    const result = replay([0, 4, 1, 5, 2]);
    if (!result.ok) throw new Error("setup");

    const buttons = cells(render(result.state));
    const winning = buttons
      .map((tag, cell) => (tag.includes("data-winning") ? cell : -1))
      .filter((cell) => cell !== -1);
    expect(winning).toEqual([0, 1, 2]);
    expect(buttons.every((tag) => tag.includes("disabled"))).toBe(true);
  });

  it("does not highlight anything after a draw", () => {
    const result = replay([
      0, 2, 1, 3, 6, 4, 7, 5, 8, 10, 9, 11, 14, 12, 15, 13,
    ]);
    if (!result.ok) throw new Error("setup");

    const html = render(result.state);
    expect(html).not.toContain("data-winning");
    expect(cells(html).every((tag) => tag.includes("disabled"))).toBe(true);
  });
});
