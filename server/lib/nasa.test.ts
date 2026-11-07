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
 * one does, so the random picking and the date search are tested for real.
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
  it("finds today's picture", async () => {
    const date = archive[0]!.date;
    expect(await fetchPictureText(date)).toEqual({
      title: `Picture of ${date}`,
      explanation: `NASA's description of the picture from ${date}.`,
    });
  });

  it("finds a date from 2024 and cleans the text", async () => {
    expect(await fetchPictureText("2024-03-15")).toEqual({
      title: "Picture of 2024-03-15",
      explanation: "NASA's description of the picture from 2024-03-15.",
    });
    expect(await fetchPictureText("2024-03-11")).toMatchObject({
      title: "HFG1 & Abell 6: Planetary Nebulae",
    });
  });

  it("finds the very first picture", async () => {
    expect(await fetchPictureText("1995-06-16")).toMatchObject({
      title: "Picture of 1995-06-16",
    });
  });

  it("finds videos and interactive entries too, since only the words matter", async () => {
    expect((await fetchPictureText("2024-03-14")).title).toBe(
      "Picture of 2024-03-14",
    );
    expect((await fetchPictureText("2024-03-12")).title).toBe(
      "APOD: 2024 March 12 – Interactive",
    );
  });

  it("finds dates on both sides of a missing day", async () => {
    for (const date of [
      "2020-06-09",
      "2020-06-11",
      "2000-07-01",
      "2000-06-29",
    ]) {
      expect((await fetchPictureText(date)).title, date).toBe(
        `Picture of ${date}`,
      );
    }
  });

  it("finds the right picture for dates all across the archive, in at most 3 requests", async () => {
    const dates = archive
      .filter((_, index) => index % 61 === 0)
      .map((entry) => entry.date);
    expect(dates.length).toBeGreaterThan(150);
    for (const date of dates) {
      nasa.requests.length = 0;
      expect((await fetchPictureText(date)).title, date).toBe(
        `Picture of ${date}`,
      );
      expect(nasa.requests.length, date).toBeLessThanOrEqual(3);
    }
  });

  it("usually needs only one request", async () => {
    nasa.requests.length = 0;
    await fetchPictureText("2024-03-15");
    expect(nasa.requests.length).toBeLessThanOrEqual(2);
  });

  it("sends no API key, and asks for 25 entries of only the fields it uses", async () => {
    await fetchPictureText("2024-03-15");
    for (const { url, perPage, fields } of nasa.requests) {
      expect(url.search).not.toMatch(/api_key|key=/i);
      expect(perPage).toBe(25);
      expect(fields).toContain("explanation");
      expect(fields).not.toContain("basic_html");
    }
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

  it("says not_found for a day after the newest entry", async () => {
    const tomorrow = new Date(Date.now() + 86_400_000)
      .toISOString()
      .slice(0, 10);
    expect(await failure(fetchPictureText(tomorrow))).toMatchObject({
      kind: "not_found",
    });
  });

  it("says not_found for a date before the archive starts", async () => {
    expect(await failure(fetchPictureText("1995-06-15"))).toMatchObject({
      kind: "not_found",
    });
  });

  it("uses the first entry when a date appears twice", async () => {
    const date = "2022-02-02";
    const index = archive.findIndex((entry) => entry.date === date);
    const copy = makeEntry(date, { title: "The duplicate" });
    serve([...archive.slice(0, index + 1), copy, ...archive.slice(index + 1)]);
    expect((await fetchPictureText(date)).title).toBe(`Picture of ${date}`);
  });

  it("skips junk in a page and still finds the date", async () => {
    const date = "2024-03-15";
    const index = archive.findIndex((entry) => entry.date === date);
    const junk = { nope: true } as unknown as FakeEntry;
    serve([
      ...archive.slice(0, index),
      junk,
      archive[index]!,
      ...archive.slice(index + 1),
    ]);
    expect((await fetchPictureText(date)).title).toBe(`Picture of ${date}`);
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
      Response.json({ not: "a list" })) as typeof fetch;
    expect(await failure(fetchPictureText("2024-03-15"))).toMatchObject({
      kind: "invalid_response",
    });
  });
});
