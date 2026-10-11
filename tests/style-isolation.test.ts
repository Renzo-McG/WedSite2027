import { describe, expect, it } from "vitest";

/**
 * The root page (src/pages/index.astro) imports both experiences and renders
 * one: the Wedding website on Cloudflare, the Save the Date on the GitHub Pages
 * legacy build. The build bundles both experiences' stylesheets into it either
 * way, so each experience's stylesheets are scoped beneath its own page root
 * (the class on its <body>) and must never match the other's elements. These
 * tests hold every stylesheet an experience imports to that rule.
 */
const sources = import.meta.glob<string>(
  [
    "../src/components/save-the-date/SaveTheDatePage.astro",
    "../src/layouts/AppShell.astro",
    "../src/components/app/WeddingWebsiteHome.astro",
  ],
  { query: "?raw", import: "default", eager: true },
);
const styles = import.meta.glob<string>("../src/styles/*.css", {
  query: "?raw",
  import: "default",
  eager: true,
});

const experiences = [
  {
    name: "Save the Date",
    root: "std-page",
    entries: ["../src/components/save-the-date/SaveTheDatePage.astro"],
  },
  {
    name: "Wedding website",
    root: "app-page",
    entries: ["../src/layouts/AppShell.astro", "../src/components/app/WeddingWebsiteHome.astro"],
  },
];

const source = (file: string) => {
  const text = sources[file];
  if (text === undefined) throw new Error(`missing source ${file}`);
  return text;
};

/** The stylesheets an experience's components import, as keys of `styles`. */
const stylesheetsOf = (entries: string[]) =>
  entries.flatMap((entry) =>
    [...source(entry).matchAll(/^import "(?:\.\.\/)+styles\/([\w.-]+\.css)";$/gm)].map(
      (m) => `../src/styles/${m[1]}`,
    ),
  );

interface StyleRule {
  selectors: string[];
  /** A parent style rule already scopes it (CSS nesting). */
  scopedParent: boolean;
}

/** Splits at top-level commas, leaving those inside :is() and friends alone. */
const splitList = (list: string) => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      parts.push(list.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(list.slice(start));
  return parts.map((p) => p.trim().replace(/\s+/g, " "));
};

/**
 * A deliberately small reader for this project's plain CSS: walks the blocks,
 * looks through conditional at-rules (@media, @supports and so on) and skips
 * the global ones whose contents are not selectors.
 */
function styleRules(css: string, isScoped: (selector: string) => boolean): StyleRule[] {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules: StyleRule[] = [];
  const stack: { kind: "rule" | "skip" | "group"; scoped: boolean }[] = [];
  let start = 0;
  let quote = "";
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = "";
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === ";") start = i + 1;
    else if (c === "}") {
      stack.pop();
      start = i + 1;
    } else if (c === "{") {
      const prelude = text.slice(start, i).trim();
      start = i + 1;
      const inside = stack.at(-1);
      if (inside?.kind === "skip") {
        stack.push({ kind: "skip", scoped: true });
      } else if (prelude.startsWith("@")) {
        const global = /^@(keyframes|-webkit-keyframes|font-face|property|page)\b/.test(prelude);
        stack.push({ kind: global ? "skip" : "group", scoped: inside?.scoped ?? false });
      } else {
        const selectors = splitList(prelude);
        const parent = [...stack].reverse().find((s) => s.kind === "rule");
        const scopedParent = parent?.scoped ?? false;
        rules.push({ selectors, scopedParent });
        stack.push({ kind: "rule", scoped: scopedParent || selectors.every(isScoped) });
      }
    }
  }
  return rules;
}

/**
 * Scoped: the experience's page root, an element inside it, or <html> in a
 * state that only matters while that page root is its body.
 */
const scopedTo = (root: string) => {
  const state = String.raw`(?:(?:html|\.js)(?:\[[^\]]*\]|\.js)*\s+)?`;
  const scope = String.raw`(?::where\(\.${root}\)|\.${root})(?![\w-])`;
  const inside = new RegExp(String.raw`^${state}${scope}`);
  const htmlWhile = new RegExp(String.raw`^html(?:\[[^\]]*\])*:where\(:has\(> \.${root}\)\)$`);
  return (selector: string) => inside.test(selector) || htmlWhile.test(selector);
};

const names = (css: string, atRule: string) =>
  [...css.matchAll(new RegExp(String.raw`@${atRule}\s+([\w-]+)`, "g"))].map((m) => m[1]);

describe("root page style isolation", () => {
  it.each(experiences)("renders the $name inside its own page root", ({ root, entries }) => {
    const roots = entries
      .map(
        (entry) =>
          source(entry)
            .match(/className="([^"]*)"/)?.[1]
            ?.split(/\s+/) ?? [],
      )
      .flat();
    expect(roots).toContain(root);
  });

  it("finds each experience's stylesheets", () => {
    const [saveTheDate, website] = experiences.map((e) => stylesheetsOf(e.entries));
    expect(saveTheDate).toContain("../src/styles/save-the-date.css");
    expect(website).toEqual(
      expect.arrayContaining(["../src/styles/app.css", "../src/styles/screen-home.css"]),
    );
    for (const file of [...saveTheDate!, ...website!]) {
      expect(styles[file]?.length, `${file} is read as text`).toBeGreaterThan(0);
    }
  });

  it.each(experiences)(
    "scopes every $name rule beneath .$root so it cannot style the other experience",
    ({ root, entries }) => {
      const isScoped = scopedTo(root);
      const unscoped = stylesheetsOf(entries).flatMap((file) =>
        styleRules(styles[file] ?? "", isScoped)
          .filter((rule) => !rule.scopedParent)
          .flatMap((rule) => rule.selectors.filter((s) => !isScoped(s)))
          .map((selector) => `${file.replace("../src/styles/", "")}: ${selector}`),
      );
      expect(unscoped).toEqual([]);
    },
  );

  it("recognises the selectors that leaked into the other experience as unscoped", () => {
    const isScoped = scopedTo("std-page");
    for (const leaked of [
      ".names",
      ".names__amp",
      ".note",
      ".sheet",
      "*",
      "html[data-sheet-open]",
    ]) {
      expect(isScoped(leaked), leaked).toBe(false);
    }
    expect(isScoped(".app-page .names")).toBe(false);
    expect(isScoped(".std-pages .names")).toBe(false);
    expect(isScoped(":where(.std-page) .names")).toBe(true);
    expect(
      styleRules("html[data-reduced-motion] { .sheet { opacity: 1; } }", isScoped)[1],
    ).toMatchObject({ scopedParent: false });
  });

  it("keeps animation and registered property names apart, since neither can be scoped", () => {
    const [saveTheDate, website] = experiences.map((e) =>
      stylesheetsOf(e.entries).map((file) => styles[file] ?? ""),
    );
    for (const atRule of ["keyframes", "property"]) {
      const theirs = new Set(website!.flatMap((css) => names(css, atRule)));
      const shared = saveTheDate!.flatMap((css) => names(css, atRule)).filter((n) => theirs.has(n));
      expect(shared, `@${atRule}`).toEqual([]);
    }
  });
});
