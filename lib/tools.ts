// Single source of truth for the tool set. The home grid, per-tool metadata,
// JSON-LD, hero, FAQ, CTA, sitemap, web manifest, and command palette all derive
// from this array — adding a tool means adding one entry here (plus its route).

export interface ToolFaq {
  q: string;
  a: string;
}

export interface ToolCta {
  headline: string;
  sub: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export interface Tool {
  slug: string;
  path: string;
  // Home card
  title: string;
  tagline: string;
  cardDescription: string;
  features: string[];
  /** Theme-aware CSS variable name, e.g. "--sky" (accessible in both themes). */
  accentVar: string;
  /** Raw hex for the decorative hover glow only (cosmetic, low opacity). */
  accentHex: string;
  // Metadata
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  // Hero
  heroBreadcrumb: string;
  heroHeading: string;
  /** Substring of heroHeading rendered in a dimmed span (e.g. "&"). */
  heroDim: string;
  heroDescription: string;
  // JSON-LD
  jsonLdName: string;
  jsonLdDescription: string;
  applicationCategory: "DeveloperApplication" | "BusinessApplication";
  // FAQ + CTA
  faqs: ToolFaq[];
  cta: ToolCta;
  sitemapPriority: number;
}

const CTA_PROJECTS = "https://www.codercops.com/projects";
const CTA_CONTACT = "https://www.codercops.com/contact";

export const TOOLS: Tool[] = [
  {
    slug: "json-formatter",
    path: "/json-formatter",
    title: "JSON Formatter & Validator",
    tagline: "Formatter",
    cardDescription:
      "Format, validate, minify. Syntax-highlighted output with collapsible tree view, plus JSON → CSV / TypeScript / YAML conversion.",
    features: ["Beautify", "Validate", "Tree view", "TypeScript", "CSV", "YAML"],
    accentVar: "--sky",
    accentHex: "#5AB5FF",
    metaTitle: "JSON Formatter & Validator - Free Online Tool",
    metaDescription:
      "Free online JSON formatter, validator, and beautifier. Format, minify, and validate JSON instantly with syntax highlighting and JSON-to-TypeScript. No signup.",
    ogTitle: "JSON Formatter & Validator - CODERCOPS Tools",
    ogDescription:
      "Format, validate, and minify JSON with syntax highlighting and JSON-to-TypeScript conversion. Runs entirely in your browser.",
    heroBreadcrumb: "100% client-side",
    heroHeading: "JSON Formatter & Validator",
    heroDim: "&",
    heroDescription:
      "Paste your JSON below to format, validate, and convert it — all in your browser, nothing is uploaded.",
    jsonLdName: "JSON Formatter & Validator",
    jsonLdDescription:
      "Free online JSON formatter, validator, and minifier with syntax highlighting and JSON-to-TypeScript/CSV/YAML conversion.",
    applicationCategory: "DeveloperApplication",
    faqs: [
      {
        q: "Is my JSON uploaded anywhere?",
        a: "No. All formatting, validation, and conversion run locally in your browser. The JSON you paste never leaves your tab, is never sent to a server, and is never logged.",
      },
      {
        q: "Why does my JSON fail to validate?",
        a: "The usual causes are trailing commas, single quotes instead of double quotes, unquoted keys, and unbalanced brackets. The validator points to the line and character where parsing breaks so you can fix it quickly.",
      },
      {
        q: "Does it keep large numbers accurate?",
        a: "Yes. It parses with lossless-json, so very large integers and high-precision decimals keep every digit instead of being rounded by the browser's native JSON parser.",
      },
    ],
    cta: {
      headline: "Building an app that handles JSON APIs?",
      sub: "CODERCOPS builds production-grade backends, REST APIs, and full-stack applications for startups and businesses.",
      primaryLabel: "View our work",
      primaryHref: CTA_PROJECTS,
      secondaryLabel: "Get a free quote",
      secondaryHref: CTA_CONTACT,
    },
    sitemapPriority: 0.9,
  },
  {
    slug: "jwt-decoder",
    path: "/jwt-decoder",
    title: "JWT Decoder & Inspector",
    tagline: "Auth",
    cardDescription:
      "Decode any JWT into header, payload, and signature. Human-readable claims, expiry status, and a built-in HS256 encoder.",
    features: ["Decode", "Encode", "Health panel", "HS256/384/512", "URL share"],
    accentVar: "--violet",
    accentHex: "#9E7BFF",
    metaTitle: "JWT Decoder & Verifier - Free Online Tool",
    metaDescription:
      "Free online JWT decoder and verifier. Decode any token to read its header, payload, claims, and expiry, and verify HS/RS/ES signatures in your browser. No login.",
    ogTitle: "JWT Decoder & Verifier - CODERCOPS Tools",
    ogDescription:
      "Decode JWT tokens in-browser. Humanized claims, expiry status, built-in HS256 encoder.",
    heroBreadcrumb: "Decoder · Inspector · Encoder",
    heroHeading: "JWT Decoder & Inspector",
    heroDim: "&",
    heroDescription:
      "Paste any JWT token to instantly decode its header, payload, and claims — everything runs in your browser.",
    jsonLdName: "JWT Decoder & Inspector",
    jsonLdDescription:
      "Decode and inspect JWT tokens, view humanized claims, check expiry, and generate signed HS256/384/512 tokens — all in your browser.",
    applicationCategory: "DeveloperApplication",
    faqs: [
      {
        q: "What is a JWT?",
        a: "A JSON Web Token is a compact, URL-safe format for asserting claims between parties. It has three parts — header, payload, signature — separated by dots and encoded with base64url.",
      },
      {
        q: "Is it safe to paste my JWT here?",
        a: "Yes — all decoding happens locally in your browser. Nothing is sent to our servers, logged, or stored. That said, avoid pasting production access tokens into any online tool if you can help it.",
      },
      {
        q: "Can this tool verify JWT signatures?",
        a: "Yes. The Verify tab checks HMAC (HS256/384/512) signatures with your secret, and RSA, ECDSA, or PSS signatures with a PEM or JWK public key, all in your browser via WebCrypto. It can also fetch a JWKS URL to pick the right key. Your production apps should still verify server-side.",
      },
      {
        q: "What is the difference between decoding and verifying a JWT?",
        a: "Decoding just base64url-decodes the header and payload so you can read the claims; it does not prove the token is authentic. Verifying checks the signature against a secret or public key to confirm the token was issued by who it claims and has not been tampered with. This tool does both.",
      },
    ],
    cta: {
      headline: "Building an app with JWT authentication?",
      sub: "CODERCOPS implements secure auth systems — OAuth2, JWT, SSO, and custom identity solutions — for startups and enterprise apps.",
      primaryLabel: "See our projects",
      primaryHref: CTA_PROJECTS,
      secondaryLabel: "Let's build together",
      secondaryHref: CTA_CONTACT,
    },
    sitemapPriority: 0.9,
  },
  {
    slug: "base64",
    path: "/base64",
    title: "Base64 Encoder & Decoder",
    tagline: "Encoding",
    cardDescription:
      "Text, images, files — encode to Base64 or decode back. URL-safe variant, data URIs, and magic-byte file detection.",
    features: ["Text", "Image → URI", "Files", "URL-safe", "Auto-detect"],
    accentVar: "--amber",
    accentHex: "#FFB547",
    metaTitle: "Base64 Encoder & Decoder - Free Online Tool",
    metaDescription:
      "Free online Base64 encoder and decoder for text, images, and files. URL-safe Base64, data URIs, and magic-byte detection. Runs in your browser, no upload.",
    ogTitle: "Base64 Encoder & Decoder - CODERCOPS Tools",
    ogDescription:
      "Encode and decode Base64 for text, images, and files — all in your browser.",
    heroBreadcrumb: "Text · Image · File · Decode",
    heroHeading: "Base64 Encoder & Decoder",
    heroDim: "&",
    heroDescription:
      "Encode text, images, and files to Base64 — or decode any Base64 string — all in your browser with zero uploads.",
    jsonLdName: "Base64 Encoder & Decoder",
    jsonLdDescription:
      "Free online Base64 encoder and decoder for text, images, and files, with URL-safe variant and magic-byte detection.",
    applicationCategory: "DeveloperApplication",
    faqs: [
      {
        q: "What is Base64 encoding?",
        a: "Base64 is a way of representing binary data as ASCII text using 64 printable characters. It's widely used to embed images in HTML/CSS, transmit binary data in JSON, and carry credentials in HTTP headers.",
      },
      {
        q: "What's the difference between Base64 and Base64URL?",
        a: "Standard Base64 uses + and / characters. Base64URL is a URL-safe variant that replaces + with - and / with _ (and often omits padding =), so the output is safe to put in URLs and JWTs.",
      },
      {
        q: "Does my data get uploaded anywhere?",
        a: "No. All encoding and decoding runs entirely in your browser. Text, images, and files you paste or drop here never leave your tab.",
      },
      {
        q: "Why is Base64 output larger than the input?",
        a: "Base64 represents every 3 input bytes as 4 output characters, so the output is roughly 4/3 of the input — about 33% larger. That overhead is the trade-off for ASCII-safe transport.",
      },
      {
        q: "Can I encode an image or PDF to Base64?",
        a: "Yes. Drop or select any file and it is encoded to a Base64 string or a ready-to-use data URI. It works for images, PDFs, and other binary files, and every byte is processed in your browser.",
      },
    ],
    cta: {
      headline: "Building an API or system that handles binary data?",
      sub: "CODERCOPS builds production APIs, file storage systems, and data pipelines for startups and enterprises.",
      primaryLabel: "See our projects",
      primaryHref: CTA_PROJECTS,
      secondaryLabel: "Get a free quote",
      secondaryHref: CTA_CONTACT,
    },
    sitemapPriority: 0.9,
  },
  {
    slug: "invoice-generator",
    path: "/invoice-generator",
    title: "Invoice Generator",
    tagline: "Billing",
    cardDescription:
      "Fill in your details, preview live, and download a crisp invoice PDF. Saves invoices in your browser — reusable sender profile, deductions, and auto-numbering.",
    features: ["Live preview", "PDF export", "Saved locally", "Deductions", "Auto-number"],
    accentVar: "--lime",
    accentHex: "#A6F36B",
    metaTitle: "Free Invoice Generator - Make & Download PDF",
    metaDescription:
      "Free invoice generator: create professional invoices and download a PDF. Live preview, reusable sender profile, and auto-numbering, saved in your browser.",
    ogTitle: "Invoice Generator - CODERCOPS Tools",
    ogDescription:
      "Build invoices in your browser and download a crisp PDF. Saved locally, no account, no data leaves your tab.",
    heroBreadcrumb: "Builder · Saved locally · PDF",
    heroHeading: "Invoice Generator",
    heroDim: "Generator",
    heroDescription:
      "Fill in your details, watch the live preview, and download a clean invoice PDF. Everything is saved in your browser — no account, no server, no data leaves your tab.",
    jsonLdName: "Invoice Generator",
    jsonLdDescription:
      "Create, save, and download professional invoices as PDF. Reusable sender profile, line items with deductions, tax, and auto-incrementing invoice numbers — all stored locally in your browser.",
    applicationCategory: "BusinessApplication",
    faqs: [
      {
        q: "Where are my invoices stored?",
        a: "In your browser's local storage on this device. There is no backend and no account. Clearing your browser data or using a different device or browser will not carry the invoices over.",
      },
      {
        q: "Is the PDF a real, printable invoice?",
        a: "Yes. The PDF is drawn as vector text and lines, so it stays sharp at any zoom and the text is selectable. It matches the live preview and downloads with your invoice number as the filename.",
      },
      {
        q: "Can I reuse my details and edit past invoices?",
        a: "Your sender details are saved as a reusable profile that pre-fills every new invoice. Saved invoices can be edited, duplicated, or deleted, and numbers auto-increment from the highest one.",
      },
      {
        q: "Can I add tax and discounts to an invoice?",
        a: "Yes. Each line item takes a rate and quantity, and you can apply a tax rate and per-item deductions. The subtotal, tax, and total are calculated and rounded to the cent as you type.",
      },
    ],
    cta: {
      headline: "Need billing baked into your product?",
      sub: "CODERCOPS builds invoicing, payments, and subscription systems — Stripe, tax handling, PDF generation, and dashboards — for startups and enterprises.",
      primaryLabel: "See our projects",
      primaryHref: CTA_PROJECTS,
      secondaryLabel: "Let's build together",
      secondaryHref: CTA_CONTACT,
    },
    sitemapPriority: 0.9,
  },
];

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export const SITE_URL = "https://tools.codercops.com";

// The open-source repo. GITHUB_REPO is the "owner/name" slug used for the API.
export const GITHUB_REPO = "codercops/toolbelt";
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO}`;
