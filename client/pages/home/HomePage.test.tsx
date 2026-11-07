import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { HomePageView } from "./HomePageView";

const render = (signedIn: boolean | null) =>
  renderToStaticMarkup(
    <StaticRouter location="/">
      <HomePageView signedIn={signedIn} />
    </StaticRouter>,
  );

const out = render(false);
const links = [...out.matchAll(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)</g)];

describe("the home page", () => {
  it("links to the three projects", () => {
    const hrefs = links.map((m) => m[1]);
    expect(hrefs).toContain("/tic-tac-toe");
    expect(hrefs).toContain("/nasa");
    expect(hrefs).toContain("/design");
  });

  it("has exactly one link per card", () => {
    expect(out.match(/<li /g)).toHaveLength(3);
    for (const href of ["/tic-tac-toe", "/nasa", "/design"]) {
      expect(links.filter((m) => m[1] === href)).toHaveLength(1);
    }
  });

  it("names each card by its title", () => {
    const names = links.map((m) => m[2]);
    expect(names).toEqual(
      expect.arrayContaining(["Tic-tac-toe", "NASA Space Pictures", "Dentify"]),
    );
  });

  it("says which projects need a login", () => {
    expect(out.match(/Login required/g)).toHaveLength(2);
    expect(out.match(/Open to everyone/g)).toHaveLength(1);
  });

  it("has one h1 and no starter-kit leftovers", () => {
    expect(out.match(/<h1/g)).toHaveLength(1);
    for (const gone of [
      "Starter Kit",
      "Lorem",
      "huji",
      "bezalel",
      "My events",
    ]) {
      expect(out.toLowerCase()).not.toContain(gone.toLowerCase());
    }
  });

  it("does not claim the projects are one product", () => {
    expect(out).toContain("stands");
    expect(out).not.toMatch(/platform|suite/i);
  });

  it("keeps the pictures decorative", () => {
    for (const img of out.match(/<img[^>]*>/g) ?? []) {
      expect(img).toContain('alt=""');
    }
  });

  it("shows the login hint only to people who are logged out", () => {
    expect(render(false)).toContain('href="/signin"');
    expect(render(true)).not.toContain("/signin");
    expect(render(null)).not.toContain("/signin");
  });
});
