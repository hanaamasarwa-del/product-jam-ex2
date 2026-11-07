import { describe, expect, it } from "vitest";
import { RESULT_LABELS, formatPlayedAt, statusText } from "./labels";

describe("statusText", () => {
  it("says whose turn it is while the game is going", () => {
    expect(statusText(null, "X")).toBe("Turn: X");
    expect(statusText(null, "O")).toBe("Turn: O");
  });

  it("says who won", () => {
    expect(statusText("x_wins", null)).toBe("X wins!");
    expect(statusText("o_wins", null)).toBe("O wins!");
  });

  it("says when it is a draw", () => {
    expect(statusText("draw", null)).toBe("It's a draw.");
  });
});

describe("RESULT_LABELS", () => {
  it("has a label for every result the server can save", () => {
    expect(RESULT_LABELS).toEqual({
      x_wins: "X won",
      o_wins: "O won",
      draw: "Draw",
    });
  });
});

describe("formatPlayedAt", () => {
  it("formats a date and a time", () => {
    const text = formatPlayedAt("2026-11-07T12:30:00.000Z", "en");
    expect(text).toContain("2026");
    expect(text).toMatch(/\d{1,2}:\d{2}/);
  });

  it("gives an empty string for something that is not a date", () => {
    expect(formatPlayedAt("not a date", "en")).toBe("");
  });
});
