import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { getGuide } from "@/lib/guides";
import { generateGuideMetadata } from "@/lib/toolMetadata";
import {
  guideArticleJsonLd,
  guideHowToJsonLd,
  guideBreadcrumbJsonLd,
  guideFaqJsonLd,
} from "@/lib/jsonLd";
import { Faq } from "@/components/shared/Faq";
import { GuideToolCta } from "@/components/shared/GuideToolCta";

const guide = getGuide("format-and-validate-json")!;

export const metadata: Metadata = generateGuideMetadata(guide);

export default function FormatAndValidateJsonGuidePage() {
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
        {/* Breadcrumb */}
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

        {/* Header / Hero */}
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

          {/* Interactive tool banner */}
          <GuideToolCta guide={guide} />
        </header>

        {/* Guide Content */}
        <div className="space-y-12">
          {/* Section: Overview */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              Understanding JSON Syntax & Validation
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                JSON (JavaScript Object Notation, RFC 8259) is the lingua franca of web APIs and configuration.
                While its syntax appears simple, strict parsing specifications cause frequent validation failures
                when data is modified by hand or copied from logs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="p-4 rounded border border-[var(--hairline)] bg-[var(--bg-raise)]">
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold text-red-400 mb-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" /> Common Invalidation Causes
                  </div>
                  <ul className="text-xs text-[var(--fg-muted)] space-y-1.5 list-disc list-inside">
                    <li>Single quotes instead of double quotes (<code className="font-mono text-[var(--fg)]">&apos;key&apos;</code>)</li>
                    <li>Unquoted object property names (<code className="font-mono text-[var(--fg)]">id: 101</code>)</li>
                    <li>Trailing commas after the final element or key</li>
                    <li>Unescaped control characters in string literals</li>
                  </ul>
                </div>
                <div className="p-4 rounded border border-[var(--hairline)] bg-[var(--bg-raise)]">
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[var(--cyan)] mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid Spec Requirements
                  </div>
                  <ul className="text-xs text-[var(--fg-muted)] space-y-1.5 list-disc list-inside">
                    <li>Strings and object keys MUST use double quotes</li>
                    <li>Numeric values must not contain leading zeroes</li>
                    <li>Arrays and objects must have balanced matching brackets</li>
                    <li>Boolean and null values must be lowercase literals</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Walkthrough Steps */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-6">
              Step-by-Step Walkthrough
            </h2>
            <div className="space-y-8">
              {guide.steps.map((step, idx) => (
                <div
                  key={step.name}
                  id={`step-${idx + 1}`}
                  className="relative p-6 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] scroll-mt-20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--cyan)]/10 border border-[var(--cyan)]/30 font-mono text-xs font-bold text-[var(--cyan)]">
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

          {/* Section: Lossless JSON Parsing */}
          <section className="p-6 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-raise)]">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--sky)] mb-3">
              <ShieldCheck className="w-4 h-4" /> Preservation of BigInt Numbers
            </div>
            <h3 className="font-display text-xl font-semibold text-[var(--fg)] mb-3">
              Avoid Silent Numeric Precision Loss
            </h3>
            <p className="text-[14.5px] text-[var(--fg-muted)] leading-relaxed">
              Standard JavaScript uses double-precision floats (IEEE 754) for numbers, meaning any integer
              larger than <code className="font-mono text-[var(--fg)]">9,007,199,254,740,991</code> (such as database snowflakes, Twitter IDs, or 64-bit timestamps)
              gets rounded and corrupted when parsed with standard <code className="font-mono text-[var(--fg)]">JSON.parse()</code>.
              The CODERCOPS JSON Formatter utilizes lossless parsing, ensuring that 64-bit IDs and high-precision scientific figures retain their exact representation through formatting and conversions.
            </p>
          </section>

          {/* Section: FAQ */}
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

          {/* Related Tools Navigation */}
          <section className="pt-6 border-t border-[var(--hairline)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                Next Steps
              </div>
              <div className="font-display text-base font-semibold text-[var(--fg)] mt-1">
                Explore related browser tools
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/json-formatter"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--cyan)] hover:underline"
              >
                JSON Formatter <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
