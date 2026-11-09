import {
  nasaWpEntrySchema,
  type NasaPicture,
  type NasaWpEntry,
} from "@shared/schemas/nasa";
import { entryText, toPicture } from "./apodText";
import { UpstreamError, callUpstream, readJson } from "./upstream";

/*
 * Talking to NASA's Astronomy Picture of the Day (APOD).
 *
 * WHICH NASA API: NASA's official WordPress endpoint (below), which is the one
 * the updated assignment names. It replaces api.nasa.gov/planetary/apod, which
 * still answers but with the same "NASA Science" logo for every date, so it
 * cannot be used. The new one needs no API key. See "What changed and why" in
 * docs/design.md.
 *
 * How we use it:
 *   - Random pictures: the list has no "give me N random pictures", so we ask
 *     how many entries exist (`X-WP-Total`) and then fetch single entries at
 *     random `page` numbers with `per_page=1`.
 *   - One date: the entry for a date is at the URL with the date appended as
 *     YYMMDD, like .../apod-basic/240315. One request, no searching.
 *
 * NASA's answers are not ours, so every entry is checked with a Zod schema,
 * and cleaned into plain text, before anything uses it.
 */

const APOD_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic";

/** The fields we use. The full entry also has a 6 KB copy of the web page. */
const FIELDS =
  "date,title,explanation,media_type,hdurl,permalink,copyright,alt";

const REQUEST_TIMEOUT_MS = 10_000;

/** Fetches one page of entries. Returns them with the total NASA reports. */
async function fetchPage(
  perPage: number,
  page: number,
  fields = FIELDS,
): Promise<{ entries: unknown[]; total: number }> {
  const url = new URL(APOD_URL);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  url.searchParams.set("_fields", fields);

  const response = await callUpstream("nasa", url, {}, REQUEST_TIMEOUT_MS);
  if (!response.ok) {
    throw new UpstreamError("nasa", "unavailable", `status ${response.status}`);
  }
  const body = await readJson("nasa", response);
  if (!Array.isArray(body)) {
    throw new UpstreamError("nasa", "invalid_response", "not a list");
  }
  const total = Number(response.headers.get("x-wp-total"));
  return { entries: body, total };
}

/** An entry that passes the schema, or `null`. */
function parseEntry(item: unknown): NasaWpEntry | null {
  const parsed = nasaWpEntrySchema.safeParse(item);
  return parsed.success ? parsed.data : null;
}

/** `count` different whole numbers from 1 to `max`, in random order. */
function randomPages(count: number, max: number): number[] {
  const chosen = new Set<number>();
  while (chosen.size < Math.min(count, max)) {
    chosen.add(1 + Math.floor(Math.random() * max));
  }
  return [...chosen];
}

/**
 * Up to `count` random pictures from the whole archive.
 *
 * One small request tells us how many entries exist; then we ask for `count`
 * entries at random positions, all at once. If a few of those requests fail,
 * the rest are still shown. Entries we cannot show are left out.
 */
export async function fetchRandomPictures(
  count: number,
): Promise<NasaPicture[]> {
  const { total } = await fetchPage(1, 1, "date");
  if (!Number.isInteger(total) || total < 1) {
    throw new UpstreamError("nasa", "invalid_response", "no total");
  }

  const results = await Promise.allSettled(
    randomPages(count, total).map((page) => fetchPage(1, page)),
  );

  const failures = results.filter((result) => result.status === "rejected");
  // Every request failed: say why (too slow, or down), not "no pictures".
  if (failures.length === results.length) throw failures[0]?.reason;

  const seen = new Set<string>();
  const pictures: NasaPicture[] = [];
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const item of result.value.entries) {
      const entry = parseEntry(item);
      const picture = entry ? toPicture(entry) : null;
      if (picture && !seen.has(picture.date)) {
        seen.add(picture.date);
        pictures.push(picture);
      }
    }
  }
  if (pictures.length === 0) {
    throw new UpstreamError("nasa", "invalid_response", "no usable pictures");
  }
  return pictures;
}

export type PictureText = { title: string; explanation: string };

/** The first day APOD has a picture for. Nothing exists before it. */
const FIRST_APOD_DATE = "1995-06-16";

/**
 * "2024-03-15" to "240315", the form NASA wants at the end of the URL. Two
 * digits are enough because the archive starts in 1995: 95 to 99 are the
 * 1990s and 00 to 94 are the 2000s.
 */
function toYymmdd(date: string): string {
  return date.slice(2).replaceAll("-", "");
}

/**
 * The title and explanation NASA has for one date, as plain text.
 *
 * It asks for that one entry directly: GET .../apod-basic/YYMMDD. NASA answers
 * 404 for a date with no entry (in the future, or a day it never published), so
 * that becomes `not_found`. The text is cleaned of HTML before it is returned,
 * because it goes to Gemini and from there to the page.
 */
export async function fetchPictureText(date: string): Promise<PictureText> {
  // Two-digit years would also match a date before 1995 (1990 looks like 2090),
  // so a date before the archive is turned away here, without asking NASA.
  if (date < FIRST_APOD_DATE) {
    throw new UpstreamError("nasa", "not_found", "before the archive");
  }

  const url = new URL(`${APOD_URL}/${toYymmdd(date)}`);
  url.searchParams.set("_fields", FIELDS);

  const response = await callUpstream("nasa", url, {}, REQUEST_TIMEOUT_MS);
  if (response.status === 404) {
    throw new UpstreamError("nasa", "not_found", "no entry for that date");
  }
  if (!response.ok) {
    throw new UpstreamError("nasa", "unavailable", `status ${response.status}`);
  }

  const entry = parseEntry(await readJson("nasa", response));
  // A single entry is an object, not a list. If it is something else, or it is
  // for another day than the one we asked for, it is not what we can use.
  if (!entry || entry.date !== date) {
    throw new UpstreamError(
      "nasa",
      "invalid_response",
      "not the entry asked for",
    );
  }

  const text = entryText(entry);
  if (!text) {
    throw new UpstreamError("nasa", "invalid_response", "entry has no text");
  }
  return text;
}
