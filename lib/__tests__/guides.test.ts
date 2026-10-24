import { existsSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { GUIDES, getGuide, getGuidesForTool } from "../guides";
import { TOOLS, SITE_URL } from "../tools";
import {
  guideArticleJsonLd,
  guideHowToJsonLd,
  guideBreadcrumbJsonLd,
  guidesIndexBreadcrumbJsonLd,
  guidesIndexJsonLd,
} from "../jsonLd";
import { generateGuideMetadata, generateGuidesIndexMetadata } from "../toolMetadata";

describe("guides registry", () => {
  it("has unique slugs", () => {
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length);
  });

  describe.each(GUIDES)("$slug", (guide) => {
    it("uses its slug under /guides as its path", () => {
      expect(guide.path).toBe(`/guides/${guide.slug}`);
    });

    it("uses an allowed accent and a six-digit hex color", () => {
      expect(["--cyan", "--amber", "--violet", "--sky", "--lime", "--green", "--fuchsia"]).toContain(
        guide.accentVar
      );
      expect(guide.accentHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it("has tags and steps with non-empty content", () => {
      expect(guide.tags.length).toBeGreaterThan(0);
      expect(guide.steps.length).toBeGreaterThan(0);
      for (const step of guide.steps) {
        expect(step.name.length).toBeGreaterThan(0);
        expect(step.text.length).toBeGreaterThan(0);
      }
    });

    it("keeps metadata within the title and description limits", () => {
      expect(guide.metaTitle.length).toBeLessThanOrEqual(60);
      expect(guide.metaDescription.length).toBeLessThanOrEqual(165);
    });

    it("has a sitemap priority greater than zero and at most one", () => {
      expect(guide.sitemapPriority).toBeGreaterThan(0);
      expect(guide.sitemapPriority).toBeLessThanOrEqual(1);
    });

    it("has a page and an OpenGraph image route", () => {
      expect(existsSync(`app/guides/${guide.slug}/page.tsx`)).toBe(true);
      expect(existsSync(`app/guides/${guide.slug}/opengraph-image.tsx`)).toBe(true);
    });

    it("uses its public URL in guide Article JSON-LD", () => {
      const article = guideArticleJsonLd(guide);
      expect(article["@type"]).toBe("Article");
      expect(article.url).toBe(`${SITE_URL}${guide.path}`);
      expect(article.datePublished).toBe(guide.publishedAt);
      expect(article.author).toMatchObject({ name: "CODERCOPS" });
    });

    it("includes steps in guide HowTo JSON-LD", () => {
      const howTo = guideHowToJsonLd(guide);
      expect(howTo["@type"]).toBe("HowTo");
      expect(howTo.name).toBe(guide.title);
      expect(howTo.step).toHaveLength(guide.steps.length);
    });

    it("formats a three-level breadcrumb omitting item from the leaf", () => {
      const breadcrumb = guideBreadcrumbJsonLd(guide);
      expect(breadcrumb["@type"]).toBe("BreadcrumbList");
      expect(breadcrumb.itemListElement).toHaveLength(3);
      expect(breadcrumb.itemListElement[0]).toMatchObject({ name: "Home", item: SITE_URL });
      expect(breadcrumb.itemListElement[1]).toMatchObject({ name: "Guides", item: `${SITE_URL}/guides` });
      expect(breadcrumb.itemListElement[2]).toMatchObject({ name: guide.title });
      expect(breadcrumb.itemListElement[2]).not.toHaveProperty("item");
    });

    it("uses article type and canonical URL in guide metadata", () => {
      const meta = generateGuideMetadata(guide);
      expect(meta.title).toBe(guide.metaTitle);
      expect(meta.alternates?.canonical).toBe(`${SITE_URL}${guide.path}`);
      expect(meta.openGraph).toMatchObject({ type: "article" });
    });
  });
});

describe("guide and tool linking", () => {
  it("only references tools that exist in the tool registry", () => {
    const toolSlugs = new Set(TOOLS.map((tool) => tool.slug));
    for (const guide of GUIDES) {
      for (const slug of guide.relatedTools ?? []) {
        expect(toolSlugs.has(slug)).toBe(true);
      }
    }
  });

  it("finds every guide from each tool it links to", () => {
    for (const guide of GUIDES) {
      for (const slug of guide.relatedTools ?? []) {
        expect(getGuidesForTool(slug).map((g) => g.slug)).toContain(guide.slug);
      }
    }
  });

  it("returns no guides for a tool that has none", () => {
    expect(getGuidesForTool("no-such-tool")).toEqual([]);
  });
});

describe("guides index", () => {
  it("has an index page and an OpenGraph image route", () => {
    expect(existsSync("app/guides/page.tsx")).toBe(true);
    expect(existsSync("app/guides/opengraph-image.tsx")).toBe(true);
  });

  it("generates a two-level breadcrumb for the index", () => {
    const breadcrumb = guidesIndexBreadcrumbJsonLd();
    expect(breadcrumb.itemListElement).toHaveLength(2);
    expect(breadcrumb.itemListElement[0]).toMatchObject({ name: "Home", item: SITE_URL });
    expect(breadcrumb.itemListElement[1]).toMatchObject({ name: "Guides" });
    expect(breadcrumb.itemListElement[1]).not.toHaveProperty("item");
  });

  it("generates collection page structured data for the index", () => {
    const indexJsonLd = guidesIndexJsonLd();
    expect(indexJsonLd["@type"]).toBe("CollectionPage");
    expect(indexJsonLd.url).toBe(`${SITE_URL}/guides`);
  });

  it("generates index metadata with canonical URL", () => {
    const meta = generateGuidesIndexMetadata();
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/guides`);
  });

  it("finds a guide by slug using getGuide", () => {
    const guide = getGuide(GUIDES[0].slug);
    expect(guide).toBeDefined();
    expect(guide?.slug).toBe(GUIDES[0].slug);
  });
});
