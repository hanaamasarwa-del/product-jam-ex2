import {
  nasaPictureSchema,
  type NasaPicture,
  type NasaWpEntry,
} from "@shared/schemas/nasa";

/*
 * Turning NASA's HTML entries into plain pictures.
 *
 * NASA's official APOD endpoint sends titles, explanations and credits as
 * HTML ("<strong>Explanation:</strong> A <a href=...>galaxy</a> &amp; ..."). We
 * want plain text, for two reasons: Gemini should read words, not markup, and
 * the browser must never be handed HTML from another server to render.
 *
 * These are pure functions, with no network, so they are easy to test.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

function decodeEntities(text: string): string {
  return text.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (whole, name: string) => {
      if (name.startsWith("#")) {
        const code =
          name[1] === "x" || name[1] === "X"
            ? parseInt(name.slice(2), 16)
            : parseInt(name.slice(1), 10);
        // fromCodePoint throws on a number that is not a character.
        return Number.isInteger(code) && code > 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : whole;
      }
      return NAMED_ENTITIES[name.toLowerCase()] ?? whole;
    },
  );
}

/**
 * HTML to plain text. Tags are removed first and entities decoded second, so
 * an encoded "&lt;script&gt;" ends up as harmless text, never as a tag.
 */
export function htmlToText(html: string): string {
  const withoutTags = html
    // Keep paragraph breaks as line breaks.
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    // Drop script and style together with what is inside them.
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<[^>]*>/g, "");
  return decodeEntities(withoutTags)
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * The explanation as plain text, without NASA's wrapper: the leading
 * "Explanation:" label and the "Tomorrow's picture: ..." teaser at the end.
 */
export function cleanExplanation(html: string): string {
  return htmlToText(html)
    .replace(/^Explanation:\s*/i, "")
    .replace(/\s*Tomorrow['’]s picture:[\s\S]*$/i, "")
    .trim();
}

/** What NASA calls `video` and `iframe` are both "not a still picture" to us. */
function mediaType(raw: string | null | undefined): "image" | "video" | null {
  if (raw === "image") return "image";
  if (raw === "video" || raw === "iframe") return "video";
  return null; // Interactive pages and the like: nothing we can show.
}

/**
 * The title and explanation of an entry, as plain text. Used when we only need
 * the words (to send to Gemini), so it works for any kind of entry.
 */
export function entryText(
  entry: NasaWpEntry,
): { title: string; explanation: string } | null {
  const title = htmlToText(entry.title);
  const explanation = cleanExplanation(entry.explanation);
  return title && explanation ? { title, explanation } : null;
}

/**
 * One NASA entry as a picture the page can show, or `null` if it cannot be
 * shown (no usable image, an interactive page, or a link we do not trust).
 */
export function toPicture(entry: NasaWpEntry): NasaPicture | null {
  const type = mediaType(entry.media_type);
  const text = entryText(entry);
  if (!type || !text || !entry.hdurl) return null;

  const copyright = entry.copyright ? htmlToText(entry.copyright) : "";
  const alt = entry.alt ? htmlToText(entry.alt) : "";
  // A bad page link should not cost us the picture: leave just the link out.
  const link = nasaPictureSchema.shape.link.safeParse(entry.permalink);

  const parsed = nasaPictureSchema.safeParse({
    date: entry.date,
    title: text.title,
    explanation: text.explanation,
    media_type: type,
    url: entry.hdurl,
    // Only include what we have, so a missing field is missing, not `undefined`.
    ...(link.success && link.data ? { link: link.data } : {}),
    ...(copyright ? { copyright } : {}),
    ...(alt ? { alt } : {}),
  });
  return parsed.success ? parsed.data : null;
}
