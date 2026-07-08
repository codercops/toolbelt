import type { Metadata } from "next";
import { SITE_URL, type Tool } from "./tools";

// Builds the per-tool Next Metadata from a manifest entry, so every tool page's
// metadata block is identical in shape and can never drift. The JSON-LD builders
// live in lib/jsonLd.ts.
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
      siteName: "CODERCOPS Tools",
      locale: "en_US",
    },
  };
}
