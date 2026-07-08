// All schema.org JSON-LD builders in one place. Everything derives from the
// TOOLS registry or SITE_URL, so the structured data can never drift from what
// the pages actually render. Emitted as inline <script type="application/ld+json">,
// which is inert data (not executable JS), so the nonce CSP does not apply.

import { SITE_URL, TOOLS, type Tool } from "./tools";

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

// The publisher is CODERCOPS (the agency). Keyed by an @id on this domain so the
// WebSite node can reference it. sameAs lists only identities we can honestly
// claim — the agency site is `url`; the GitHub org is the verified profile.
const ORG_NODE = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "CODERCOPS",
  url: "https://www.codercops.com",
  sameAs: ["https://github.com/codercops"],
};

// SoftwareApplication for a tool. No aggregateRating/review — there are no
// accounts and no ratings we could honestly claim, and fabricating them is
// against Google's policy.
export function toolJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.jsonLdName,
    applicationCategory: tool.applicationCategory,
    operatingSystem: "Any (Browser)",
    description: tool.jsonLdDescription,
    url: `${SITE_URL}${tool.path}`,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "CODERCOPS", url: "https://www.codercops.com" },
  };
}

// A truthful two-level Home > Tool trail. The current page (position 2) omits
// `item` per Google's spec. `name` uses jsonLdName so it matches both the
// SoftwareApplication node and the visible breadcrumb rendered on the page.
export function breadcrumbJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      // No trailing slash, to match the homepage canonical Next emits (SITE_URL).
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: tool.jsonLdName },
    ],
  };
}

// FAQPage. Only call this for tools that actually render an FAQ section
// (tool.faqs.length > 0), so the markup is always a true representation of the
// visible page. json-formatter has no FAQs and must not emit this.
export function faqJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

// Homepage @graph: Organization + WebSite + an ItemList of the tool collection.
// The ItemList is generated from TOOLS in the same order the ToolCard grid
// renders, so the structured list and the visible cards are always identical.
export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      ORG_NODE,
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: "CODERCOPS Tools",
        description: "Free, fast, privacy-first developer tools that run entirely in your browser.",
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "ItemList",
        name: "CODERCOPS developer tools",
        itemListElement: TOOLS.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.jsonLdName,
          url: `${SITE_URL}${t.path}`,
        })),
      },
    ],
  };
}
