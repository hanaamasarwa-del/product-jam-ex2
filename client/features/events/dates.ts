/*
 * The browser's <input type="datetime-local"> speaks "2026-09-21T18:30" in
 * the visitor's own timezone. The database speaks ISO strings in UTC. These
 * two functions translate, and exist so that conversion lives in one place
 * rather than being re-invented in every form.
 */

/** ISO string from the server -> value for <input type="datetime-local">. */
export function isoToLocalInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  // Shift by the timezone offset so toISOString() prints local wall-clock
  // time, then keep only "YYYY-MM-DDTHH:mm".
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

/** Value from <input type="datetime-local"> -> ISO string for the server. */
export function localInputToIso(value: string): string {
  // `new Date("2026-09-21T18:30")` is read as local time, which is what the
  // visitor typed, and toISOString() converts it to UTC.
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

/** A human-readable date, in the app's language. */
export function formatEventDate(iso: string, lang: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(lang, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}
