import { describe, it, expect } from "vitest";
import { getTool, TOOLS, SITE_URL } from "../tools";
import { toolJsonLd, breadcrumbJsonLd, faqJsonLd, homeJsonLd } from "../jsonLd";

// jwt-decoder always ships with FAQs, so it exercises every builder without
// coupling the test to copy that changes across branches.
const jwt = getTool("jwt-decoder")!;

describe("toolJsonLd", () => {
  it("marks the tool as a free, English SoftwareApplication", () => {
    const ld = toolJsonLd(jwt);
    expect(ld["@type"]).toBe("SoftwareApplication");
    expect(ld.inLanguage).toBe("en");
    expect(ld.isAccessibleForFree).toBe(true);
    expect(ld.url).toBe(`${SITE_URL}${jwt.path}`);
    expect(ld.offers).toMatchObject({ price: "0", priceCurrency: "USD" });
  });
});

describe("breadcrumbJsonLd", () => {
  it("is a two-level Home > Tool trail with no item on the current page", () => {
    const ld = breadcrumbJsonLd(jwt);
    expect(ld.itemListElement).toHaveLength(2);
    expect(ld.itemListElement[0]).toMatchObject({ position: 1, name: "Home", item: SITE_URL });
    expect(ld.itemListElement[1].position).toBe(2);
    expect(ld.itemListElement[1]).not.toHaveProperty("item");
  });
});

describe("faqJsonLd", () => {
  it("maps every FAQ to a Question/Answer pair", () => {
    const ld = faqJsonLd(jwt);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(jwt.faqs.length);
    expect(ld.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: jwt.faqs[0].q,
      acceptedAnswer: { "@type": "Answer", text: jwt.faqs[0].a },
    });
  });
});

describe("homeJsonLd", () => {
  it("emits Organization, an English WebSite, and an ItemList of every tool", () => {
    const graph = homeJsonLd()["@graph"];
    const byType = (t: string) => graph.find((n) => n["@type"] === t) as Record<string, unknown> | undefined;
    expect(byType("Organization")).toBeTruthy();
    expect(byType("WebSite")?.inLanguage).toBe("en");
    expect((byType("ItemList")?.itemListElement as unknown[]).length).toBe(TOOLS.length);
  });
});
