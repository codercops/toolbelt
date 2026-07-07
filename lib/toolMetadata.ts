import type { Metadata } from "next";
import { SITE_URL, type Tool } from "./tools";

// Builds the per-tool Next Metadata from a manifest entry, so every tool page's
// metadata block is identical in shape and can never drift.
export function generateToolMetadata(tool: Tool): Metadata {
  const url = `${SITE_URL}${tool.path}`;
  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: tool.ogTitle,
      description: tool.ogDescription,
      url,
      type: "website",
    },
  };
}

// SoftwareApplication structured data for a tool.
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
