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
 * WHICH NASA API: the one the assignment names, api.nasa.gov/planetary/apod,
 * has been replaced by NASA's official WordPress endpoint (below). The old
 * one still answers, but with the same "NASA Science" logo for every date, so
 * it cannot be used. The new one needs no API key. See "What changed and why"
 * in docs/design.md.
 *
 * What the new endpoint does NOT have, so we build it here:
 *   - No "give me N random pictures". It lists everything newest-first, so we
 *     pick random positions ourselves.
 *   - No "give me this date". Entries are about one per day, newest first, so a
 *     date's position is close to "days ago", and we walk from our guess.
 *
 * NASA's answers are not ours, so every entry is checked with a Zod schema,
 * and cleaned into plain text, before anything uses it.
 */

const APOD_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic";

/** The fields we use. The full entry also has a 6 KB copy of the web page. */
const FIELDS =
  "date,title,explanation,media_type,hdurl,permalink,copyright,alt";

/** NASA never gives more than this many entries per page. */
const MAX_PER_PAGE = 25;

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

const DAY_MS = 86_400_000;

/** Whole days from `from` to `to`, both "YYYY-MM-DD". */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

/**
 * The title and explanation NASA has for one date, as plain text.
 *
 * Entries are newest-first and about one per day, with a handful of missing
 * days over 30 years. So "days since this date" is a close guess at the
 * position, off by a few. We fetch the page at the guess and look at its
 * dates: if ours is not there but the page is too new or too old, we jump the
 * right number of days and look again. A date that falls inside a page's range
 * and is still not there is a day NASA never published (404).
 */
export async function fetchPictureText(date: string): Promise<PictureText> {
  const today = new Date().toISOString().slice(0, 10);
  let position = Math.max(0, daysBetween(date, today));

  // Three looks is plenty: the guess is off by at most about ten days.
  for (let attempt = 0; attempt < 3; attempt++) {
    const page = Math.floor(position / MAX_PER_PAGE) + 1;
    const { entries } = await fetchPage(MAX_PER_PAGE, page);

    const parsed = entries.flatMap((item) => parseEntry(item) ?? []);
    if (parsed.length === 0) {
      // Past the end of the archive.
      throw new UpstreamError("nasa", "not_found", "past the end");
    }

    const match = parsed.find((entry) => entry.date === date);
    if (match) {
      const text = entryText(match);
      if (!text) {
        throw new UpstreamError(
          "nasa",
          "invalid_response",
          "entry has no text",
        );
      }
      return text;
    }

    const newest = parsed[0]!.date;
    const oldest = parsed[parsed.length - 1]!.date;
    const pageStart = (page - 1) * MAX_PER_PAGE;
    if (date > newest) {
      // Newer than the very newest entry: NASA has not published it yet.
      if (page === 1) {
        throw new UpstreamError("nasa", "not_found", "not published yet");
      }
      // Our date is newer than this page: it is further up the list.
      position = Math.max(0, pageStart - daysBetween(newest, date));
    } else if (date < oldest) {
      // A short page is the last one: nothing is older than this.
      if (entries.length < MAX_PER_PAGE) {
        throw new UpstreamError("nasa", "not_found", "before the archive");
      }
      // Our date is older than this page: further down.
      position = pageStart + parsed.length - 1 + daysBetween(date, oldest);
    } else {
      // Inside this page's dates, but not in it: a day with no picture.
      throw new UpstreamError("nasa", "not_found", "no entry for that date");
    }
  }
  throw new UpstreamError("nasa", "unavailable", "could not find the date");
}
