import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { Faq } from "@/components/shared/Faq";
import { GuideToolCta } from "@/components/shared/GuideToolCta";
import { getGuide, getRelatedGuides } from "@/lib/guides";
import { generateGuideMetadata } from "@/lib/toolMetadata";
import {
  guideArticleJsonLd,
  guideBreadcrumbJsonLd,
  guideFaqJsonLd,
  guideHowToJsonLd,
} from "@/lib/jsonLd";

const guide = getGuide("what-is-base64")!;
const relatedGuides = getRelatedGuides(guide.slug);

export const metadata: Metadata = generateGuideMetadata(guide);

const codeClass = "font-mono text-[var(--fg)]";
const tableHeadClass =
  "bg-[var(--bg-raise)] font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]";

export default function WhatIsBase64GuidePage() {
  const faqData = guideFaqJsonLd(guide);

  return (
    <>
      {[guideArticleJsonLd(guide), guideHowToJsonLd(guide), guideBreadcrumbJsonLd(guide), ...(faqData ? [faqData] : [])].map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}

      <article className="mx-auto max-w-4xl w-full px-4 sm:px-6 pt-10 pb-20">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]"
        >
          <Link href="/" className="hover:text-[var(--fg)] transition-colors">Home</Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <Link href="/guides" className="hover:text-[var(--fg)] transition-colors">Guides</Link>{" "}
          <span aria-hidden="true">/</span>{" "}
          <span className="text-[var(--fg)]">{guide.title}</span>
        </nav>

        <header className="mb-10 pb-8 border-b border-[var(--hairline)]">
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-mono text-[var(--fg-dim)]">
            <span className="inline-flex items-center gap-1.5 text-[var(--amber)]">
              <BookOpen className="w-3 h-3" />
              {guide.tagline}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Published {guide.publishedAt}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {guide.readingTime}
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--fg)] leading-tight">
            {guide.title}
          </h1>

          <p className="mt-4 text-[16px] text-[var(--fg-muted)] leading-relaxed">
            {guide.cardDescription}
          </p>

          <GuideToolCta guide={guide} />
        </header>

        <div className="space-y-12 text-[15px] text-[var(--fg-muted)] leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              What is Base64?
            </h2>
            <p>
              <strong className="text-[var(--fg)]">
                Base64 is a binary-to-text encoding that represents arbitrary bytes using 64 printable ASCII characters.
              </strong>{" "}
              It does not encrypt anything: anyone with the encoded string can decode it back to the original bytes.
            </p>
            <p className="mt-4">
              The encoding exists because many systems were designed to carry text, not raw binary. Email, URLs, JSON,
              XML, and HTTP headers can mangle bytes such as <code className={codeClass}>0x00</code> or{" "}
              <code className={codeClass}>0xFF</code>. Base64 converts those bytes into a smaller alphabet of letters,
              digits, <code className={codeClass}>+</code>, and <code className={codeClass}>/</code> so they can pass
              through text-only channels intact. The format is standardized in RFC 4648.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              What does Base64 look like?
            </h2>
            <p>
              The classic example is <code className={codeClass}>&quot;Hello, world!&quot;</code>, which becomes{" "}
              <code className={codeClass}>SGVsbG8sIHdvcmxkIQ==</code>. The input is 13 bytes; the output is 20
              characters, including two padding equals signs.
            </p>

            <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--hairline)]">
              <table className="w-full text-left text-[13.5px]">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-4 py-3">Input</th>
                    <th className="px-4 py-3">Bytes (hex)</th>
                    <th className="px-4 py-3">Base64</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline)]">
                  <tr>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">Hello, world!</td>
                    <td className="px-4 py-3 font-mono">48 65 6C 6C 6F 2C 20 77 6F 72 6C 64 21</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)] break-all">SGVsbG8sIHdvcmxkIQ==</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">A</td>
                    <td className="px-4 py-3 font-mono">41</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">QQ==</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">AB</td>
                    <td className="px-4 py-3 font-mono">41 42</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">QUI=</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">ABC</td>
                    <td className="px-4 py-3 font-mono">41 42 43</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">QUJD</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              The output is longer than the input. Every three input bytes become four output characters, so the
              encoded form is roughly 33% larger. Base64 is a compatibility layer, not compression.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              What is Base64 used for?
            </h2>
            <p>
              Base64 shows up wherever binary data has to travel through a text-based system. Common examples include:
            </p>
            <ul className="mt-4 space-y-2.5 list-disc list-inside">
              <li>
                <strong className="text-[var(--fg)]">Data URIs:</strong> embedding an image, font, or other asset
                directly in HTML or CSS as{" "}
                <code className={codeClass}>data:image/png;base64,...</code>. This removes a request but makes the
                document larger.
              </li>
              <li>
                <strong className="text-[var(--fg)]">JSON and XML payloads:</strong> carrying a binary attachment
                inside a text document where a raw byte sequence would be invalid or unsafe.
              </li>
              <li>
                <strong className="text-[var(--fg)]">Email attachments:</strong> MIME encodes attachment data so it can
                pass through SMTP servers that expect text.
              </li>
              <li>
                <strong className="text-[var(--fg)]">HTTP Basic authentication:</strong> sending{" "}
                <code className={codeClass}>username:password</code> in an{" "}
                <code className={codeClass}>Authorization</code> header. The encoding makes the header text-safe; TLS is
                what protects it in transit.
              </li>
              <li>
                <strong className="text-[var(--fg)]">JWTs:</strong> the header and payload are Base64URL-encoded JSON.
                Read the{" "}
                <Link href="/guides/decode-jwt" className="text-[var(--cyan)] hover:underline">
                  JWT decoding guide
                </Link>{" "}
                to see how that works and why decoding is not verification.
              </li>
              <li>
                <strong className="text-[var(--fg)]">Configuration stores:</strong> placing binary or arbitrary text
                in environments that only accept text. Kubernetes Secrets are a common example, but the encoding is
                not a security boundary.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              How does Base64 encoding work?
            </h2>
            <p>
              Base64 reads the input as bytes and processes them in groups of three. Each group contains 24 bits,
              which is split into four 6-bit values. Those values are then looked up in the Base64 alphabet.
            </p>

            <div className="mt-6 p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)]">
              <div className="font-mono text-xs text-[var(--fg-dim)] mb-2 uppercase tracking-wider">
                Example: &quot;Man&quot;
              </div>
              <pre className="font-mono text-[12.5px] whitespace-pre-wrap text-[var(--fg)]">{`Bytes:   M        a        n
Hex:     4D       61       6E
Bits:    01001101 01100001 01101110
6-bit:   010011   010110   000101   101110
Values:  19       22       5        46
Base64:  T        W        F        u`}</pre>
            </div>

            <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--hairline)]">
              <table className="w-full text-left text-[13.5px]">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-4 py-3">6-bit value</th>
                    <th className="px-4 py-3">Character</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline)]">
                  <tr>
                    <td className="px-4 py-3 font-mono">0–25</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">A–Z</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono">26–51</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">a–z</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono">52–61</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">0–9</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono">62</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">+</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono">63</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">/</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-4">
              Decoding reverses the process: map each character back to a 6-bit value, join the bits, and split the
              result into bytes. Text is not encoded character by character; it is first converted to bytes with a
              character encoding such as UTF-8. A multi-byte character therefore spans several input bytes.
            </p>

            <h3 className="font-display text-lg font-semibold text-[var(--fg)] mt-8 mb-3">
              Base64 encoding step by step
            </h3>
            <div className="space-y-4">
              {guide.steps.map((step, i) => (
                <div
                  key={step.name}
                  id={`step-${i + 1}`}
                  className="p-5 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] scroll-mt-20"
                >
                  <h3 className="font-display text-base font-semibold text-[var(--fg)] mb-2">
                    {i + 1}. {step.name}
                  </h3>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              Why does Base64 use padding?
            </h2>
            <p>
              Padding keeps the output length a multiple of four. When the final group has only one or two bytes, the
              encoder adds <code className={codeClass}>=</code> characters to fill the missing slots. The equals signs
              are not part of the original data and are discarded on decoding.
            </p>
            <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--hairline)]">
              <table className="w-full text-left text-[13.5px]">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-4 py-3">Input length</th>
                    <th className="px-4 py-3">Bytes in final group</th>
                    <th className="px-4 py-3">Padding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline)]">
                  <tr>
                    <td className="px-4 py-3">Multiple of 3</td>
                    <td className="px-4 py-3">3</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">none</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">One byte left</td>
                    <td className="px-4 py-3">1</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">==</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Two bytes left</td>
                    <td className="px-4 py-3">2</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">=</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              Some decoders accept unpadded input, but standard Base64 includes the padding, and not every
              implementation is lenient. If you remove padding to build a URL-safe value, make sure the decoder on the
              other side expects that form.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              What is URL-safe Base64?
            </h2>
            <p>
              Standard Base64 uses <code className={codeClass}>+</code> and <code className={codeClass}>/</code>,
              which can be ambiguous in a URL: a plus may be read as a space in form data, and a slash is a path
              separator. Base64URL (RFC 4648 §5) replaces them with <code className={codeClass}>-</code> and{" "}
              <code className={codeClass}>_</code>, and it commonly omits the padding.
            </p>
            <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--hairline)]">
              <table className="w-full text-left text-[13.5px]">
                <thead className={tableHeadClass}>
                  <tr>
                    <th className="px-4 py-3">Bytes (hex)</th>
                    <th className="px-4 py-3">Standard Base64</th>
                    <th className="px-4 py-3">Base64URL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline)]">
                  <tr>
                    <td className="px-4 py-3 font-mono">FB FF</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">+/8=</td>
                    <td className="px-4 py-3 font-mono text-[var(--fg)]">-_8=</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              Base64URL is still Base64, not encryption. Use it when the value must survive a URL, filename, or JWT
              segment, and use the matching decoder rather than mixing alphabets. If you need percent-encoding for
              other URL characters, see the{" "}
              <Link href="/guides/url-encode-string" className="text-[var(--cyan)] hover:underline">
                URL encoding guide
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              Is Base64 encryption?
            </h2>
            <p>
              No. Base64 is encoding, not encryption. It has no key, no secrecy, and no integrity protection. Encoding
              a password or API key in Base64 does not hide it; it only changes its representation. It is also not
              hashing, because hashing is one-way while Base64 is designed to be reversed.
            </p>
            <p className="mt-4">
              Use the right tool for the risk: TLS for data in transit, a modern encryption scheme for confidential
              stored data, a password hash such as Argon2 or bcrypt for passwords, and an HMAC or digital signature
              when you need to detect tampering.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              What are the security limitations of Base64?
            </h2>
            <ul className="space-y-2.5 list-disc list-inside">
              <li>
                <strong className="text-[var(--fg)]">No confidentiality:</strong> anyone who can read the string can
                decode it. A Base64 secret in a URL, log, or repository is still exposed.
              </li>
              <li>
                <strong className="text-[var(--fg)]">No integrity checking:</strong> an attacker can decode, modify, and
                re-encode the data. Base64 cannot tell you whether the result is authentic.
              </li>
              <li>
                <strong className="text-[var(--fg)]">Size and memory overhead:</strong> encoded data is about a third
                larger, and decoding a very large or untrusted payload can consume significant memory. Cap input sizes
                before decoding.
              </li>
              <li>
                <strong className="text-[var(--fg)]">Format confusion:</strong> standard Base64 and Base64URL are not
                interchangeable. Validate the alphabet, padding expectations, and decoded length at the boundary.
              </li>
            </ul>
            <p className="mt-4">
              A practical rule: treat Base64 as a transport format, not a trust boundary. If a value is sensitive,
              protect it with encryption and access controls before encoding it.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              How do I encode or decode Base64?
            </h2>
            <p>
              The{" "}
              <Link href="/base64" className="text-[var(--cyan)] hover:underline">
                Base64 Encoder &amp; Decoder
              </Link>{" "}
              runs entirely in your browser. Paste text to encode or decode it, choose the URL-safe variant when
              needed, use the Image tab to produce a data URI, or use the File tab to get plain Base64. Nothing is
              uploaded. When you are working with JSON that contains encoded payloads, the{" "}
              <Link href="/guides/format-and-validate-json" className="text-[var(--cyan)] hover:underline">
                JSON formatting guide
              </Link>{" "}
              covers validation and conversion.
            </p>
          </section>

          {guide.faqs && (
            <section className="pt-6 border-t border-[var(--hairline)]">
              <h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-6">
                {"// Frequently Asked Questions"}
              </h2>
              <div className="grid gap-4">
                {guide.faqs.map((f) => (
                  <Faq key={f.q} q={f.q} a={f.a} />
                ))}
              </div>
            </section>
          )}

          <section className="pt-6 border-t border-[var(--hairline)]">
            <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-3">
              Keep reading
            </div>
            <div className="flex flex-wrap gap-3">
              {relatedGuides.map((related) => (
                <Link
                  key={related.slug}
                  href={related.path}
                  className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--cyan)] hover:underline"
                >
                  {related.title} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
