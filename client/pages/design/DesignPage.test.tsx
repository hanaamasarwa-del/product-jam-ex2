import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SHOW_SECTIONS, copy } from "./content";
import { DesignPageView } from "./DesignPage";

/*
 * There is no browser in these tests, so the page is rendered to HTML and read.
 *
 * Note what is NOT set up here: no router, no query client, no login. The page
 * renders without any of them, which is the point: /design is public and does
 * not talk to the server, so a designer can run it without a .env file.
 */

/** How the renderer writes text inside an attribute. */
const attr = (text: string) => text.replaceAll("'", "&#x27;");

const html = renderToStaticMarkup(<DesignPageView />);
const htmlWithEverything = renderToStaticMarkup(
  <DesignPageView show={{ typographyNote: true, privacyNote: true }} />,
);

describe("the Dentify page: what is on it", () => {
  it("has the logo as the page heading", () => {
    expect(html).toContain("<h1");
    expect(html).toContain(`alt="${copy.logoAlt}"`);
  });

  it("has the player card", () => {
    expect(html).toContain(copy.player.title);
    expect(html).toContain(copy.player.playLabel);
  });

  it("has the Hebrew introduction, with its bold phrases", () => {
    expect(html).toContain("אפליקציית הזרמת מוזיקה");
    expect(html).toContain("<strong>אפליקציית הזרמת מוזיקה</strong>");
    expect(html).toContain("<strong>לרופאי שיניים ולמטופלים</strong>");
  });

  it("has the Patient and Dentist headings and their Hebrew captions", () => {
    expect(html).toContain(`alt="${copy.audiences.patientAlt}"`);
    expect(html).toContain(`alt="${copy.audiences.dentistAlt}"`);
    expect(html).toContain(copy.audiences.patientCaption);
    expect(html).toContain(copy.audiences.dentistCaption);
  });

  it("has both feature cards, with their words", () => {
    for (const card of [copy.features.patient, copy.features.dentist]) {
      expect(html).toContain(card.title);
      expect(html).toContain(card.body);
      expect(html).toContain(`alt="${attr(card.artAlt)}"`);
    }
  });

  it("has the app preview: greeting, all five chips, the shelf and its cards", () => {
    expect(html).toContain(copy.preview.greeting);
    for (const chip of copy.preview.chips) expect(html).toContain(`>${chip}<`);
    expect(html).toContain(copy.preview.shelfTitle);
    expect(html.split(copy.preview.cardTitle)).toHaveLength(4); // three cards
  });

  it("has the credits, in Hebrew and English", () => {
    expect(html).toContain(copy.credits.hebrew);
    expect(html).toContain(copy.credits.latin);
  });
});

describe("the sections that are left out for now", () => {
  it("are off by default", () => {
    expect(SHOW_SECTIONS).toEqual({
      typographyNote: false,
      privacyNote: false,
    });
  });

  it("do not appear on the page", () => {
    expect(html).not.toContain("Heavy");
    expect(html).not.toContain("Medium weights");
    expect(html).not.toContain(copy.typographyNote.hebrewTitle);
    expect(html).not.toContain("WebSockets");
    expect(html).not.toContain("PHI");
    expect(html).not.toContain("Typography note");
    expect(html).not.toContain("Privacy note");
  });

  it("come back when they are switched on", () => {
    expect(htmlWithEverything).toContain("Medium weights");
    expect(htmlWithEverything).toContain(copy.typographyNote.hebrewTitle);
    expect(htmlWithEverything).toContain("WebSockets");
    expect(htmlWithEverything).toContain("PHI");
  });

  it("can be switched on one at a time", () => {
    const onlyPrivacy = renderToStaticMarkup(
      <DesignPageView show={{ typographyNote: false, privacyNote: true }} />,
    );
    expect(onlyPrivacy).toContain("WebSockets");
    expect(onlyPrivacy).not.toContain("Medium weights");
  });
});

describe("Hebrew and right-to-left", () => {
  it("marks the Hebrew blocks as Hebrew, right to left", () => {
    for (const hebrew of [
      copy.audiences.patientCaption,
      copy.audiences.dentistCaption,
      copy.credits.hebrew,
    ]) {
      expect(html).toMatch(new RegExp(`lang="he" dir="rtl"[^>]*>${hebrew}<`));
    }
    expect(html).toMatch(/<p[^>]*lang="he" dir="rtl"[^>]*><span>Dentify/); // the introduction
  });

  it("leaves the English blocks left to right", () => {
    expect(html).not.toMatch(/dir="rtl"[^>]*>Get started/);
    expect(html).not.toMatch(/dir="rtl"[^>]*>Hello, Dentist/);
  });

  it("marks the privacy note as right to left when it is on", () => {
    expect(htmlWithEverything).toMatch(
      /lang="he" dir="rtl"[^>]*>המערכת מבוססת/,
    );
  });
});

describe("photos that the Figma export did not have", () => {
  it("makes up no picture and shows no placeholder", () => {
    expect(html).not.toContain("PHOTO MISSING");
    expect(html).not.toContain("from the Figma export");
    expect(html).not.toContain("placeholder");
  });

  it("shows the one real photo, on the middle card", () => {
    expect(html.match(/data-photo="yes"/g)).toHaveLength(1);
    expect(html).toContain("photo-blurred");
  });

  it("keeps the two cards without a photo out of sight of screen readers", () => {
    const hidden = html.match(/<div[^>]*data-photo="missing"[^>]*>/g) ?? [];
    expect(hidden).toHaveLength(2);
    for (const tag of hidden) expect(tag).toContain('aria-hidden="true"');
  });

  it("tells the shelf how many cards have a photo, so it can size them", () => {
    expect(html).toContain('data-cards="1"');
  });
});

describe("the layout is built so it can change with the screen", () => {
  it("keeps the logo, the player card and the introduction together at the top", () => {
    const top = html.match(/<header[\s\S]*?<\/header>/)?.[0] ?? "";
    expect(top).toContain(copy.logoAlt);
    expect(top).toContain(copy.player.title);
    expect(top).toContain("אפליקציית הזרמת מוזיקה");
  });

  it("puts each Patient / Dentist heading in the same group as its own card", () => {
    const patientGroup = html.slice(0, html.indexOf('data-who="dentist"'));
    const dentistGroup = html.slice(html.indexOf('data-who="dentist"'));
    // The patient heading and caption come before the patient card, and none
    // of the dentist's words are in the patient's group.
    expect(patientGroup).toContain('alt="Patient"');
    expect(patientGroup).toContain(copy.features.patient.title);
    expect(patientGroup).not.toContain('alt="Dentist"');
    expect(patientGroup).not.toContain(copy.features.dentist.title);
    expect(dentistGroup).toContain('alt="Dentist"');
    expect(dentistGroup).toContain(copy.features.dentist.title);
    expect(patientGroup.indexOf('alt="Patient"')).toBeLessThan(
      patientGroup.indexOf(copy.features.patient.title),
    );
  });

  it("has the two audience groups, each with a heading and a card", () => {
    expect(html.match(/class="_audience_/g)).toHaveLength(2);
    expect(html.match(/class="_audienceHead_/g)).toHaveLength(2);
    expect(html.match(/<article/g)).toHaveLength(2);
  });

  it("keeps the app preview in one section: greeting, chips and shelf", () => {
    const preview =
      html.match(/<section[^>]*aria-label="The app"[\s\S]*?<\/section>/)?.[0] ??
      "";
    expect(preview).toContain(copy.preview.greeting);
    expect(preview).toContain(copy.preview.shelfTitle);
    for (const chip of copy.preview.chips) expect(preview).toContain(chip);
  });
});

describe("nothing here does anything yet", () => {
  it("makes every button a plain button, with no form or link behaviour", () => {
    const buttons = html.match(/<button[^>]*>/g) ?? [];
    expect(buttons.length).toBe(3); // Play Now and the two "Get started"
    for (const tag of buttons) expect(tag).toContain('type="button"');
  });

  it("has no links, so nothing leads anywhere that was not in the design", () => {
    // (React adds <link rel="preload"> tags for images, which are not links on the page.)
    expect(html).not.toContain("<a ");
    expect(html).not.toMatch(/<a\b/);
  });

  it("has no form fields", () => {
    expect(html).not.toMatch(/<(input|form|select|textarea)/);
  });

  it("has no starter-kit header or footer", () => {
    expect(html).not.toContain("Log In");
    expect(html).not.toContain("Demos");
    expect(html.match(/<header/g)).toHaveLength(1); // only the page's own top
    expect(html.match(/<footer/g)).toHaveLength(1); // only the credits
  });
});

describe("accessibility basics", () => {
  it("gives every image an alt attribute, empty for the decorative ones", () => {
    const images = html.match(/<img[^>]*>/g) ?? [];
    expect(images.length).toBeGreaterThan(10);
    for (const tag of images) expect(tag).toMatch(/\salt="/);
  });

  it("describes the pictures that carry meaning", () => {
    expect(html).toContain(`alt="${attr(copy.features.patient.artAlt)}"`);
    expect(html).toContain(`alt="${attr(copy.features.dentist.artAlt)}"`);
  });

  it("gives the play button a name for screen readers", () => {
    expect(html).toMatch(/<button[^>]*>.*?Play Now<\/span><\/button>/);
  });

  it("has one main landmark and one level-1 heading", () => {
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html.match(/<h1/g)).toHaveLength(1);
  });
});
