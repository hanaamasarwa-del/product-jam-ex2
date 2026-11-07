import type { ApodPicture } from "@shared/schemas/nasa";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NasaPageView } from "./NasaPageView";

/*
 * The four states a fetched list can be in: loading, failed, empty, and full.
 * Rendered to HTML, since there is no browser in these tests.
 */

const make = (n: number): ApodPicture => ({
  date: `2024-03-${String(n).padStart(2, "0")}`,
  title: `Picture ${n}`,
  explanation: `About picture ${n}.`,
  media_type: "image",
  url: `https://assets.science.nasa.gov/apod/${n}.jpg`,
  hebrew: null,
});

function render(
  props: Partial<Parameters<typeof NasaPageView>[0]> & {
    status: "loading" | "error" | "ready";
  },
) {
  return renderToStaticMarkup(
    <NasaPageView
      pictures={[]}
      busy={false}
      onMore={() => {}}
      onRetry={() => {}}
      renderPicture={(picture) => <article>{picture.title}</article>}
      {...props}
    />,
  );
}

describe("NasaPageView", () => {
  it("always shows the heading and the button for another selection", () => {
    for (const status of ["loading", "error", "ready"] as const) {
      const html = render({ status });
      expect(html).toContain("<h1>Space pictures</h1>");
      expect(html).toContain("Show other pictures");
    }
  });

  it("shows a spinner and a message while NASA is being asked", () => {
    const html = render({ status: "loading", busy: true });
    expect(html).toContain("Loading pictures from NASA");
    expect(html).toContain("Asking NASA for pictures");
    expect(html).not.toContain("<article>");
  });

  it("disables the button while pictures are loading", () => {
    // The only button on these screens is "Show other pictures".
    const loading = render({ status: "loading", busy: true });
    const idle = render({ status: "ready", pictures: [make(1)] });
    expect(loading).toContain("disabled");
    expect(idle).not.toContain("disabled");
  });

  it("shows the problem in an alert, with a Try again button", () => {
    const html = render({
      status: "error",
      errorMessage: "We could not get pictures from NASA right now.",
    });
    expect(html).toContain('role="alert"');
    expect(html).toContain("We could not get pictures from NASA right now.");
    expect(html).toContain("Try again");
    expect(html).not.toContain("<article>");
  });

  it("says so when no pictures come back", () => {
    const html = render({ status: "ready", pictures: [] });
    expect(html).toContain("No pictures came back");
  });

  it("shows every picture it is given, in a list", () => {
    const pictures = Array.from({ length: 20 }, (_, i) => make(i + 1));
    const html = render({ status: "ready", pictures });
    expect(html.match(/<article>/g)).toHaveLength(20);
    expect(html).toContain("Picture 1<");
    expect(html).toContain("Picture 20<");
    expect(html.match(/<li>/g)).toHaveLength(20);
  });
});
