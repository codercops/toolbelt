import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { SITE_URL } from "../tools";

// Inspect JSX attributes rather than matching source text in examples or comments.
function attributes(source: string, name: string): string[] {
  const values: string[] = [];
  const file = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node) && node.name.getText(file) === name) {
      const value = node.initializer;
      if (value && ts.isStringLiteral(value)) values.push(value.text);
      else if (value && ts.isJsxExpression(value) && value.expression &&
        (ts.isStringLiteral(value.expression) || ts.isNoSubstitutionTemplateLiteral(value.expression))) {
        values.push(value.expression.text);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  return values;
}

function pages(directory: string, segments: string[] = []): Map<string, string> {
  const result = new Map<string, string>();
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith("@")) {
      const next = entry.name.startsWith("(") ? segments : [...segments, entry.name];
      for (const [route, source] of pages(path, next)) result.set(route, source);
    } else if (entry.name === "page.tsx") {
      result.set(`/${segments.join("/")}`, readFileSync(path, "utf8"));
    }
  }
  return result;
}

function failure(source: string, href: string, routes: Map<string, string>): string | undefined {
  const destination = new URL(href, new URL(source, SITE_URL));
  if (destination.origin !== new URL(SITE_URL).origin) return;
  const route = destination.pathname.replace(/\/$/, "") || "/";
  const target = routes.get(route);
  if (target === undefined) return `${source}: ${href} — missing route ${route}`;
  if (route.startsWith("/guides/") && destination.hash) {
    const id = decodeURIComponent(destination.hash.slice(1));
    if (!attributes(target, "id").includes(id)) return `${source}: ${href} — missing guide id ${id}`;
  }
}

describe("guide internal links", () => {
  const routes = pages("app");
  const guides = [...routes].filter(([route]) => /^\/guides\/[^/]+$/.test(route));

  it.each(guides)("checks literal links in %s", (route, source) => {
    const errors = attributes(source, "href").flatMap((href) => {
      const error = failure(route, href, routes);
      return error ? [error] : [];
    });
    expect(errors).toEqual([]);
  });

  it("checks relative routes, queries, anchors and missing destinations", () => {
    const fixtures = new Map([
      ["/guides/first", '<section id="intro" />'],
      ["/guides/second", '<h2 id="details" /><h2 id="details-2" />'],
      ["/tool", ""],
    ]);
    for (const href of ["#intro", "second?mode=1#details-2", "../tool?x=1", "https://example.org/missing", "mailto:a@example.org", "tel:123"]) {
      expect(failure("/guides/first", href, fixtures)).toBeUndefined();
    }
    expect(failure("/guides/first", "missing", fixtures)).toContain("missing route");
    expect(failure("/guides/first", "second#missing", fixtures)).toContain("missing guide id");
  });

  it("ignores link-like strings and comments and reads literal JSX expressions", () => {
    expect(attributes('const example = \'href="/missing"\'; // href="/missing"\nconst page = <a href={"/tool"}>Link</a>;', "href")).toEqual(["/tool"]);
  });
});
