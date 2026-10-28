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
    slug: "wcag-color-contrast-ratio",
    path: "/guides/wcag-color-contrast-ratio",
    title: "WCAG Color Contrast Ratio: How to Check and Fix It",
    tagline: "Accessibility Guide",
    cardDescription:
      "Learn how the WCAG contrast ratio is calculated from relative luminance, the AA and AAA thresholds for text and UI components, and how to fix a failing color pair.",
    tags: ["WCAG", "Accessibility", "Color", "Contrast"],
    accentVar: "--fuchsia",
    accentHex: "#F26DF0",
    metaTitle: "WCAG Color Contrast Ratio: How to Check and Fix It",
    metaDescription:
      "Learn how the WCAG contrast ratio is calculated, the AA and AAA thresholds for text and UI components, and how to fix a failing color pair.",
    ogTitle: "WCAG Color Contrast Ratio: How to Check and Fix It - CODERCOPS Guides",
    ogDescription:
      "How WCAG contrast is calculated from relative luminance, which ratios text and UI need, what counts as large text, and how to fix a failing pair.",
    publishedAt: "2026-10-27",
    updatedAt: "2026-10-28",
    readingTime: "6 min read",
    totalTime: "PT6M",
    steps: [
      {
        name: "Enter the text and background colors",
        text: "In the Color Converter & Contrast Checker, type the text color into Text / Foreground and the background into Surface / Background. HEX, rgb() and hsl() values all work, with or without alpha.",
        url: "#step-1",
      },
      {
        name: "Read the contrast ratio",
        text: "The checker shows the ratio as x : 1, along with the relative luminance of each color. The ratio runs from 1 : 1 for identical colors to 21 : 1 for black on white.",
        url: "#step-2",
      },
      {
        name: "Match the ratio to your text size",
        text: "Check the four badges: Normal AA needs 4.5, Normal AAA 7.0, Large AA 3.0 and Large AAA 4.5. Pick the row that matches your text size; the checker does not measure your real font sizes.",
        url: "#step-3",
      },
      {
        name: "Fix a failing pair",
        text: "Change the lightness of one color, not its hue, then test again. Type a new value into the color input, then use Set as FG or Set as BG to move it into the checker, or use Swap colors to test the reverse pairing.",
        url: "#step-4",
      },
      {
        name: "Check icons, borders and focus rings against 3:1",
        text: "WCAG asks for at least 3:1 for UI components and graphics. The checker has no badge for this, so compare the displayed ratio with 3 yourself.",
        url: "#step-5",
      },
    ],
    faqs: [
      {
        q: "What is a good contrast ratio for text?",
        a: "For WCAG Level AA, normal text needs at least 4.5:1 and large text at least 3:1. Level AAA raises these to 7:1 and 4.5:1. Higher is easier to read, and 21:1 (black on white) is the maximum.",
      },
      {
        q: "How is the WCAG contrast ratio calculated?",
        a: "Each color is converted to a relative luminance between 0 and 1, then the ratio is (L1 + 0.05) / (L2 + 0.05), where L1 is the lighter color. Luminance weights linearized red, green and blue as 0.2126, 0.7152 and 0.0722.",
      },
      {
        q: "What counts as large text in WCAG?",
        a: "Text that is at least 18 point, or at least 14 point if bold. In CSS pixels that is about 24px regular or about 18.66px bold. Anything smaller is normal text.",
      },
      {
        q: "Do icons, borders and focus rings need contrast too?",
        a: "Yes. WCAG 2.1 success criterion 1.4.11 requires at least 3:1 against adjacent colors for UI components and the graphics needed to understand content. The CODERCOPS checker reports text ratings only, so compare its ratio with 3:1 for these.",
      },
      {
        q: "Does the checker handle transparent colors?",
        a: "Yes. A translucent background is composited over white, and a translucent foreground is composited over that background, before the ratio is calculated. Use an opaque color if you want to test a specific rendered result.",
      },
      {
        q: "Why does the checker show 4.47 when other tools show 4.48?",
        a: "The checker truncates the ratio to two decimals instead of rounding up, so a pair that misses a threshold never displays as if it met it. A ratio of 4.478 therefore reads 4.47, and the Normal AA badge shows FAIL.",
      },
    ],
    relatedTools: ["color-converter"],
    sitemapPriority: 0.8,
  },
  {
    slug: "convert-between-binary-decimal-hexadecimal",
    path: "/guides/convert-between-binary-decimal-hexadecimal",
    title: "How to Convert Between Binary, Decimal, and Hexadecimal",
    tagline: "Number Bases Guide",
    cardDescription: "Convert binary, decimal, and hexadecimal by hand, understand positional notation, and use JavaScript safely for very large integers.",
    tags: ["Binary", "Hexadecimal", "JavaScript", "BigInt"],
    accentVar: "--violet",
    accentHex: "#9E7BFF",
    metaTitle: "How to Convert Binary, Decimal, and Hexadecimal",
    metaDescription: "Learn how to convert binary, decimal, and hexadecimal numbers by hand and in JavaScript, including negative values, parseInt, radix, and BigInt.",
    ogTitle: "How to Convert Between Binary, Decimal, and Hexadecimal - CODERCOPS Guides",
    ogDescription: "A practical guide to positional notation, hand conversion, hexadecimal bit groups, negative numbers, and exact JavaScript conversions.",
    publishedAt: "2026-10-23",
    updatedAt: "2026-10-23",
    readingTime: "7 min read",
    totalTime: "PT7M",
    steps: [
      { name: "Identify the source base", text: "Binary is base 2, decimal is base 10, and hexadecimal is base 16. A 0b, 0o, or 0x prefix can identify a value when the converter is set to auto-detect.", url: "#step-1" },
      { name: "Expand the digits by place value", text: "Multiply each digit by the source base raised to its position, counting from zero at the rightmost digit, then add the results.", url: "#step-2" },
      { name: "Convert the decimal value back by repeated division", text: "Divide by the destination base, record each remainder, and read the remainders from last to first. For binary and hexadecimal, grouping bits is often faster.", url: "#step-3" },
      { name: "Check the result in the converter", text: "Enter the integer in the Number Base Converter and compare its binary, decimal, hexadecimal, and optional two’s-complement outputs.", url: "#step-4" },
    ],
    faqs: [
      { q: "How do I convert binary 101101 to decimal?", a: "Expand the place values: 1×32 + 0×16 + 1×8 + 1×4 + 0×2 + 1×1 = 45. Therefore, 101101₂ = 45₁₀." },
      { q: "Why is one hexadecimal digit four bits?", a: "Hexadecimal has 16 possible digits, and 16 equals 2⁴. Each hex digit therefore maps exactly to a four-bit group." },
      { q: "Can JavaScript convert integers larger than 2^53 exactly?", a: "Use BigInt for integers beyond Number.MAX_SAFE_INTEGER. The Number Base Converter uses BigInt internally, so it preserves arbitrary-size integer digits instead of rounding them through Number." },
      { q: "How are negative binary numbers represented?", a: "A minus sign is a mathematical negative value. In a fixed-width computer representation, two’s complement uses 2^width plus the negative value; the converter supports signed 8-, 16-, 32-, and 64-bit widths and reports values that do not fit." },
    ],
    relatedTools: ["number-base-converter"],
    sitemapPriority: 0.8,
  },
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
  {
    slug: "create-a-professional-invoice",
    path: "/guides/create-a-professional-invoice",
    title: "How to Create a Professional Invoice for Free",
    tagline: "Invoicing Guide",
    cardDescription:
      "A practical walkthrough of the details a client expects on an invoice, how to number and total one, and how to export a clean PDF without paid software.",
    tags: ["Invoicing", "Freelancing", "Small Business", "PDF"],
    accentVar: "--green",
    accentHex: "#3FDD6B",
    metaTitle: "How to Create a Professional Invoice for Free - Guide",
    metaDescription:
      "What a professional invoice must include, how to number and total one, and how to export a clean PDF in your browser for free.",
    ogTitle: "How to Create a Professional Invoice for Free - CODERCOPS Guides",
    ogDescription:
      "What to include on an invoice, how to handle tax and payment terms, and how to make a free PDF in your browser.",
    publishedAt: "2026-10-23",
    updatedAt: "2026-10-23",
    readingTime: "6 min read",
    totalTime: "PT6M",
    steps: [
      {
        name: "Collect the details both sides need",
        text: "Write down your trading name, address and contact details, the client's legal name and billing address, and any purchase order or reference number they asked for. Having these ready avoids a second round of emails before the invoice can be paid.",
        url: "#step-1",
      },
      {
        name: "Number the invoice and set the dates",
        text: "Give every invoice a unique, sequential number such as 2026-014, and never reuse one. Add the issue date and a due date calculated from your payment terms, so the client knows exactly when payment is expected.",
        url: "#step-2",
      },
      {
        name: "Describe the work in clear line items",
        text: "List each deliverable with a description, quantity and rate. Use the quantity for hours, days or a fixed count so that quantity times rate gives the amount, and put the details the client recognises from the quote in the description.",
        url: "#step-3",
      },
      {
        name: "Total it, then add tax if it applies",
        text: "The generator multiplies each quantity by its rate, adds the line amounts into a subtotal, then applies a single tax rate. If you agreed a discount, enter the discounted rate on the line itself, because the generator has no separate discount row. Use one currency throughout the document.",
        url: "#step-4",
      },
      {
        name: "Export a clean PDF and send it",
        text: "Check the totals and payment details, then export a PDF so the layout cannot shift on another device. The CODERCOPS Invoice Generator builds the PDF in your browser and keeps the data local; send the file with a short email that repeats the due date.",
        url: "#step-5",
      },
    ],
    faqs: [
      {
        q: "What is the difference between an invoice and a receipt?",
        a: "An invoice asks the client to pay for work that has been delivered, and usually includes payment terms and a due date. A receipt confirms that a payment has already been received. Keep both when you need a record of the full transaction.",
      },
      {
        q: "Do I need to charge tax on my invoice?",
        a: "It depends on where you and your client are, what you are selling, and whether you are registered for VAT, GST or sales tax. This guide is general information rather than tax advice: check the rules for your jurisdiction, or ask an accountant before adding or omitting tax.",
      },
      {
        q: "How should I number my invoices?",
        a: "Use a unique sequence without gaps, such as 2026-001, 2026-002, and so on. A year prefix makes older invoices easier to find. If you void an invoice, keep the number in your records instead of reusing it for a different job.",
      },
      {
        q: "What payment terms should I put on an invoice?",
        a: "Common terms are Net 7, Net 14 or Net 30, meaning payment is due that many days after the issue date. State the due date explicitly as well. Only mention late fees when they are agreed in your contract and allowed by local law.",
      },
      {
        q: "Can I create an invoice without sending my data to a website?",
        a: "Yes. The CODERCOPS Invoice Generator runs entirely in your browser: the details you type are used to render the preview and PDF locally and are not uploaded. Nothing is stored until you click Save, so closing the tab first loses what you typed; the invoices you save, and your sender details, stay in this browser until you delete them.",
      },
    ],
    relatedTools: ["invoice-generator"],
    sitemapPriority: 0.8,
  },
  {
    slug: "what-is-base64",
    path: "/guides/what-is-base64",
    title: "What Is Base64? Binary-to-Text Encoding Explained",
    tagline: "Base64 Guide",
    cardDescription:
      "Learn what Base64 is, how it turns binary bytes into printable ASCII text, why padding and Base64URL exist, and where encoding stops being safe.",
    tags: ["Base64", "Encoding", "Web Development", "Security"],
    accentVar: "--amber",
    accentHex: "#FFB547",
    metaTitle: "What Is Base64? Binary-to-Text Encoding Explained",
    metaDescription:
      "Base64 is a binary-to-text encoding, not encryption. Learn how it works, why padding matters, Base64URL, common uses, and its security limits.",
    ogTitle: "What Is Base64? A Practical Guide - CODERCOPS Guides",
    ogDescription:
      "Base64 is not encryption. Learn how encoding works, padding, URL-safe Base64, common uses, and security limitations.",
    publishedAt: "2026-10-23",
    updatedAt: "2026-10-23",
    readingTime: "7 min read",
    totalTime: "PT7M",
    steps: [
      {
        name: "Convert the input to bytes",
        text: "Base64 operates on bytes, not characters. Text is first encoded with a character encoding such as UTF-8, while images and files are already sequences of bytes.",
        url: "#step-1",
      },
      {
        name: "Group the bytes in threes",
        text: "Take three bytes at a time, which is 24 bits. If the final group is shorter, it is padded so it can still be processed as a complete group.",
        url: "#step-2",
      },
      {
        name: "Split each group into four 6-bit values",
        text: "Divide the 24 bits into four 6-bit numbers. Each number is between 0 and 63 and maps to one character in the Base64 alphabet.",
        url: "#step-3",
      },
      {
        name: "Map the values to Base64 characters",
        text: "Values 0 to 25 map to A-Z, 26 to 51 to a-z, 52 to 61 to 0-9, 62 to +, and 63 to /. A final group of one byte gets two = characters; two bytes get one.",
        url: "#step-4",
      },
      {
        name: "Decode with the matching alphabet",
        text: "Reverse the mapping to recover the original bytes. Use Base64URL instead of standard Base64 when the output must travel in a URL or a JWT, and never treat either form as encryption.",
        url: "#step-5",
      },
    ],
    faqs: [
      {
        q: "Is Base64 encryption?",
        a: "No. Base64 is a reversible encoding with no key. Anyone can decode it back to the original bytes, so it provides no confidentiality. Use TLS for data in transit and a proper encryption scheme such as AES-GCM when you need to protect stored data.",
      },
      {
        q: "Can I decode Base64 without a key?",
        a: "Yes. A standard Base64 decoder only needs the encoded string and the correct alphabet. If the value was encrypted before it was Base64-encoded, you still need the decryption key, but the Base64 layer itself adds no protection.",
      },
      {
        q: "Why does Base64 end with one or two equals signs?",
        a: "The equals signs are padding. Base64 converts every three bytes into four characters. If one input byte is left over, two = characters complete the final four-character group; if two bytes are left over, one = character completes it. The output length then stays a multiple of four.",
      },
      {
        q: "What is the difference between Base64 and Base64URL?",
        a: "Base64URL is a URL-safe variant of Base64. It replaces + with - and / with _, and it usually omits padding = because those characters have special meanings in URLs. JWTs use Base64URL for their header and payload segments.",
      },
      {
        q: "Does Base64 make data smaller?",
        a: "No. Base64 makes data larger. Every three input bytes become four output characters, so the encoded form is about 33% bigger before any line breaks or metadata. It is a transport and text-safety trade-off, not compression.",
      },
      {
        q: "Is it safe to store secrets as Base64?",
        a: "No. Base64 only changes how bytes are represented, so a Base64-encoded password, API key, or token is just as readable as the original to anyone who can access it. Kubernetes Secrets, for example, are Base64-encoded by default and still need encryption at rest and strict access control.",
      },
    ],
    relatedTools: ["base64"],
    sitemapPriority: 0.8,
  },
  {
    slug: "test-regex-in-javascript",
    path: "/guides/test-regex-in-javascript",
    title: "How to Test a Regular Expression in JavaScript",
    tagline: "Regex Guide",
    cardDescription:
      "Test a JavaScript regular expression, read its flags and capture groups, use $1 and $<name> in replacements, and avoid empty-match and backtracking surprises.",
    tags: ["Regex", "JavaScript", "Capture groups", "Debugging"],
    accentVar: "--cyan",
    accentHex: "#00E5C7",
    metaTitle: "How to Test a Regular Expression in JavaScript",
    metaDescription:
      "Test a JavaScript regex with test(), matchAll() and replace(). Learn flags, named groups, $1 and $<name>, empty matches, escaping and backtracking.",
    ogTitle: "How to Test a Regular Expression in JavaScript - CODERCOPS Guides",
    ogDescription:
      "A practical guide to testing JavaScript regexes: flags, capture groups, replacement tokens, empty matches, escaping and catastrophic backtracking.",
    publishedAt: "2026-10-26",
    updatedAt: "2026-10-26",
    readingTime: "8 min read",
    totalTime: "PT8M",
    steps: [
      {
        name: "Write the pattern and choose flags",
        text: "Type the pattern without the surrounding slashes and switch on the flags you need: g for every match, i to ignore case, and m, s, u or y when the text calls for them.",
        url: "#step-1",
      },
      {
        name: "Paste text that should and should not match",
        text: "Use sample text with matching lines, near misses and empty lines, so you see what the pattern accepts as well as what it rejects.",
        url: "#step-2",
      },
      {
        name: "Read the matches and capture groups",
        text: "Check the highlighted matches, then the match details: each match's position, its numbered groups and its named groups.",
        url: "#step-3",
      },
      {
        name: "Preview the replacement",
        text: "Type a replacement such as $3/$2/$<year> and check the result. Without the g flag only the first match is replaced.",
        url: "#step-4",
      },
      {
        name: "Carry the pattern into your code",
        text: "Use the same pattern and flags in a regex literal or new RegExp(pattern, flags). Double the backslashes when the pattern is in a string, and do not reuse a regex with the g flag across test() calls.",
        url: "#step-5",
      },
    ],
    faqs: [
      {
        q: "How do I test a regex in JavaScript without writing code?",
        a: "Paste the pattern and some sample text into the Regex Tester. It runs your browser's own RegExp engine, so the result matches what the same pattern does in your code. Every match is highlighted and listed with its position and capture groups, and a replace field previews the result.",
      },
      {
        q: "Why does my regex work in the tester but not in Python or PHP?",
        a: "Regex flavors differ. The tester uses the JavaScript flavor only, so a pattern that relies on another flavor's syntax, such as possessive quantifiers, is not valid there. Check the pattern against the engine that will run it.",
      },
      {
        q: "Why does regex.test() return true and then false for the same text?",
        a: "A regex with the g or y flag remembers where its last match ended in its lastIndex property, and the next call starts from there. Calling test() twice on the same text can therefore give true and then false. Drop the g flag when you only need a yes or no answer, or set lastIndex back to 0 before each call.",
      },
      {
        q: "How much text can the Regex Tester handle?",
        a: "The test text is limited to 100,000 characters, and at most 1,000 matches are listed. Past 1,000 the heading says it is showing the first 1,000. These limits do not stop a slow pattern: catastrophic backtracking can still make the page wait.",
      },
      {
        q: "Is my text sent to a server?",
        a: "No. Matching and replacing happen in your browser, and nothing you type is uploaded.",
      },
    ],
    relatedTools: ["regex-tester"],
    sitemapPriority: 0.8,
  },
  {
    slug: "make-a-table-in-markdown",
    path: "/guides/make-a-table-in-markdown",
    title: "How to Make a Table in Markdown",
    tagline: "Markdown Guide",
    cardDescription:
      "Write a Markdown table with a header row and a separator row, align the columns, escape pipes, and fix a table that will not render. Plus task lists, strikethrough, code fences and autolinks.",
    tags: ["Markdown", "GFM", "Tables", "GitHub"],
    accentVar: "--green",
    accentHex: "#3FDD6B",
    metaTitle: "How to Make a Table in Markdown (GFM Syntax Guide)",
    metaDescription:
      "Make a Markdown table with a header row, a separator row and pipes. Align columns, escape pipes, fix a table that won't render, and preview it live.",
    ogTitle: "How to Make a Table in Markdown - CODERCOPS Guides",
    ogDescription:
      "A practical guide to GitHub-flavored Markdown tables: the header and separator rows, alignment, escaping pipes, common mistakes, and the other GFM features people use next.",
    publishedAt: "2026-10-27",
    updatedAt: "2026-10-27",
    readingTime: "7 min read",
    totalTime: "PT7M",
    steps: [
      {
        name: "Write the header row",
        text: "Put the column names between pipes on one line, such as | Name | Role |. A table always has a header row; leave the cells empty if you do not want visible headings.",
        url: "#step-1",
      },
      {
        name: "Add the separator row",
        text: "On the next line, write one group of hyphens for each column, such as | --- | --- |. Use a colon at the left, right or both ends of a group to align that column left, right or center. The number of columns must match the header row.",
        url: "#step-2",
      },
      {
        name: "Add one line for each data row",
        text: "Write each row on its own line with a pipe between the cells. A row with fewer cells gets empty cells, and extra cells are ignored. The pipes do not have to line up.",
        url: "#step-3",
      },
      {
        name: "Escape pipes and mark line breaks",
        text: "Write \\| for a pipe that belongs in a cell, including inside inline code, and use <br> for a line break inside a cell. Cells cannot hold lists, headings or code blocks.",
        url: "#step-4",
      },
      {
        name: "Leave a blank line after the table and preview it",
        text: "A non-blank line right after the last row becomes another row, so end the table with a blank line. Then check the result in the Markdown Live Preview.",
        url: "#step-5",
      },
    ],
    faqs: [
      {
        q: "Can a Markdown table have merged cells or column widths?",
        a: "No. The GitHub Flavored Markdown table syntax has no way to merge cells or to set column widths. The Markdown Live Preview does render an HTML table that you write in your Markdown, after sanitizing it, but other sites may remove HTML, so check where the Markdown will be shown.",
      },
      {
        q: "Do the pipes in a Markdown table have to line up?",
        a: "No. The spaces between a pipe and the cell content are trimmed, so a table written as |a|b| works the same as a neatly padded one. Lining the pipes up only makes the source easier to read.",
      },
      {
        q: "How do I make a Markdown table without a header?",
        a: "You cannot leave the header row out, because a table is defined as a header row, a separator row and the data rows. Leave the header cells empty, as in |  |  |, and the table is rendered with an empty header.",
      },
      {
        q: "Why does my table work in the preview but not on another site?",
        a: "Tables are an extension in GitHub Flavored Markdown. Original Markdown and plain CommonMark have no table syntax, so a site needs GFM or its own table extension to render one. Check which flavor the site uses.",
      },
      {
        q: "Is my Markdown uploaded when I use the preview?",
        a: "No. Parsing, sanitizing, previewing and exporting all happen in your browser, and your document never leaves the tab.",
      },
    ],
    relatedTools: ["markdown-preview"],
    sitemapPriority: 0.8,
  },
  {
    slug: "read-and-write-cron-expressions",
    path: "/guides/read-and-write-cron-expressions",
    title: "How to Read and Write a Cron Expression",
    tagline: "Cron Guide",
    cardDescription:
      "Read the five cron fields, write ranges, steps and names, find the schedule you need, and avoid the day-of-month and day-of-week, step and time zone surprises.",
    tags: ["Cron", "Scheduling", "crontab", "DevOps"],
    accentVar: "--sky",
    accentHex: "#5AB5FF",
    metaTitle: "How to Read and Write a Cron Expression",
    metaDescription:
      "Learn cron expression syntax: the five fields, ranges, steps and names, common schedules, the day-of-month and day-of-week rule, macros and time zones.",
    ogTitle: "How to Read and Write a Cron Expression - CODERCOPS Guides",
    ogDescription:
      "A practical guide to cron syntax: the five fields, lists, ranges and steps, common schedules, the day rule, macros, time zones and how Quartz style differs.",
    publishedAt: "2026-10-27",
    updatedAt: "2026-10-27",
    readingTime: "9 min read",
    totalTime: "PT9M",
    steps: [
      {
        name: "Write the five fields in order",
        text: "Put the minute, hour, day of month, month and day of week on one line, separated by spaces. Use * for any value, so * * * * * runs every minute.",
        url: "#step-1",
      },
      {
        name: "Narrow each field with lists, ranges, steps and names",
        text: "Use a comma for a list (9,17), a hyphen for an inclusive range (9-17), a slash for a step (*/15 or 9-17/2) and three-letter names for the month and the weekday (MON-FRI).",
        url: "#step-2",
      },
      {
        name: "Check the day-of-month and day-of-week rule",
        text: "When neither day field starts with *, a day matches if either field matches. When one of them starts with *, both have to match.",
        url: "#step-3",
      },
      {
        name: "Read it back in the Cron Expression Explainer",
        text: "Paste the expression into the explainer to see it in plain English, field by field, with the next five run times in UTC or your local time.",
        url: "#step-4",
      },
      {
        name: "Check the time zone where the job will run",
        text: "An expression has no time zone of its own. It fires by the clock of the system that runs it, so confirm which time zone that scheduler uses before you rely on a local time.",
        url: "#step-5",
      },
    ],
    faqs: [
      {
        q: "How do I run a cron job every 5 minutes?",
        a: "Use */5 * * * *. The */5 in the minute field is a step of 5 starting from 0, so it runs at minutes 0, 5, 10 and so on up to 55 of every hour. The Cron Expression Explainer reads it as \"Every 5 minutes\".",
      },
      {
        q: "Is Sunday 0 or 7 in cron?",
        a: "Both. The day-of-week field takes 0 to 7, and 0 and 7 are both Sunday, so 0 0 * * 0 and 0 0 * * 7 are the same schedule. You can also write SUN.",
      },
      {
        q: "Why did my monthly cron job skip some months?",
        a: "A day that a month does not have never matches. 0 0 31 * * runs only in the months that have 31 days, so it is skipped in February, April, June, September and November. Standard five-field cron has no \"last day of the month\" syntax.",
      },
      {
        q: "Can cron run a job every 10 seconds?",
        a: "Not with five fields: the smallest unit is a minute. Schedulers that use a Quartz-style expression add a seconds field at the start, which the Cron Expression Explainer does not read.",
      },
      {
        q: "Is my cron expression sent to a server?",
        a: "No. Parsing, describing and working out the run times all happen in your browser. Nothing you type is uploaded.",
      },
    ],
    relatedTools: ["cron-explainer"],
    sitemapPriority: 0.8,
  },
  {
    slug: "convert-camelcase-snake-case-kebab-case",
    path: "/guides/convert-camelcase-snake-case-kebab-case",
    title: "How to Convert Between camelCase, snake_case and kebab-case",
    tagline: "Naming Conventions Guide",
    cardDescription:
      "See what camelCase, PascalCase, snake_case, CONSTANT_CASE and kebab-case look like, where each is used, and how to convert a name from one to another, acronyms and numbers included.",
    tags: ["camelCase", "snake_case", "kebab-case", "Naming"],
    accentVar: "--lime",
    accentHex: "#A6F36B",
    metaTitle: "How to Convert camelCase, snake_case and kebab-case",
    metaDescription:
      "What camelCase, PascalCase, snake_case, CONSTANT_CASE and kebab-case look like, where each is used, and how to convert between them, with acronyms and numbers.",
    ogTitle: "How to Convert Between camelCase, snake_case and kebab-case - CODERCOPS Guides",
    ogDescription:
      "A practical guide to naming styles: what each looks like, where it is used, how a name is split into words, and what happens to acronyms and numbers.",
    publishedAt: "2026-10-27",
    updatedAt: "2026-10-27",
    readingTime: "7 min read",
    totalTime: "PT7M",
    steps: [
      {
        name: "Enter the names, one per line",
        text: "Paste or type one or more names. The Text Case Converter works through every line separately and ignores extra spaces around the words.",
        url: "#step-1",
      },
      {
        name: "Copy the style you need",
        text: "The converter shows all ten styles at once, each with its own Copy button. Take camelCase for JavaScript variables, snake_case for Python, and kebab-case for URLs.",
        url: "#step-2",
      },
      {
        name: "Check acronyms and brand names",
        text: "Every word is lowercased before the words are joined, so HTTPServerError becomes HttpServerError in PascalCase, and a name such as iPhone or OAuth2 is split at its capital letters. Fix these by hand.",
        url: "#step-3",
      },
      {
        name: "Follow your language's style guide",
        text: "Check the naming rules of your language or team, such as PEP 8 for Python or the Google JavaScript Style Guide, and adjust the result where they differ.",
        url: "#step-4",
      },
      {
        name: "Use hyphens in URLs",
        text: "Google recommends separating the words in a URL with hyphens instead of underscores, so use kebab-case there and keep the case of each URL consistent.",
        url: "#step-5",
      },
    ],
    faqs: [
      {
        q: "What is the difference between camelCase and PascalCase?",
        a: "Both join the words with no separator and capitalize every new word. camelCase starts with a lowercase letter, as in userName, and PascalCase starts with an uppercase letter, as in UserName. The Google JavaScript Style Guide calls them lowerCamelCase and UpperCamelCase.",
      },
      {
        q: "How do I convert camelCase to snake_case?",
        a: "Split the name where a lowercase letter or a digit meets a capital letter, lowercase every word and join the words with underscores: getUserById becomes get_user_by_id. The Text Case Converter does this for every line you paste, and gives you the other styles at the same time.",
      },
      {
        q: "Should I use hyphens or underscores in URLs?",
        a: "Hyphens. Google recommends separating the words in a URL with hyphens instead of underscores, because hyphens help users and search engines better identify concepts in the URL, so kebab-case is the style to use for the words in a URL path.",
      },
      {
        q: "Why did the converter lowercase my acronym?",
        a: "It lowercases every word before joining them, so XMLHttpRequest becomes xmlHttpRequest and HTTPServerError becomes HttpServerError. That matches the Google JavaScript Style Guide, which writes xmlHttpRequest and newCustomerId. PEP 8 asks for HTTPServerError in a Python class name, so change those by hand.",
      },
      {
        q: "Is my text uploaded to a server?",
        a: "No. All conversion runs in your browser. The text you paste never leaves your tab.",
      },
    ],
    relatedTools: ["case-converter"],
    sitemapPriority: 0.8,
  },
  {
    slug: "uuid-v4-vs-v7-generate-uuid",
    path: "/guides/uuid-v4-vs-v7-generate-uuid",
    title: "UUID v4 vs v7, and How to Generate a UUID",
    tagline: "Identifiers Guide",
    cardDescription:
      "What a UUID is and how it is written, how version 4 (random) differs from version 7 (time ordered), when to pick each, and how to generate and inspect UUIDs in your browser.",
    tags: ["UUID", "UUID v4", "UUID v7", "RFC 9562"],
    accentVar: "--amber",
    accentHex: "#FFB547",
    metaTitle: "UUID v4 vs v7 and How to Generate a UUID",
    metaDescription:
      "What a UUID is, how v4 (random) and v7 (time ordered) differ, where the version and variant sit, the nil and max UUIDs, collision odds, and how to generate one.",
    ogTitle: "UUID v4 vs v7, and How to Generate a UUID - CODERCOPS Guides",
    ogDescription:
      "A practical guide to UUIDs: the 8-4-4-4-12 layout, version and variant bits, v4 against v7, the nil and max UUIDs, and how likely a collision is.",
    publishedAt: "2026-10-28",
    updatedAt: "2026-10-28",
    readingTime: "8 min read",
    totalTime: "PT8M",
    steps: [
      {
        name: "Choose version 4 or version 7",
        text: "In the UUID Generator & Inspector, pick UUID v4 for 122 random bits and nothing else, or UUID v7 for a UUID that starts with the Unix time in milliseconds and so sorts by creation time.",
        url: "#step-1",
      },
      {
        name: "Set the quantity",
        text: "Enter a quantity from 1 to 100. The random bits come from crypto.getRandomValues in your browser.",
        url: "#step-2",
      },
      {
        name: "Pick the format and generate",
        text: "Tick Uppercase or No hyphens if you need them, then press Generate UUIDs. A version 7 batch is sorted so the list comes out in ascending order.",
        url: "#step-3",
      },
      {
        name: "Copy one UUID or the whole list",
        text: "Each UUID has its own copy button, and Copy all copies the list with one UUID per line.",
        url: "#step-4",
      },
      {
        name: "Inspect a UUID you already have",
        text: "Paste a UUID, with or without hyphens and in any case, into the inspector to see its version, its variant, whether it is the nil or max UUID, and for version 7 the timestamp in milliseconds and as an ISO date.",
        url: "#step-5",
      },
    ],
    faqs: [
      {
        q: "What is the difference between UUID v4 and v7?",
        a: "A version 4 UUID is 122 random bits plus the version and variant bits. A version 7 UUID starts with a 48-bit Unix timestamp in milliseconds, so UUIDs made later sort later, and the bits after the timestamp are random apart from the version and variant.",
      },
      {
        q: "Should I use UUID v4 or v7?",
        a: "Use v7 when you want identifiers that sort by creation time, such as database keys, and v4 when you only need a unique value and do not want it to carry a time. RFC 9562 recommends v7 over the older time-based v1 and v6 where there is no legacy need for them.",
      },
      {
        q: "How do I generate a UUID?",
        a: "Open the UUID Generator & Inspector, choose UUID v4 or UUID v7, set a quantity from 1 to 100 and press Generate UUIDs. Everything runs in your browser and the random bits come from crypto.getRandomValues.",
      },
      {
        q: "Can two UUIDs be the same?",
        a: "In theory yes, but with 122 random bits a version 4 collision is very unlikely: by the standard birthday approximation you would need to generate about 103 trillion UUIDs for a one in a billion chance of a single duplicate. RFC 9562 gives no collision figure, and it says true global uniqueness cannot be guaranteed.",
      },
      {
        q: "Is a UUID safe to use as a secret token?",
        a: "No. RFC 9562 says implementations should not assume UUIDs are hard to guess, and that UUIDs must not be used as security capabilities, meaning identifiers that grant access just by being possessed.",
      },
    ],
    relatedTools: ["uuid-generator"],
    sitemapPriority: 0.8,
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

// Reverse lookup for tool pages: every guide that names the tool in its
// relatedTools array. Keeps the guide -> tool mapping declared in one place.
export function getGuidesForTool(
  toolSlug: string,
  guides: Guide[] = GUIDES
): Guide[] {
  return guides.filter((g) => g.relatedTools?.includes(toolSlug));
}

export function getRelatedGuides(
  currentSlug: string,
  limit = 3,
  guides: Guide[] = GUIDES
): Guide[] {
  return guides.filter((g) => g.slug !== currentSlug).slice(0, limit);
}
