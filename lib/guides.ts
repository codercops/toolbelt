// Single source of truth for the guides collection. The guides index, per-guide
// metadata, JSON-LD (Article, HowTo, BreadcrumbList), social share images, and
// sitemap all derive from this array — adding a guide means adding one entry here
// (plus its route under app/guides/).

export interface GuideStep {
  name: string;
  text: string;
  url?: string;
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface Guide {
  slug: string;
  path: string;
  // Index card
  title: string;
  tagline: string;
  cardDescription: string;
  tags: string[];
  /** Theme-aware CSS variable name, e.g. "--sky" (accessible in both themes). */
  accentVar: string;
  /** Raw hex for the decorative glow and OG card accents. */
  accentHex: string;
  // Metadata
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  // Dates
  publishedAt: string; // ISO date string (YYYY-MM-DD)
  updatedAt?: string; // ISO date string (YYYY-MM-DD)
  // Reading duration
  readingTime: string;
  /** ISO 8601 duration string for HowTo schema (e.g. "PT4M"). */
  totalTime?: string;
  // Steps for HowTo structured data and guided walkthrough
  steps: GuideStep[];
  // Related tools
  relatedTools?: string[];
  // FAQs
  faqs?: GuideFaq[];
  sitemapPriority: number;
  /** ISO date string (YYYY-MM-DD) overriding build-time git history for the sitemap. */
  lastModified?: string;
}

export const GUIDES: Guide[] = [
  {
    slug: "url-encode-string",
    path: "/guides/url-encode-string",
    title: "How to URL Encode a String",
    tagline: "URL Encoding Guide",
    cardDescription:
      "Learn percent-encoding, choose between encodeURIComponent and encodeURI, handle + versus %20, and avoid double-encoding bugs.",
    tags: ["URLs", "JavaScript", "Encoding", "Web APIs"],
    accentVar: "--cyan",
    accentHex: "#00E5C7",
    metaTitle: "How to URL Encode a String: encodeURIComponent vs encodeURI",
    metaDescription:
      "Learn how to URL encode strings with percent-encoding, encodeURIComponent, encodeURI, UTF-8, query-string spaces, and double-encoding examples.",
    ogTitle: "How to URL Encode a String - CODERCOPS Guides",
    ogDescription:
      "A practical guide to percent-encoding, encodeURIComponent vs encodeURI, spaces, Unicode, and double encoding.",
    publishedAt: "2026-10-23",
    updatedAt: "2026-10-23",
    readingTime: "6 min read",
    totalTime: "PT6M",
    steps: [
      {
        name: "Choose what you are encoding",
        text: "Encode one value with encodeURIComponent, or encode a complete URL while preserving its structure with encodeURI.",
        url: "#step-1",
      },
      {
        name: "Encode the value",
        text: "The encoder converts the string to UTF-8 bytes and percent-encodes bytes that are not allowed in that context.",
        url: "#step-2",
      },
      {
        name: "Build query parameters safely",
        text: "Encode parameter names and values separately, then join them with = and &, rather than encoding the complete URL as one value.",
        url: "#step-3",
      },
      {
        name: "Decode once at the matching boundary",
        text: "Use decodeURIComponent for percent-encoded components and opt into treating plus signs as spaces only for form-style query data.",
        url: "#step-4",
      },
    ],
    faqs: [
      {
        q: "Should I use encodeURI or encodeURIComponent?",
        a: "Use encodeURIComponent for one URL component, such as a query parameter value. Use encodeURI for a complete URL whose separators such as ://, ?, &, and # must remain meaningful.",
      },
      {
        q: "Is a plus sign the same as %20?",
        a: "Not in every URL context. %20 is percent-encoding for a space. A plus sign represents a space in application/x-www-form-urlencoded data, but in a general URL it is a literal plus. The URL Encoder lets you choose whether + should be treated as a space while decoding.",
      },
      {
        q: "Why did my encoded value become %2520?",
        a: "That is usually double encoding: % was encoded again as %25. Encode a value once at the boundary where it enters a URL, and decode it once at the boundary where it leaves one.",
      },
      {
        q: "Does URL encoding encrypt data?",
        a: "No. Percent-encoding changes representation for transport; it does not hide the value or provide confidentiality. Use HTTPS and appropriate encryption for sensitive data.",
      },
    ],
    relatedTools: ["url-encoder"],
    sitemapPriority: 0.8,
  },
  {
    slug: "format-and-validate-json",
    path: "/guides/format-and-validate-json",
    title: "How to Format and Validate JSON",
    tagline: "JSON Guide",
    cardDescription:
      "A step-by-step walkthrough for formatting messy JSON, validating syntax, catching common parsing errors, and converting documents locally.",
    tags: ["JSON", "Validation", "Formatting", "TypeScript"],
    accentVar: "--sky",
    accentHex: "#5AB5FF",
    metaTitle: "How to Format and Validate JSON - Developer Guide",
    metaDescription:
      "Step-by-step guide to formatting, validating syntax, and converting JSON to TypeScript, CSV, or YAML directly in your browser with zero data leaks.",
    ogTitle: "How to Format and Validate JSON - CODERCOPS Guides",
    ogDescription:
      "Learn how to format, validate, and convert JSON documents locally with syntax highlighting, error detection, and lossless precision.",
    publishedAt: "2026-10-23",
    updatedAt: "2026-10-23",
    readingTime: "4 min read",
    totalTime: "PT4M",
    steps: [
      {
        name: "Paste or load raw JSON data",
        text: "Copy your raw or unformatted JSON payload from an API response, config file, or clipboard into the input editor.",
        url: "#step-1",
      },
      {
        name: "Inspect syntax errors and validation alerts",
        text: "Check the syntax validator indicator. If the document is invalid, inspect the line and character indicators pinpointing missing quotes, trailing commas, or unbalanced braces.",
        url: "#step-2",
      },
      {
        name: "Format with custom indentation or minify",
        text: "Choose 2-space or 4-space indentation to pretty-print the document, or use Minify to strip all superfluous whitespace for production transport.",
        url: "#step-3",
      },
      {
        name: "Explore the collapsible tree view",
        text: "Switch to the Tree view to interactively inspect deep object hierarchies, expand or collapse nested nodes, and preserve high-precision numbers with lossless parsing.",
        url: "#step-4",
      },
      {
        name: "Convert JSON to TypeScript, CSV, or YAML",
        text: "Export your validated JSON data into strongly-typed TypeScript interfaces, clean tabular CSV rows, or human-friendly YAML configuration.",
        url: "#step-5",
      },
    ],
    faqs: [
      {
        q: "Is formatting JSON online safe for private or customer data?",
        a: "It is safe only if the tool runs 100% client-side. CODERCOPS JSON Formatter performs all parsing, validation, and conversion directly within your browser. No payloads are ever uploaded to a remote server.",
      },
      {
        q: "Why won't my JSON parse?",
        a: "JSON parsing fails on syntax errors such as unquoted object keys, single-quoted strings, or trailing commas after the last element. JSON requires double-quoted keys and strings, and does not allow trailing commas.",
      },
      {
        q: "Why do large integers change value?",
        a: "Large integers can parse successfully but lose precision once they exceed JavaScript's safe integer range (9,007,199,254,740,991). The formatter's lossless mode preserves the exact digits of 64-bit IDs and other high-precision numbers instead of rounding them.",
      },
      {
        q: "How can I convert JSON to TypeScript types?",
        a: "Use the TypeScript conversion tab inside the JSON Formatter tool. It analyzes property types across objects and arrays, automatically merging structures and generating typed interfaces.",
      },
    ],
    relatedTools: ["json-formatter"],
    sitemapPriority: 0.8,
  },
  {
    slug: "decode-jwt",
    path: "/guides/decode-jwt",
    title: "How to Decode a JWT and Read Its Claims",
    tagline: "JWT Guide",
    cardDescription:
      "Learn how to split and Base64URL-decode a JWT, interpret standard claims like exp and aud, and verify the signature before trusting a token.",
    tags: ["JWT", "Authentication", "Security", "Base64URL"],
    accentVar: "--violet",
    accentHex: "#9E7BFF",
    metaTitle: "How to Decode a JWT and Read Its Claims - Guide",
    metaDescription:
      "Decode a JWT by Base64URL-decoding its header and payload. Learn what iss, sub, aud, exp, and nbf mean, and why decoding is not verification.",
    ogTitle: "How to Decode a JWT and Read Its Claims - CODERCOPS Guides",
    ogDescription:
      "Step-by-step JWT decoding: read the header and claims, check expiry, and verify the signature before trusting a token.",
    publishedAt: "2026-10-23",
    updatedAt: "2026-10-23",
    readingTime: "6 min read",
    totalTime: "PT6M",
    steps: [
      {
        name: "Copy the compact token",
        text: "Take the token from the Authorization: Bearer header, an HttpOnly cookie, or your auth library. A signed JWT has three segments separated by two dots.",
        url: "#step-1",
      },
      {
        name: "Split it into three segments",
        text: "Split on \".\" to get the header, payload, and signature. If you do not get exactly three non-empty parts, the value is not a signed JWT.",
        url: "#step-2",
      },
      {
        name: "Base64URL-decode the header and payload",
        text: "Decode the first two segments with Base64URL, then parse the resulting UTF-8 text as JSON. The signature is binary data encoded for transport, not a JSON object.",
        url: "#step-3",
      },
      {
        name: "Read the claims and timestamps",
        text: "Inspect iss, sub, aud, exp, nbf, iat, and jti, plus any app-specific claims. Timestamps are seconds since the Unix epoch, not milliseconds.",
        url: "#step-4",
      },
      {
        name: "Verify the signature before trusting the token",
        text: "Use the issuer's key and a maintained JWT library to verify the signature, algorithm, audience, issuer, and time claims. Decoding alone proves nothing about authenticity.",
        url: "#step-5",
      },
    ],
    faqs: [
      {
        q: "Can I decode a JWT without the secret key?",
        a: "Yes. The header and payload are Base64URL-encoded, not encrypted, so anyone with the token can decode and read them. A key is only needed to create or verify the signature: the shared secret for HMAC, or the private and public halves of an RSA or ECDSA key pair.",
      },
      {
        q: "Is it safe to paste a JWT into an online decoder?",
        a: "Only if the tool processes the token locally in your browser. A JWT is a bearer credential, so a tool that uploads it to a server exposes it to that server and its logs. The CODERCOPS JWT Decoder runs entirely client-side.",
      },
      {
        q: "Does decoding a JWT verify that it is valid?",
        a: "No. Decoding only reveals the contents. Verification checks the signature with a trusted key and checks claims such as exp, nbf, aud, and iss. A token can decode perfectly and still be forged, expired, or issued for another audience.",
      },
      {
        q: "Why do JWT timestamps look like 1792713600?",
        a: "JWT NumericDate values count seconds since 1970-01-01 UTC. Multiply by 1000 to get JavaScript milliseconds, or use a decoder that displays the human-readable date for exp, nbf, and iat.",
      },
    ],
    relatedTools: ["jwt-decoder"],
    sitemapPriority: 0.8,
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getRelatedGuides(
  currentSlug: string,
  limit = 3,
  guides: Guide[] = GUIDES
): Guide[] {
  return guides.filter((g) => g.slug !== currentSlug).slice(0, limit);
}
