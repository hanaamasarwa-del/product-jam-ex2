import { describe, expect, it } from "vitest";
import { cleanExplanation, entryText, htmlToText, toPicture } from "./apodText";

/*
 * NASA's official APOD endpoint sends HTML. These tests are the proof that
 * what reaches Gemini and the browser is plain text, whatever NASA sends.
 */

describe("htmlToText", () => {
  it("removes tags and keeps the words", () => {
    expect(
      htmlToText('A <a href="https://x.org">galaxy</a> far <b>far</b> away'),
    ).toBe("A galaxy far far away");
  });

  it("decodes the entities NASA uses", () => {
    expect(htmlToText("HFG1 &amp; Abell 6: Planetary Nebulae")).toBe(
      "HFG1 & Abell 6: Planetary Nebulae",
    );
    expect(htmlToText("Caught &#8211; a comet")).toBe("Caught – a comet");
    expect(htmlToText("It&#8217;s &lt;big&gt; &quot;really&quot;")).toBe(
      'It’s <big> "really"',
    );
    expect(htmlToText("caf&#xE9;")).toBe("café");
  });

  it("leaves an entity it does not know, or a number that is no character", () => {
    expect(htmlToText("a &madeup; b")).toBe("a &madeup; b");
    expect(htmlToText("a &#99999999999; b")).toBe("a &#99999999999; b");
    expect(htmlToText("a &#0; b")).toBe("a &#0; b");
  });

  it("turns breaks and paragraphs into line breaks", () => {
    expect(htmlToText("one<br>two<br/>three")).toBe("one\ntwo\nthree");
    expect(htmlToText("<p>one</p><p>two</p>")).toBe("one\n\ntwo");
  });

  it("collapses runs of spaces and blank lines", () => {
    expect(htmlToText("a   \t b\n\n\n\n c")).toBe("a b\n\nc");
  });

  it("removes scripts and styles together with their contents", () => {
    const text = htmlToText(
      "before<script>alert('hi')</script>middle<style>p{color:red}</style>after",
    );
    expect(text).toBe("beforemiddleafter");
  });

  it("never turns encoded markup into real markup", () => {
    // Encoded on purpose: it must come out as text, not as a tag. The page
    // shows text as text, so this is harmless - but only if we never decode
    // BEFORE stripping.
    expect(htmlToText("&lt;script&gt;alert(1)&lt;/script&gt;")).toBe(
      "<script>alert(1)</script>",
    );
  });

  it("gives an empty string for nothing", () => {
    expect(htmlToText("")).toBe("");
    expect(htmlToText("<p> </p>")).toBe("");
  });
});

describe("cleanExplanation", () => {
  it("removes the Explanation label and the Tomorrow's picture teaser", () => {
    const html =
      "<strong>Explanation:</strong> A <a href='x'>massif</a> looms.<br><br><strong>Tomorrow's picture: </strong>meteoric";
    expect(cleanExplanation(html)).toBe("A massif looms.");
  });

  it("copes with a curly apostrophe in the teaser", () => {
    const html =
      "<strong>Explanation:</strong> Stars.<br><br><strong>Tomorrow&#8217;s picture: </strong>comets";
    expect(cleanExplanation(html)).toBe("Stars.");
  });

  it("leaves an explanation with neither alone", () => {
    expect(cleanExplanation("Just text, no label.")).toBe(
      "Just text, no label.",
    );
  });

  it("does not cut text that merely mentions tomorrow", () => {
    expect(
      cleanExplanation("<strong>Explanation:</strong> See you tomorrow."),
    ).toBe("See you tomorrow.");
  });
});

const entry = {
  date: "2026-11-07",
  title: "HFG1 &amp; Abell 6",
  permalink: "https://science.nasa.gov/image-article/apod-2026-november-7-x/",
  media_type: "image",
  explanation: "<strong>Explanation:</strong> A nebula.",
  copyright: '<a href="https://flickr.com/x">Alejandro Sanz</a>',
  alt: "A glowing nebula.",
  hdurl: "https://assets.science.nasa.gov/apod/x.jpg",
};

describe("toPicture", () => {
  it("makes a picture with plain text and the image from hdurl", () => {
    expect(toPicture(entry)).toEqual({
      date: "2026-11-07",
      title: "HFG1 & Abell 6",
      explanation: "A nebula.",
      media_type: "image",
      url: "https://assets.science.nasa.gov/apod/x.jpg",
      link: "https://science.nasa.gov/image-article/apod-2026-november-7-x/",
      copyright: "Alejandro Sanz",
      alt: "A glowing nebula.",
    });
  });

  it("calls both videos and iframes videos", () => {
    expect(toPicture({ ...entry, media_type: "video" })?.media_type).toBe(
      "video",
    );
    expect(toPicture({ ...entry, media_type: "iframe" })?.media_type).toBe(
      "video",
    );
  });

  it("skips interactive entries, which have no media type", () => {
    expect(toPicture({ ...entry, media_type: null })).toBeNull();
    expect(toPicture({ ...entry, media_type: undefined })).toBeNull();
    expect(toPicture({ ...entry, media_type: "other" })).toBeNull();
  });

  it("skips an entry with no picture", () => {
    expect(toPicture({ ...entry, hdurl: null })).toBeNull();
    expect(toPicture({ ...entry, hdurl: "" })).toBeNull();
  });

  it("skips an entry with no title or no text", () => {
    expect(toPicture({ ...entry, title: " <b></b> " })).toBeNull();
    expect(
      toPicture({ ...entry, explanation: "<strong>Explanation:</strong>" }),
    ).toBeNull();
  });

  it("skips a picture hosted somewhere we do not trust", () => {
    for (const hdurl of [
      "javascript:alert(1)",
      "http://assets.science.nasa.gov/x.jpg",
      "https://evil.example.com/x.jpg",
    ]) {
      expect(toPicture({ ...entry, hdurl }), hdurl).toBeNull();
    }
  });

  it("keeps the picture but drops a page link it does not trust", () => {
    const picture = toPicture({ ...entry, permalink: "javascript:alert(1)" });
    expect(picture).not.toBeNull();
    expect(picture).not.toHaveProperty("link");
  });

  it("leaves out an empty credit or alt text", () => {
    const picture = toPicture({ ...entry, copyright: null, alt: "" });
    expect(picture).not.toHaveProperty("copyright");
    expect(picture).not.toHaveProperty("alt");
  });

  it("never lets HTML through in any text field", () => {
    const picture = toPicture({
      ...entry,
      title: "<img src=x onerror=alert(1)>Title",
      explanation: "<script>alert(1)</script>Text <b>here</b>",
      copyright: "<a href='javascript:x'>Me</a>",
      alt: "<i>alt</i>",
    });
    expect(picture).toMatchObject({
      title: "Title",
      explanation: "Text here",
      copyright: "Me",
      alt: "alt",
    });
  });
});

describe("entryText", () => {
  it("gives the plain title and explanation, even for an interactive entry", () => {
    expect(entryText({ ...entry, media_type: null })).toEqual({
      title: "HFG1 & Abell 6",
      explanation: "A nebula.",
    });
  });

  it("gives null when either is empty", () => {
    expect(entryText({ ...entry, title: "" })).toBeNull();
    expect(entryText({ ...entry, explanation: "" })).toBeNull();
  });
});
