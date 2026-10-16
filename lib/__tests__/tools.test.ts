import { existsSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { TOOLS, SITE_URL } from "../tools";
import { toolJsonLd, breadcrumbJsonLd, faqJsonLd, homeJsonLd } from "../jsonLd";
import { generateToolMetadata } from "../toolMetadata";

describe("tool registry", () => {
  it("has unique slugs", () => {
    expect(new Set(TOOLS.map((tool) => tool.slug)).size).toBe(TOOLS.length);
  });

  describe.each(TOOLS)("$slug", (tool) => {
    it("uses its slug as its path", () => {
      expect(tool.path).toBe(`/${tool.slug}`);
    });

    it("dims an empty string or part of the hero heading", () => {
      expect(tool.heroDim === "" || tool.heroHeading.includes(tool.heroDim)).toBe(true);
    });

    it("uses an allowed accent and a six-digit hex color", () => {
      expect(["--cyan", "--amber", "--violet", "--sky", "--lime", "--green", "--fuchsia"])
        .toContain(tool.accentVar);
      expect(tool.accentHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("has features and FAQs with questions and answers", () => {
      expect(tool.features.length).toBeGreaterThan(0);
      expect(tool.faqs.length).toBeGreaterThan(0);
      for (const faq of tool.faqs) {
        expect(faq.q.length).toBeGreaterThan(0);
        expect(faq.a.length).toBeGreaterThan(0);
      }
    });

    it("keeps metadata within the title and description limits", () => {
      expect(tool.metaTitle.length).toBeLessThanOrEqual(60);
      expect(tool.metaDescription.length).toBeLessThanOrEqual(165);
    });

    it("has a sitemap priority greater than zero and at most one", () => {
      expect(tool.sitemapPriority).toBeGreaterThan(0);
      expect(tool.sitemapPriority).toBeLessThanOrEqual(1);
    });

    it("uses HTTPS for both CTA links", () => {
      expect(tool.cta.primaryHref.startsWith("https://")).toBe(true);
      expect(tool.cta.secondaryHref.startsWith("https://")).toBe(true);
    });

    it("has a page and an OpenGraph image route", () => {
      expect(existsSync(`app/(tools)/${tool.slug}/page.tsx`)).toBe(true);
      expect(existsSync(`app/(tools)/${tool.slug}/opengraph-image.tsx`)).toBe(true);
    });

    it("uses its public URL in tool JSON-LD", () => {
      expect(toolJsonLd(tool).url).toBe(`${SITE_URL}${tool.path}`);
    });

    it("marks tool JSON-LD as English and free", () => {
      expect(toolJsonLd(tool)).toMatchObject({ inLanguage: "en", isAccessibleForFree: true });
    });

    it("omits item from the final breadcrumb", () => {
      expect(breadcrumbJsonLd(tool).itemListElement.at(-1)).not.toHaveProperty("item");
    });

    it("includes every FAQ in FAQ JSON-LD", () => {
      expect(faqJsonLd(tool).mainEntity).toHaveLength(tool.faqs.length);
    });

    it("uses its metadata title and public canonical URL", () => {
      const metadata = generateToolMetadata(tool);
      expect(metadata.title).toBe(tool.metaTitle);
      expect(metadata.alternates?.canonical).toBe(`${SITE_URL}${tool.path}`);
    });
  });
});

describe("homepage JSON-LD", () => {
  it("lists every current tool in registry order", () => {
    const itemList = homeJsonLd()["@graph"].find((node) => node["@type"] === "ItemList");
    expect(itemList).toMatchObject({
      itemListElement: TOOLS.map((tool, index) => ({
        position: index + 1,
        url: `${SITE_URL}${tool.path}`,
      })),
    });
  });

  it("dates the WebSite node", () => {
    const website = homeJsonLd()["@graph"].find((node) => node["@type"] === "WebSite");
    expect(website).toMatchObject({ datePublished: "2026-07-08" });
    expect(website).toHaveProperty("dateModified", expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });
});
