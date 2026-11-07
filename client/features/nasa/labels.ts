/*
 * The small pieces of wording and formatting the NASA screen uses, kept out of
 * the components so they can be tested.
 */

/**
 * A picture's date as a person reads it. The dates are calendar days, not
 * moments, so they are read as UTC: "2024-03-15" is the 15th everywhere.
 * Anything that is not a date comes back as it was.
 */
export function formatPictureDate(date: string, lang: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(lang, {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(parsed);
}

const OFFLINE_MESSAGE =
  "Could not reach the server. Check your connection and try again.";

/**
 * Words to show for a failed request. The server's own messages are written
 * for people ("We could not get pictures from NASA right now..."), so they are
 * shown as they are. Anything else (like the browser being offline) gets a
 * plain sentence instead of "Failed to fetch".
 */
export function errorText(error: unknown): string {
  if (
    error instanceof Error &&
    error.name === "ApiRequestError" &&
    error.message
  ) {
    return error.message;
  }
  return OFFLINE_MESSAGE;
}

/** Is this the server saying another request is already explaining the date? */
export function isExplanationBusy(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "ApiRequestError" &&
    (error as { code?: unknown }).code === "explanation_in_progress"
  );
}
