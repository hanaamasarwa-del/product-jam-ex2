import type { GameResult, Player } from "@shared/game/rules";

/*
 * The words the game screen uses. Kept out of the components so they can be
 * tested, and so the wording lives in one place.
 */

/** How a saved game's result reads in the list of past games. */
export const RESULT_LABELS: Record<GameResult, string> = {
  x_wins: "X won",
  o_wins: "O won",
  draw: "Draw",
};

/** The line above the board: whose turn it is, or how the game ended. */
export function statusText(
  result: GameResult | null,
  next: Player | null,
): string {
  if (result === "x_wins") return "X wins!";
  if (result === "o_wins") return "O wins!";
  if (result === "draw") return "It's a draw.";
  return `Turn: ${next ?? "X"}`;
}

/** A readable date and time, in the app's language. "" if it is not a date. */
export function formatPlayedAt(iso: string, lang: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
