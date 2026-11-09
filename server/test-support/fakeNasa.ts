/*
 * A stand-in for NASA's official APOD endpoint
 * (https://science.nasa.gov/wp-json/wp/v2/apod-basic), for tests only.
 *
 * It behaves like the real one, as measured against it:
 *   - one entry per day, NEWEST FIRST, from today back to 1995-06-16
 *   - a few days with no entry, so a date's position is only roughly "days ago"
 *   - `per_page` is capped at 25; `page` counts from 1; `_fields` trims entries
 *   - `x-wp-total` says how many entries exist
 *   - a page past the end is an empty list
 *   - title / explanation / copyright are HTML, `url` is the ARTICLE page and
 *     `hdurl` is the picture
 *   - one entry at `.../apod-basic/YYMMDD`: an object, 404 `apod_basic_not_found`
 *     for a day with no entry (or in the future), 400 for a date that is not real
 * and it ignores everything else (date, count, orderby...), as the real one does.
 */

export type FakeEntry = Record<string, unknown> & { date: string };

const DAY_MS = 86_400_000;

/** The days the real archive has no entry for. */
export const MISSING_DATES = new Set([
  "1995-06-17",
  "1995-06-18",
  "1995-06-19",
  "2000-06-30",
  "2004-12-29",
  "2007-07-13",
  "2018-04-01",
  "2020-06-10",
  "2020-11-30",
]);

export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** An entry shaped like NASA's, with HTML in the text fields. */
export function makeEntry(date: string, overrides: Partial<FakeEntry> = {}) {
  const permalink = `https://science.nasa.gov/image-article/apod-${date}/`;
  return {
    date,
    post_id: Number(date.replaceAll("-", "")),
    title: `Picture of ${date}`,
    permalink,
    media_type: "image",
    explanation: `<strong>Explanation:</strong> NASA's description of the picture from ${date}.<br><br><strong>Tomorrow's picture: </strong>something`,
    credit: `<a href="https://example.org">Photographer</a>`,
    copyright: `<a href="https://example.org">Photographer of ${date}</a>`,
    alt: `Alt text for ${date}`,
    url: permalink,
    hdurl: `https://assets.science.nasa.gov/apod/${date}.jpg?w=1500`,
    basic_html: "<!doctype html><html>a whole web page</html>",
    ...overrides,
  } as FakeEntry;
}

/**
 * Every day from today back to 1995-06-16, newest first, minus the missing
 * days. `overrides` changes particular dates.
 */
export function makeArchive(
  overrides: Record<string, Partial<FakeEntry>> = {},
): FakeEntry[] {
  const entries: FakeEntry[] = [];
  const last = Date.parse("1995-06-16");
  for (let time = Date.parse(todayUtc()); time >= last; time -= DAY_MS) {
    const date = new Date(time).toISOString().slice(0, 10);
    if (MISSING_DATES.has(date)) continue;
    entries.push(makeEntry(date, overrides[date]));
  }
  return entries;
}

/** What one request to the fake looked like. */
export type FakeRequest = {
  url: URL;
  /** The YYMMDD at the end of the URL, for a one-entry request. */
  code: string | null;
  perPage: number;
  page: number;
  fields: string[] | null;
};

/**
 * A `fetch`-style handler serving `entries`. Records every request in
 * `requests`, so a test can check how many there were and what they asked for.
 */
export function fakeNasa(entries: FakeEntry[]) {
  const requests: FakeRequest[] = [];

  const handleOne = (url: URL, code: string, fields: string[] | null) => {
    requests.push({ url, code, perPage: 0, page: 0, fields });
    const year = Number(code.slice(0, 2));
    const date = `${year >= 95 ? 1900 + year : 2000 + year}-${code.slice(2, 4)}-${code.slice(4, 6)}`;
    const real = new Date(`${date}T00:00:00Z`);
    if (
      Number.isNaN(real.getTime()) ||
      real.toISOString().slice(0, 10) !== date
    ) {
      return Response.json(
        { code: "rest_invalid_param", message: "Invalid parameter(s): date" },
        { status: 400 },
      );
    }
    const entry = entries.find((item) => item.date === date);
    if (!entry) {
      return Response.json(
        { code: "apod_basic_not_found", message: "APOD not found." },
        { status: 404 },
      );
    }
    return Response.json(
      fields
        ? Object.fromEntries(
            Object.entries(entry).filter(([key]) => fields.includes(key)),
          )
        : entry,
    );
  };

  const handle = (url: URL): Response => {
    const one = url.pathname.match(/\/apod-basic\/(\d{6})$/);
    if (one) {
      return handleOne(
        url,
        one[1]!,
        url.searchParams.get("_fields")?.split(",") ?? null,
      );
    }
    const perPage = Math.min(
      25,
      Number(url.searchParams.get("per_page") ?? 25),
    );
    const page = Number(url.searchParams.get("page") ?? 1);
    const fields = url.searchParams.get("_fields")?.split(",") ?? null;
    requests.push({ url, code: null, perPage, page, fields });

    const slice = entries
      .slice((page - 1) * perPage, page * perPage)
      .map((entry) =>
        fields
          ? Object.fromEntries(
              Object.entries(entry).filter(([key]) => fields.includes(key)),
            )
          : entry,
      );
    return Response.json(slice, {
      headers: {
        "x-wp-total": String(entries.length),
        "x-wp-totalpages": String(Math.ceil(entries.length / perPage)),
      },
    });
  };

  return { handle, requests };
}
