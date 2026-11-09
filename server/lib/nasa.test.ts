import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MISSING_DATES,
  fakeNasa,
  makeArchive,
  makeEntry,
  type FakeEntry,
} from "../test-support/fakeNasa";
import { fetchPictureText, fetchRandomPictures } from "./nasa";
import { UpstreamError } from "./upstream";

/*
 * The adapter between NASA's official APOD endpoint and our app. NASA is
 * faked (see server/test-support/fakeNasa.ts), but it pages the way the real
 * one does, so the random picking and the one-date lookup are tested for real.
 */

let archive: FakeEntry[];
let nasa: ReturnType<typeof fakeNasa>;
const realFetch = globalThis.fetch;

function serve(entries: FakeEntry[]) {
  nasa = fakeNasa(entries);
  globalThis.fetch = (async (input: RequestInfo | URL) =>
    nasa.handle(new URL(String(input)))) as typeof fetch;
}

beforeEach(() => {
  archive = makeArchive({
    "2024-03-14": { media_type: "video" },
    "2024-03-13": { media_type: "iframe" },
    "2024-03-12": {
      media_type: null,
      title: "APOD: 2024 March 12 &#8211; Interactive",
    },
    "2024-03-11": { title: "HFG1 &amp; Abell 6: Planetary Nebulae" },
  });
  serve(archive);
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

async function failure(promise: Promise<unknown>): Promise<UpstreamError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof UpstreamError) return error;
    throw error;
  }
  throw new Error("expected it to fail");
}

describe("fetchRandomPictures", () => {
  it("makes one request for the total, then one per picture", async () => {
    const pictures = await fetchRandomPictures(5);
    expect(pictures).toHaveLength(5);
    expect(nasa.requests).toHaveLength(6);
    expect(nasa.requests[0]).toMatchObject({
      perPage: 1,
      page: 1,
      fields: ["date"],
    });
    for (const request of nasa.requests.slice(1)) {
      expect(request.perPage).toBe(1);
      expect(request.page).toBeGreaterThanOrEqual(1);
      expect(request.page).toBeLessThanOrEqual(archive.length);
    }
  });

  it("asks for 20 different places in the archive", async () => {
    const pictures = await fetchRandomPictures(20);
    expect(pictures).toHaveLength(20);
    const pages = nasa.requests.slice(1).map((request) => request.page);
    expect(new Set(pages).size).toBe(20);
    expect(new Set(pictures.map((picture) => picture.date)).size).toBe(20);
  });

  it("picks from the whole archive, not just the newest days", async () => {
    const dates: string[] = [];
    for (let i = 0; i < 10; i++) {
      dates.push(
        ...(await fetchRandomPictures(20)).map((picture) => picture.date),
      );
    }
    expect(dates.some((date) => date < "2010-01-01")).toBe(true);
    expect(dates.some((date) => date > "2015-01-01")).toBe(true);
  });

  it("sends no API key, and asks only for the fields it uses", async () => {
    await fetchRandomPictures(3);
    for (const { url, fields } of nasa.requests) {
      expect(url.host).toBe("science.nasa.gov");
      expect(url.pathname).toBe("/wp-json/wp/v2/apod-basic");
      expect(url.search).not.toMatch(/api_key|key=/i);
      expect(fields).not.toContain("basic_html");
    }
  });

  it("gives pictures in the app's shape: plain text, image from hdurl", async () => {
    const [picture] = await fetchRandomPictures(1);
    expect(picture).toMatchObject({
      media_type: "image",
      title: `Picture of ${picture!.date}`,
      explanation: `NASA's description of the picture from ${picture!.date}.`,
      url: `https://assets.science.nasa.gov/apod/${picture!.date}.jpg?w=1500`,
      link: `https://science.nasa.gov/image-article/apod-${picture!.date}/`,
    });
    expect(JSON.stringify(picture)).not.toMatch(/<|Tomorrow|Explanation:/);
  });

  it("leaves out entries it cannot show and keeps the rest", async () => {
    serve(
      archive.map((entry, index) =>
        index % 2 === 0 ? { ...entry, media_type: null } : entry,
      ),
    );
    const pictures = await fetchRandomPictures(20);
    expect(pictures.length).toBeGreaterThan(0);
    expect(pictures.length).toBeLessThan(20);
  });

  it("keeps the pictures that arrived when some requests fail", async () => {
    let calls = 0;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls++;
      // The first call finds the total; fail every third call after it.
      if (calls > 1 && calls % 3 === 0)
        return new Response("no", { status: 503 });
      return nasa.handle(new URL(String(input)));
    }) as typeof fetch;
    const pictures = await fetchRandomPictures(9);
    expect(pictures.length).toBeGreaterThan(0);
    expect(pictures.length).toBeLessThan(9);
  });

  it("fails when NASA is down", async () => {
    globalThis.fetch = (async () =>
      new Response("down", { status: 503 })) as typeof fetch;
    const error = await failure(fetchRandomPictures(5));
    expect(error).toMatchObject({ service: "nasa", kind: "unavailable" });
  });

  it("fails with a timeout when every request is too slow", async () => {
    let calls = 0;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls++;
      if (calls === 1) return nasa.handle(new URL(String(input)));
      throw new DOMException("too slow", "TimeoutError");
    }) as typeof fetch;
    expect(await failure(fetchRandomPictures(5))).toMatchObject({
      kind: "timeout",
    });
  });

  it("fails when NASA does not say how many entries there are", async () => {
    globalThis.fetch = (async () =>
      Response.json([{ date: "2024-01-01" }])) as typeof fetch;
    expect(await failure(fetchRandomPictures(5))).toMatchObject({
      kind: "invalid_response",
    });
  });

  it("fails when NASA does not send a list", async () => {
    globalThis.fetch = (async () =>
      Response.json(
        { code: "rest_error" },
        { headers: { "x-wp-total": "5" } },
      )) as typeof fetch;
    expect(await failure(fetchRandomPictures(5))).toMatchObject({
      kind: "invalid_response",
    });
  });

  it("fails when none of the entries can be shown", async () => {
    serve(archive.map((entry) => ({ ...entry, hdurl: null })));
    expect(await failure(fetchRandomPictures(5))).toMatchObject({
      kind: "invalid_response",
    });
  });

  it("copes with a small archive and asks for no more than exist", async () => {
    serve(archive.slice(0, 3));
    const pictures = await fetchRandomPictures(20);
    expect(pictures).toHaveLength(3);
  });
});

describe("fetchPictureText", () => {
  it("asks for one entry, at the URL with the date as YYMMDD", async () => {
    await fetchPictureText("2024-03-15");
    expect(nasa.requests).toHaveLength(1);
    const { url, code } = nasa.requests[0]!;
    expect(code).toBe("240315");
    expect(url.pathname).toBe("/wp-json/wp/v2/apod-basic/240315");
  });

  it("writes the year, month and day with two digits each", async () => {
    for (const [date, code] of [
      ["2000-01-02", "000102"],
      ["1995-06-16", "950616"],
      ["2009-12-31", "091231"],
      ["1999-09-09", "990909"],
    ] as const) {
      nasa.requests.length = 0;
      await fetchPictureText(date);
      expect(nasa.requests[0]!.code, date).toBe(code);
    }
  });

  it("returns the title and explanation as plain text, with no HTML", async () => {
    const text = await fetchPictureText("2024-03-15");
    expect(text).toEqual({
      title: "Picture of 2024-03-15",
      explanation: "NASA's description of the picture from 2024-03-15.",
    });
    expect(JSON.stringify(text)).not.toMatch(/<|&amp;|Explanation:|Tomorrow/);
    expect(await fetchPictureText("2024-03-11")).toMatchObject({
      title: "HFG1 & Abell 6: Planetary Nebulae",
    });
  });

  it("finds today's picture and the very first one", async () => {
    const today = archive[0]!.date;
    expect((await fetchPictureText(today)).title).toBe(`Picture of ${today}`);
    expect((await fetchPictureText("1995-06-16")).title).toBe(
      "Picture of 1995-06-16",
    );
  });

  it("finds videos and interactive entries too, since only the words matter", async () => {
    expect((await fetchPictureText("2024-03-14")).title).toBe(
      "Picture of 2024-03-14",
    );
    expect((await fetchPictureText("2024-03-12")).title).toBe(
      "APOD: 2024 March 12 – Interactive",
    );
  });

  it("finds dates all across the archive with exactly one request each", async () => {
    const dates = archive
      .filter((_, index) => index % 61 === 0)
      .map((entry) => entry.date);
    expect(dates.length).toBeGreaterThan(150);
    for (const date of dates) {
      nasa.requests.length = 0;
      expect((await fetchPictureText(date)).title, date).toBe(
        `Picture of ${date}`,
      );
      expect(nasa.requests.length, date).toBe(1);
    }
  });

  it("sends no API key, and asks only for the fields it uses", async () => {
    await fetchPictureText("2024-03-15");
    const { url, fields } = nasa.requests[0]!;
    expect(url.search).not.toMatch(/api_key|key=/i);
    expect(fields).toContain("explanation");
    expect(fields).not.toContain("basic_html");
  });

  it("says not_found for a day NASA never published", async () => {
    for (const date of [
      "2020-06-10",
      "2000-06-30",
      "1995-06-17",
      "2018-04-01",
    ]) {
      expect(MISSING_DATES.has(date)).toBe(true);
      expect(await failure(fetchPictureText(date)), date).toMatchObject({
        service: "nasa",
        kind: "not_found",
      });
    }
  });

  it("says not_found for a day in the future", async () => {
    const tomorrow = new Date(Date.now() + 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(await failure(fetchPictureText(tomorrow))).toMatchObject({
      kind: "not_found",
    });
  });

  it("says not_found for a date before the archive, without asking NASA", async () => {
    for (const date of ["1995-06-15", "1990-01-01", "1899-12-31"]) {
      nasa.requests.length = 0;
      expect(await failure(fetchPictureText(date)), date).toMatchObject({
        kind: "not_found",
      });
      expect(nasa.requests, date).toHaveLength(0);
    }
  });

  it("does not accept an entry for another day than the one asked for", async () => {
    globalThis.fetch = (async () =>
      Response.json(makeEntry("2024-03-16"))) as typeof fetch;
    expect(await failure(fetchPictureText("2024-03-15"))).toMatchObject({
      kind: "invalid_response",
    });
  });

  it("fails when the entry has no usable text", async () => {
    serve(
      archive.map((entry) =>
        entry.date === "2024-03-15" ? { ...entry, explanation: "" } : entry,
      ),
    );
    expect(await failure(fetchPictureText("2024-03-15"))).toMatchObject({
      kind: "invalid_response",
    });
  });

  it("fails when NASA is down, slow, or sends rubbish", async () => {
    globalThis.fetch = (async () =>
      new Response("down", { status: 500 })) as typeof fetch;
    expect(await failure(fetchPictureText("2024-03-15"))).toMatchObject({
      kind: "unavailable",
    });

    // NASA answering 400 for a date it does not understand is a failure too,
    // not "no picture".
    globalThis.fetch = (async () =>
      new Response("{}", { status: 400 })) as typeof fetch;
    expect(await failure(fetchPictureText("2024-03-15"))).toMatchObject({
      kind: "unavailable",
    });

    globalThis.fetch = (async () => {
      throw new DOMException("too slow", "TimeoutError");
    }) as typeof fetch;
    expect(await failure(fetchPictureText("2024-03-15"))).toMatchObject({
      kind: "timeout",
    });

    globalThis.fetch = (async () =>
      new Response("<html>maintenance</html>")) as typeof fetch;
    expect(await failure(fetchPictureText("2024-03-15"))).toMatchObject({
      kind: "invalid_response",
    });

    globalThis.fetch = (async () =>
      Response.json([makeEntry("2024-03-15")])) as typeof fetch;
    expect(await failure(fetchPictureText("2024-03-15"))).toMatchObject({
      kind: "invalid_response",
    });
  });
});
