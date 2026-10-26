import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { getGuide, getRelatedGuides } from "@/lib/guides";
import { generateGuideMetadata } from "@/lib/toolMetadata";
import {
  guideArticleJsonLd,
  guideHowToJsonLd,
  guideBreadcrumbJsonLd,
  guideFaqJsonLd,
} from "@/lib/jsonLd";
import { Faq } from "@/components/shared/Faq";
import { GuideToolCta } from "@/components/shared/GuideToolCta";

const guide = getGuide("decode-jwt")!;
const relatedGuides = getRelatedGuides(guide.slug);

const exampleToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEwNDIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTI3MTM2MDAsImV4cCI6MTc5MjcxNzIwMH0.ZGVtby1zaWduYXR1cmUtcGxhY2Vob2xkZXI";

export const metadata: Metadata = generateGuideMetadata(guide);

export default function DecodeJwtGuidePage() {
  const faqData = guideFaqJsonLd(guide);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideArticleJsonLd(guide)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideHowToJsonLd(guide)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideBreadcrumbJsonLd(guide)) }}
      />
      {faqData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
        />
      )}

      <article className="mx-auto max-w-4xl w-full px-4 sm:px-6 pt-10 pb-20">
        <div className="mb-6 flex flex-wrap items-center gap-2 font-mono text-[10.5px] tracking-[0.22em] uppercase">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-[var(--fg-dim)]">
                /
              </li>
              <li>
                <Link href="/guides" className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">
                  Guides
                </Link>
              </li>
              <li aria-hidden="true" className="text-[var(--fg-dim)]">
                /
              </li>
              <li aria-current="page" className="text-[var(--fg)]">
                {guide.title}
              </li>
            </ol>
          </nav>
        </div>

        <header className="mb-10 pb-8 border-b border-[var(--hairline)]">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono uppercase tracking-wider font-medium"
              style={{
                backgroundColor: `color-mix(in srgb, var(${guide.accentVar}) 12%, transparent)`,
                color: `var(${guide.accentVar})`,
              }}
            >
              <BookOpen className="w-3 h-3" />
              {guide.tagline}
            </span>
            <div className="flex items-center gap-4 text-xs font-mono text-[var(--fg-dim)]">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Published {guide.publishedAt}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {guide.readingTime}
              </span>
            </div>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--fg)] leading-tight">
            {guide.title}
          </h1>

          <p className="mt-4 text-[16px] text-[var(--fg-muted)] leading-relaxed">
            {guide.cardDescription}
          </p>

          <GuideToolCta guide={guide} />
        </header>

        <div className="space-y-12">
          <section>
            <p className="text-[15px] text-[var(--fg-muted)] leading-relaxed">
              To decode a JWT, split the token at its two dots and Base64URL-decode the first
              two segments: the header and the payload. The result is readable JSON; the third
              segment is the signature, which decoding shows but does not verify.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              What a JWT contains
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                Most tokens people call JWTs are signed JWTs, or JWS compact serialization.
                They contain three Base64URL segments separated by dots:
              </p>
              <pre className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]">
                {`header.payload.signature`}
              </pre>
              <p>
                Here is a small example. The last segment is a placeholder, so this token is
                only for reading; a real signature can only be produced by the holder of the
                signing key.
              </p>
              <pre className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--lime)]">
                {exampleToken}
              </pre>
              <div className="overflow-x-auto rounded-lg border border-[var(--hairline)]">
                <table className="w-full text-left text-[13.5px]">
                  <thead className="bg-[var(--bg-raise)] font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Segment</th>
                      <th className="px-4 py-3 font-medium">Typical content</th>
                      <th className="px-4 py-3 font-medium">What decoding reveals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)] text-[var(--fg-muted)]">
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">header</td>
                      <td className="px-4 py-3">Algorithm, token type, and optional key ID</td>
                      <td className="px-4 py-3">How the token says it is signed</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">payload</td>
                      <td className="px-4 py-3">Registered and app-specific claims</td>
                      <td className="px-4 py-3">Identity, times, audience, and permissions</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">signature</td>
                      <td className="px-4 py-3">Raw signature bytes, encoded as Base64URL</td>
                      <td className="px-4 py-3">Nothing useful without the issuer&apos;s key</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[13.5px] text-[var(--fg-dim)]">
                Encrypted JWTs (JWE) are a different format with five segments. This guide covers
                the three-part signed tokens used by most auth providers.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-6">
              How to decode a JWT step by step
            </h2>
            <div className="space-y-8">
              {guide.steps.map((step, idx) => (
                <div
                  key={step.name}
                  id={`step-${idx + 1}`}
                  className="relative p-6 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] scroll-mt-20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--violet)]/10 border border-[var(--violet)]/30 font-mono text-xs font-bold text-[var(--violet)]">
                      {idx + 1}
                    </span>
                    <h3 className="font-display text-lg font-semibold text-[var(--fg)]">
                      {step.name}
                    </h3>
                  </div>
                  <p className="text-[14.5px] text-[var(--fg-muted)] leading-relaxed">
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              Decoding the segments in JavaScript
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                In Node.js, the <code className="font-mono text-[var(--fg)]">base64url</code>{" "}
                encoding handles the URL-safe alphabet and missing padding for you:
              </p>
              <pre className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]">
                {`const [headerPart, payloadPart] = token.split(".");
const decode = (part) =>
  JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

console.log(decode(headerPart));
console.log(decode(payloadPart));`}
              </pre>
              <p>
                Browsers do not have <code className="font-mono text-[var(--fg)]">Buffer</code>,
                so use <code className="font-mono text-[var(--fg)]">atob</code> after replacing{" "}
                <code className="font-mono text-[var(--fg)]">-</code> with{" "}
                <code className="font-mono text-[var(--fg)]">+</code>,{" "}
                <code className="font-mono text-[var(--fg)]">_</code> with{" "}
                <code className="font-mono text-[var(--fg)]">/</code>, and restoring the{" "}
                <code className="font-mono text-[var(--fg)]">=</code> padding. Then convert the
                binary string returned by <code className="font-mono text-[var(--fg)]">atob</code>{" "}
                to bytes and decode them with{" "}
                <code className="font-mono text-[var(--fg)]">TextDecoder</code>, because{" "}
                <code className="font-mono text-[var(--fg)]">atob</code> alone does not correctly
                decode non-ASCII UTF-8 claims:
              </p>
              <pre className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]">
                {`const decodePart = (part) => {
  const pad = part.length % 4 === 2 ? "==" : part.length % 4 === 3 ? "=" : "";
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return JSON.parse(new TextDecoder("utf-8").decode(bytes));
};`}
              </pre>
              <p>
                The JWT Decoder below does that for you and displays the claims in a readable
                form.
              </p>
              <p>For the example above, the decoded header and payload are:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)] mb-2">
                    Header
                  </div>
                  <pre className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]">
                    {`{
  "alg": "HS256",
  "typ": "JWT"
}`}
                  </pre>
                </div>
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)] mb-2">
                    Payload
                  </div>
                  <pre className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]">
                    {`{
  "sub": "user_1042",
  "role": "admin",
  "iat": 1792713600,
  "exp": 1792717200
}`}
                  </pre>
                </div>
              </div>
              <p className="text-[13.5px] text-[var(--fg-dim)]">
                The timestamps decode to 2026-10-23 00:00:00 and 01:00:00 UTC. The token is
                designed to expire one hour after it was issued.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              What the JWT claims mean
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                The payload is a JSON object called the claims set. Some claim names are
                registered by the JWT specification and have defined meanings:
              </p>
              <div className="overflow-x-auto rounded-lg border border-[var(--hairline)]">
                <table className="w-full text-left text-[13.5px]">
                  <thead className="bg-[var(--bg-raise)] font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Claim</th>
                      <th className="px-4 py-3 font-medium">Meaning</th>
                      <th className="px-4 py-3 font-medium">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)] text-[var(--fg-muted)]">
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">iss</td>
                      <td className="px-4 py-3">Issuer that created and signed the token</td>
                      <td className="px-4 py-3 font-mono">https://auth.example.com</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">sub</td>
                      <td className="px-4 py-3">Subject the token is about, usually a user ID</td>
                      <td className="px-4 py-3 font-mono">user_1042</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">aud</td>
                      <td className="px-4 py-3">Audience the token is intended for</td>
                      <td className="px-4 py-3 font-mono">api://orders</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">exp</td>
                      <td className="px-4 py-3">Expiration time; the token must not be accepted at or after it</td>
                      <td className="px-4 py-3 font-mono">1792717200</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">nbf</td>
                      <td className="px-4 py-3">Not before; the token must not be accepted before it</td>
                      <td className="px-4 py-3 font-mono">1792713600</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">iat</td>
                      <td className="px-4 py-3">Time the token was issued</td>
                      <td className="px-4 py-3 font-mono">1792713600</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">jti</td>
                      <td className="px-4 py-3">Unique token ID, useful for replay detection and revocation</td>
                      <td className="px-4 py-3 font-mono">9f1c2a7e</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <h3 className="font-display text-lg font-semibold text-[var(--fg)] pt-2">
                Custom claims and authorization data
              </h3>
              <p>
                Claims such as <code className="font-mono text-[var(--fg)]">role</code>,{" "}
                <code className="font-mono text-[var(--fg)]">plan</code>, or{" "}
                <code className="font-mono text-[var(--fg)]">tenant_id</code> are app-specific,
                not part of the JWT standard. They are still readable by anyone holding the token,
                so they must never contain passwords, API keys, or sensitive personal data. Treat
                them as hints until the signature and claim checks pass.
              </p>
            </div>
          </section>

          <section className="p-6 rounded-lg border border-[var(--amber)]/40 bg-[var(--bg-raise)]">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--amber)] mb-3">
              <ShieldAlert className="w-4 h-4" /> Decoding is not verification
            </div>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              What a decoded JWT does and does not prove
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                Base64URL is an encoding, not encryption. Anyone with the token can read every
                claim. Decoding tells you what a token claims; verification tells you whether
                those claims were signed by a trusted issuer and have not been altered.
              </p>
              <div className="overflow-x-auto rounded-lg border border-[var(--hairline)]">
                <table className="w-full text-left text-[13.5px]">
                  <thead className="bg-[var(--bg-base)] font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Question</th>
                      <th className="px-4 py-3 font-medium">Decoding</th>
                      <th className="px-4 py-3 font-medium">Verifying</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)] text-[var(--fg-muted)]">
                    <tr>
                      <td className="px-4 py-3">Needs a secret or public key?</td>
                      <td className="px-4 py-3">No</td>
                      <td className="px-4 py-3">Yes</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Proves who issued the token?</td>
                      <td className="px-4 py-3">No</td>
                      <td className="px-4 py-3">Yes, if the key is trusted</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Detects a modified payload?</td>
                      <td className="px-4 py-3">No</td>
                      <td className="px-4 py-3">Yes</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Safe for authorization decisions?</td>
                      <td className="px-4 py-3">No</td>
                      <td className="px-4 py-3">Only after claim checks</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Typical implementation</td>
                      <td className="px-4 py-3">Base64URL decode plus JSON parse</td>
                      <td className="px-4 py-3">JWT library and trusted key</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              JWT security checklist
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded border border-[var(--hairline)] bg-[var(--bg-raise)]">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[var(--cyan)] mb-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Always verify
                </div>
                <ul className="text-xs text-[var(--fg-muted)] space-y-1.5 list-disc list-inside">
                  <li>Verify the signature with a trusted key before accepting a token.</li>
                  <li>Pin the expected algorithms and reject <code className="font-mono text-[var(--fg)]">alg: none</code>.</li>
                  <li>Check <code className="font-mono text-[var(--fg)]">exp</code>, <code className="font-mono text-[var(--fg)]">nbf</code>, <code className="font-mono text-[var(--fg)]">aud</code>, and <code className="font-mono text-[var(--fg)]">iss</code>.</li>
                  <li>Use a maintained JWT library instead of hand-rolled crypto.</li>
                </ul>
              </div>
              <div className="p-4 rounded border border-[var(--hairline)] bg-[var(--bg-raise)]">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[var(--amber)] mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Never assume
                </div>
                <ul className="text-xs text-[var(--fg-muted)] space-y-1.5 list-disc list-inside">
                  <li>Do not treat a decoded payload as proof of identity or permission.</li>
                  <li>Do not put secrets or unnecessary personal data in claims.</li>
                  <li>Do not trust a token just because its expiry is in the future.</li>
                  <li>Do not use a third-party decoder that uploads tokens to a server.</li>
                </ul>
              </div>
            </div>
            <p className="mt-4 text-[14.5px] text-[var(--fg-muted)] leading-relaxed">
              A decoded token can also be expired, issued for another audience, or signed with
              an algorithm you did not expect. Those are all reasons to verify rather than just
              decode.
            </p>
          </section>

          <section className="p-6 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-raise)]">
            <h2 className="font-display text-xl font-semibold text-[var(--fg)] mb-3">
              Decode a token in your browser
            </h2>
            <p className="text-[14.5px] text-[var(--fg-muted)] leading-relaxed">
              The{" "}
              <Link href="/jwt-decoder" className="text-[var(--violet)] hover:underline">
                JWT Decoder &amp; Inspector
              </Link>{" "}
              splits and decodes the header and payload locally, shows human-readable claims and
              expiry status, and lets you verify supported signatures. Nothing is uploaded, which
              makes it a safer place to inspect a token than a service that posts it to a backend.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/jwt-decoder"
                className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-medium bg-[var(--violet)] text-black hover:opacity-90 transition-opacity"
              >
                Open JWT Decoder <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/json-formatter"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Format the decoded JSON <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {guide.faqs && guide.faqs.length > 0 && (
            <section className="pt-6 border-t border-[var(--hairline)]">
              <h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-6">
                &#47;&#47; Frequently Asked Questions
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {guide.faqs.map((f) => (
                  <Faq key={f.q} q={f.q} a={f.a} />
                ))}
              </div>
            </section>
          )}

          <section className="pt-6 border-t border-[var(--hairline)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                Keep reading
              </div>
              <div className="font-display text-base font-semibold text-[var(--fg)] mt-1">
                Related guides and tools
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {relatedGuides.map((related) => (
                <Link
                  key={related.slug}
                  href={related.path}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--cyan)] hover:underline"
                >
                  {related.title} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
              <span className="text-[var(--hairline-strong)]">·</span>
              <Link
                href="/jwt-decoder"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                JWT Decoder <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
