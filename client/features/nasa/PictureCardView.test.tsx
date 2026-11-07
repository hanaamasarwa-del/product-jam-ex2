import type { ApodPicture, HebrewExplanation } from "@shared/schemas/nasa";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PictureCardView, type ExplainStatus } from "./PictureCardView";

/*
 * There is no browser in these tests, so we render the card to HTML and read
 * it. That is enough to check what each state shows. (Clicking is one line:
 * `onClick={onExplain}`.)
 */

const picture: ApodPicture = {
  date: "2024-03-15",
  title: "The Pillars of Creation",
  explanation: "Towering columns of gas and dust.",
  media_type: "image",
  url: "https://assets.science.nasa.gov/apod/pillars.jpg",
  link: "https://science.nasa.gov/image-article/apod-2024-march-15-pillars/",
  copyright: "Some Photographer",
  alt: "Columns of gas.",
  hebrew: null,
};

const hebrew: HebrewExplanation = {
  title_he: "עמודי הבריאה",
  summary_he: "אלה עמודים ענקיים של גז ואבק.",
  tags: ["nebula", "star"],
};

function render(
  overrides: Partial<ApodPicture> = {},
  status: ExplainStatus = "idle",
  errorMessage?: string,
) {
  return renderToStaticMarkup(
    <PictureCardView
      picture={{ ...picture, ...overrides }}
      status={status}
      errorMessage={errorMessage}
      onExplain={() => {}}
    />,
  );
}

describe("PictureCardView: what NASA gave us", () => {
  it("shows the image, the date, the title and NASA's explanation", () => {
    const html = render();
    expect(html).toContain(
      'src="https://assets.science.nasa.gov/apod/pillars.jpg"',
    );
    expect(html).toContain('alt="Columns of gas."');
    expect(html).toContain('dateTime="2024-03-15"');
    expect(html).toContain("March 15, 2024");
    expect(html).toContain("The Pillars of Creation");
    expect(html).toContain("Towering columns of gas and dust.");
    expect(html).toContain("Credit: Some Photographer");
  });

  it("falls back to the title as the image description", () => {
    expect(render({ alt: undefined })).toContain(
      'alt="The Pillars of Creation"',
    );
  });

  it("leaves out the credit when there is none", () => {
    expect(render({ copyright: undefined })).not.toContain("Credit:");
  });

  it("marks a video and links to where it can be watched", () => {
    const html = render({ media_type: "video" });
    expect(html).toContain("Video");
    expect(html).toContain("Watch the video on NASA");
    expect(html).toContain(
      'href="https://science.nasa.gov/image-article/apod-2024-march-15-pillars/"',
    );
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("does not offer a video link for a plain picture", () => {
    expect(render()).not.toContain("Watch the video");
  });

  it("shows text as text: markup in it is escaped, never run", () => {
    const html = render({
      title: "<img src=x onerror=alert(1)>",
      explanation: "<script>alert(1)</script>",
    });
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("PictureCardView: asking for the Hebrew explanation", () => {
  it("offers an Explain in Hebrew button before it is explained", () => {
    const html = render();
    expect(html).toContain("Explain in Hebrew");
    expect(html).not.toContain('lang="he"');
  });

  it("shows that Gemini is working while it waits", () => {
    const html = render({}, "pending");
    expect(html).toContain("Gemini is");
    expect(html).toContain("writing the explanation");
    expect(html).toContain("data-loading");
    expect(html).toContain("disabled");
  });

  it("shows the server's message in an alert when it fails, and offers Try again", () => {
    const html = render({}, "error", "The explanation did not come out right.");
    expect(html).toContain('role="alert"');
    expect(html).toContain("The explanation did not come out right.");
    expect(html).toContain("Try again");
    expect(html).not.toContain("Explain in Hebrew");
  });
});

describe("PictureCardView: after the Hebrew explanation", () => {
  it("shows the Hebrew title, summary and tags, right to left", () => {
    const html = render({ hebrew });
    expect(html).toContain('lang="he"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("עמודי הבריאה");
    expect(html).toContain("אלה עמודים ענקיים של גז ואבק.");
    expect(html).toContain(">nebula<");
    expect(html).toContain(">star<");
  });

  it("still shows NASA's original explanation beside it", () => {
    const html = render({ hebrew });
    expect(html).toContain("Towering columns of gas and dust.");
  });

  it("takes away the button once it is explained", () => {
    const html = render({ hebrew });
    expect(html).not.toContain("Explain in Hebrew");
    expect(html).not.toContain("Try again");
  });
});
