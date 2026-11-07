import { z } from "zod";

/*
 * The shapes of the data in the NASA feature, written once for both sides.
 *
 * There are THREE kinds of data here, and the difference matters:
 *
 *   1. What NASA sends us.      Not ours; check it before using it.
 *   2. What Gemini sends us.    An LLM; it does not always do as it is told,
 *                               so check it too. Never save it unchecked.
 *   3. What our own API sends   The browser's view, and what the browser
 *      and receives.            sends us. The server checks every request.
 *
 * The rule for 1 and 2: anything that comes from another server is untrusted
 * until a schema here says it is fine.
 */

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** The first Astronomy Picture of the Day was published on this date. */
export const FIRST_APOD_DATE = "1995-06-16";

/** Today's date in UTC, as "YYYY-MM-DD". */
function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

/** True for a real calendar date written as "YYYY-MM-DD" ("2024-02-30" is not). */
function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/**
 * A picture date: a real "YYYY-MM-DD" date, from the first APOD up to today.
 * Used for what the browser sends. Because it checks "up to today", it reads
 * the clock when it runs.
 */
export const apodDateSchema = z
  .string("The date must be text like 2024-03-15")
  .refine(isRealDate, "The date must be a real date like 2024-03-15")
  .refine(
    (value) => value >= FIRST_APOD_DATE,
    `There are no pictures before ${FIRST_APOD_DATE}`,
  )
  .refine((value) => value <= todayUtc(), "That date is in the future");

// ---------------------------------------------------------------------------
// 1. What NASA sends us
// ---------------------------------------------------------------------------

/**
 * A link we are willing to put in the page: https, and on nasa.gov. NASA's data
 * ends up in `<img src>` and `<a href>`, so anything else (a `javascript:`
 * link, a picture hosted somewhere odd) is refused.
 */
const nasaLink = z.url({
  protocol: /^https$/,
  hostname: /(^|\.)nasa\.gov$/,
});

/**
 * One entry as NASA's official APOD endpoint sends it:
 * https://science.nasa.gov/wp-json/wp/v2/apod-basic
 * (It replaced api.nasa.gov/planetary/apod, which now returns the same
 * placeholder for every date.)
 *
 * Careful, it is NOT shaped like the old API:
 *   - `hdurl` is the image. `url` is the article page, not a picture.
 *   - `title`, `explanation`, `copyright` are HTML, with entities like &amp;.
 *   - `media_type` is image, video, iframe, or null for interactive pages.
 *
 * We read only the fields below; anything else is dropped. The server turns
 * this into `nasaPictureSchema`, which is what the rest of the app uses.
 */
export const nasaWpEntrySchema = z.object({
  date: z.string().refine(isRealDate, "NASA sent a bad date"),
  title: z.string(),
  explanation: z.string(),
  media_type: z.string().nullish(),
  hdurl: z.string().nullish(),
  permalink: z.string().nullish(),
  copyright: z.string().nullish(),
  alt: z.string().nullish(),
});

export type NasaWpEntry = z.infer<typeof nasaWpEntrySchema>;

/**
 * One picture, cleaned up: plain text instead of HTML, and the same field names
 * the old API used. This is what our server sends the browser.
 *
 * `url` is the picture to show. For a video it is a still image, and `link` is
 * the NASA page where the video can be watched.
 */
export const nasaPictureSchema = z.object({
  date: z.string().refine(isRealDate, "NASA sent a bad date"),
  title: z.string().min(1),
  explanation: z.string().min(1),
  media_type: z.enum(["image", "video"]),
  url: nasaLink,
  link: nasaLink.optional(),
  copyright: z.string().optional(),
  alt: z.string().optional(),
});

export type NasaPicture = z.infer<typeof nasaPictureSchema>;

// ---------------------------------------------------------------------------
// 2. What Gemini sends us
// ---------------------------------------------------------------------------

/**
 * The only tags Gemini may use. Gemini is told this list, and the answer is
 * checked against it, so a tag outside the list (including one an attacker
 * talked it into) is rejected.
 */
export const APOD_TAGS = [
  "galaxy",
  "planet",
  "nebula",
  "earth",
  "sun",
  "moon",
  "star",
  "comet",
  "black-hole",
  "spacecraft",
] as const;

export const apodTagSchema = z.enum(APOD_TAGS);
export type ApodTag = z.infer<typeof apodTagSchema>;

/** At least one letter from the Hebrew block. */
const HEBREW_LETTER = /[֐-׿]/;

/**
 * A Hebrew letter touching a Latin one, like "הראScientific". Real Hebrew puts
 * a hyphen between a prefix and a Latin name ("ב-NGC"), so this only happens
 * when the model slips an English word into the middle of a Hebrew one, which
 * we saw once in about fourteen real answers.
 */
const MIXED_SCRIPT_WORD = /[֐-׿][A-Za-z]|[A-Za-z][֐-׿]/;

/**
 * What we ask Gemini to write: a Hebrew title, a short Hebrew summary, and 1
 * to 5 tags from the list.
 *
 * Structured output asks Gemini for JSON in this shape, but that is a request,
 * not a promise. This schema is the check. If it fails, we tell the user and
 * save nothing.
 */
export const geminiExplanationSchema = z.object({
  title_he: z
    .string()
    .trim()
    .min(1, "The Hebrew title is empty")
    .max(200, "The Hebrew title is too long")
    .refine((text) => HEBREW_LETTER.test(text), "The title is not in Hebrew")
    .refine(
      (text) => !MIXED_SCRIPT_WORD.test(text),
      "The title mixes English letters into Hebrew words",
    ),
  summary_he: z
    .string()
    .trim()
    .min(1, "The Hebrew summary is empty")
    .max(1000, "The Hebrew summary is too long")
    .refine((text) => HEBREW_LETTER.test(text), "The summary is not in Hebrew")
    .refine(
      (text) => !MIXED_SCRIPT_WORD.test(text),
      "The summary mixes English letters into Hebrew words",
    ),
  tags: z
    .array(apodTagSchema, "The tags must be a list")
    .min(1, "There must be at least 1 tag")
    .max(5, "There can be at most 5 tags")
    // Gemini may repeat a tag. Keep each one once rather than failing.
    .transform((tags) => [...new Set(tags)]),
});

export type GeminiExplanation = z.infer<typeof geminiExplanationSchema>;

// ---------------------------------------------------------------------------
// 3. Our own API
// ---------------------------------------------------------------------------

/** A finished explanation, as the API returns it. */
export const hebrewExplanationSchema = z.object({
  title_he: z.string(),
  summary_he: z.string(),
  tags: z.array(apodTagSchema),
});

export type HebrewExplanation = z.infer<typeof hebrewExplanationSchema>;

/** The saved explanation for one date: `POST /api/nasa/explanations` answers with this. */
export const explanationSchema = hebrewExplanationSchema.extend({
  date: z.string(),
});

export type Explanation = z.infer<typeof explanationSchema>;

/**
 * One picture card, as `GET /api/nasa/pictures` returns it: NASA's picture,
 * plus the Hebrew explanation if that date already has one (`null` if not).
 */
export const apodPictureSchema = nasaPictureSchema.extend({
  hebrew: hebrewExplanationSchema.nullable(),
});

export type ApodPicture = z.infer<typeof apodPictureSchema>;

/** `GET /api/nasa/pictures?count=N`: how many pictures, 1 to 20, default 20. */
export const MAX_PICTURES = 20;

export const picturesQuerySchema = z.object({
  count: z.coerce
    .number("The count must be a number")
    .int("The count must be a whole number")
    .min(1, "The count must be at least 1")
    .max(MAX_PICTURES, `The count can be at most ${MAX_PICTURES}`)
    .default(MAX_PICTURES),
});

export type PicturesQuery = z.infer<typeof picturesQuerySchema>;

/**
 * `POST /api/nasa/explanations`: the browser sends ONLY the date. The title
 * and text that Gemini reads come from NASA, fetched by the server.
 */
export const explainRequestSchema = z.object({ date: apodDateSchema });

export type ExplainRequest = z.infer<typeof explainRequestSchema>;
