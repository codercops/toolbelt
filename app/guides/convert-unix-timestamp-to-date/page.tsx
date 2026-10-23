import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
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

const guide = getGuide("convert-unix-timestamp-to-date")!;
const relatedGuides = getRelatedGuides(guide.slug);

export const metadata: Metadata = generateGuideMetadata(guide);

export default function UnixTimestampGuidePage() {
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
              Converting a Unix timestamp to a date means reading a count of seconds (or
              milliseconds) since 1970-01-01T00:00:00Z as a calendar moment:{" "}
              <code className="font-mono text-[var(--fg)]">1700000000</code> is
              2023-11-14 22:13:20 UTC. Converting the other way counts from the epoch again:{" "}
              <code className="font-mono text-[var(--fg)]">
                {`Math.floor(Date.parse("2023-11-14T22:13:20Z") / 1000)`}
              </code>{" "}
              returns <code className="font-mono text-[var(--fg)]">1700000000</code>. The{" "}
              <Link href="/timestamp-converter" className="text-[var(--lime)] hover:underline">
                Unix Timestamp Converter
              </Link>{" "}
              does both directions in your browser, with automatic unit detection and no
              server round trip.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              What a Unix timestamp is
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                A Unix timestamp (also called epoch time) counts whole seconds from
                1970-01-01 00:00:00 UTC, an instant chosen as the starting point of
                Unix history and known as the epoch. The value has no timezone attached:
                it is one absolute instant, so the same number means the same moment in
                every timezone. Instants before the epoch are negative, and instants after
                it are positive and grow by one each second.
              </p>
              <div className="overflow-x-auto rounded-lg border border-[var(--hairline)]">
                <table className="w-full text-left text-[13.5px]">
                  <thead className="bg-[var(--bg-raise)] font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Timestamp</th>
                      <th className="px-4 py-3 font-medium">Date and time (UTC)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)] text-[var(--fg-muted)]">
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">-315619200</td>
                      <td className="px-4 py-3">1960-01-01 00:00:00 (before the epoch)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">0</td>
                      <td className="px-4 py-3">1970-01-01 00:00:00 (the epoch)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">946684800</td>
                      <td className="px-4 py-3">2000-01-01 00:00:00</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">1700000000</td>
                      <td className="px-4 py-3">2023-11-14 22:13:20</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">1792713600</td>
                      <td className="px-4 py-3">2026-10-23 00:00:00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              Seconds or milliseconds: reading the digits
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                The same instant can be stored with different precision, and the unit
                changes the number of digits. For current dates you can tell them apart by
                length alone:
              </p>
              <div className="overflow-x-auto rounded-lg border border-[var(--hairline)]">
                <table className="w-full text-left text-[13.5px]">
                  <thead className="bg-[var(--bg-raise)] font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Unit</th>
                      <th className="px-4 py-3 font-medium">Digits in 2026</th>
                      <th className="px-4 py-3 font-medium">Same instant</th>
                      <th className="px-4 py-3 font-medium">Detected below</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)] text-[var(--fg-muted)]">
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">seconds</td>
                      <td className="px-4 py-3">10</td>
                      <td className="px-4 py-3 font-mono">1792713600</td>
                      <td className="px-4 py-3 font-mono">10^11</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">milliseconds</td>
                      <td className="px-4 py-3">13</td>
                      <td className="px-4 py-3 font-mono">1792713600000</td>
                      <td className="px-4 py-3 font-mono">10^14</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">microseconds</td>
                      <td className="px-4 py-3">16</td>
                      <td className="px-4 py-3 font-mono">1792713600000000</td>
                      <td className="px-4 py-3 font-mono">10^17</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">nanoseconds</td>
                      <td className="px-4 py-3">19</td>
                      <td className="px-4 py-3 font-mono">1792713600000000000</td>
                      <td className="px-4 py-3 font-mono">10^17 or more</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                The Timestamp Converter uses exactly these magnitude thresholds and tells
                you which unit it picked, so a wrong guess is visible instead of silent.
                One caveat: dates from 1970 to 1972 written in milliseconds are small
                enough to fall under the seconds threshold, so for very old dates choose
                the unit explicitly rather than relying on auto-detection. JavaScript&apos;s{" "}
                <code className="font-mono text-[var(--fg)]">Date.now()</code> always
                returns milliseconds, which is the unit most JavaScript and Node.js code
                produces.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              UTC and local time are two views of one instant
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                Because the number itself carries no timezone, displaying it as UTC or as
                your local time changes only the label, never the instant. UTC is the fixed
                reference every timestamp is counted against; local time is UTC shifted by
                your machine&apos;s offset. The converter shows both side by side, plus the
                ISO 8601 form, so you can see what a value means locally without losing the
                absolute value you should store.
              </p>
              <p>
                Storage rule of thumb: keep the raw timestamp (or ISO 8601 with a Z or
                offset) as the source of truth, and only convert to a local timezone for
                display. Two servers in different regions, or one server and a user&apos;s
                laptop, will otherwise disagree about the same event.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              ISO 8601: the readable form of the same instant
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                ISO 8601 writes the instant as calendar fields, for example{" "}
                <code className="font-mono text-[var(--fg)]">2023-11-14T22:13:20Z</code>{" "}
                where <code className="font-mono text-[var(--fg)]">Z</code> means UTC. An
                explicit offset such as{" "}
                <code className="font-mono text-[var(--fg)]">2023-11-15T03:43:20+05:30</code>{" "}
                describes the same instant from a different timezone. Fractional seconds
                (<code className="font-mono text-[var(--fg)]">22:13:20.000Z</code>) are
                allowed and are what JavaScript&apos;s{" "}
                <code className="font-mono text-[var(--fg)]">toISOString()</code> produces.
              </p>
              <p>
                Timestamps and ISO 8601 are two encodings of one value: convert either way
                with no information lost, as long as a timezone is present. The converter
                normalizes whatever you enter and returns the ISO 8601 string alongside
                epoch seconds and milliseconds.
              </p>
            </div>
          </section>

          <section className="p-6 rounded-lg border border-[var(--amber)]/40 bg-[var(--bg-raise)]">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--amber)] mb-3">
              <AlertTriangle className="w-4 h-4" /> Before 1970 and the year 2038
            </div>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                Dates before the epoch convert to negative seconds: 1960-01-01 is{" "}
                <code className="font-mono text-[var(--fg)]">-315619200</code>. JavaScript
                <code className="font-mono text-[var(--fg)]"> Date</code> and the Timestamp
                Converter handle these directly, but older C libraries and some SQL
                columns treat them as errors, so check before passing a negative value to
                an older system.
              </p>
              <p>
                The year 2038 problem is a different limit: systems that store time as a
                32-bit signed count of seconds reach{" "}
                <code className="font-mono text-[var(--fg)]">2147483647</code> at
                2038-01-19 03:14:07 UTC and overflow to a negative number right after.
                JavaScript stores milliseconds in a 64-bit floating-point number and the
                converter accepts values within 100,000,000 days of the epoch (about
                273,800 years either side), so 2038 is not a limit here. Code compiled for
                32-bit platforms with a 32-bit <code className="font-mono text-[var(--fg)]">time_t</code>,
                and any database column typed as a 32-bit integer epoch, still carry the
                risk and should be migrated before that date.
              </p>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">
              Convert in JavaScript and Python
            </h2>
            <div className="text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4">
              <p>
                JavaScript works in milliseconds, so multiply seconds by 1000 going one
                way and divide going the other:
              </p>
              <pre className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]">
                {`// Epoch seconds → date
new Date(1700000000 * 1000).toISOString();  // "2023-11-14T22:13:20.000Z"

// Epoch milliseconds → the same instant
new Date(1700000000000).toISOString();      // "2023-11-14T22:13:20.000Z"

// Date → epoch seconds
Math.floor(Date.parse("2023-11-14T22:13:20Z") / 1000);  // 1700000000

// Right now
Math.floor(Date.now() / 1000);  // seconds
Date.now();                     // milliseconds`}
              </pre>
              <p>
                Python&apos;s <code className="font-mono text-[var(--fg)]">datetime</code>{" "}
                always needs a timezone for a correct conversion. Pass{" "}
                <code className="font-mono text-[var(--fg)]">timezone.utc</code> in both
                directions, and remember that a JavaScript milliseconds value must be
                divided by 1000 first:
              </p>
              <pre className="p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]">
                {`from datetime import datetime, timezone

# Epoch seconds → date
datetime.fromtimestamp(1700000000, tz=timezone.utc)
# datetime.datetime(2023, 11, 14, 22, 13, 20, tzinfo=timezone.utc)

# Milliseconds from JavaScript → date
datetime.fromtimestamp(1700000000000 / 1000, tz=timezone.utc)

# Date → epoch seconds
int(datetime(2023, 11, 14, 22, 13, 20, tzinfo=timezone.utc).timestamp())
# 1700000000`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-6">
              Convert a timestamp step by step
            </h2>
            <div className="space-y-8">
              {guide.steps.map((step, idx) => (
                <div
                  key={step.name}
                  id={`step-${idx + 1}`}
                  className="relative p-6 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] scroll-mt-20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--lime)]/10 border border-[var(--lime)]/30 font-mono text-xs font-bold text-[var(--lime)]">
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

          <section className="p-6 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-raise)]">
            <h2 className="font-display text-xl font-semibold text-[var(--fg)] mb-3">
              Convert a timestamp in your browser
            </h2>
            <p className="text-[14.5px] text-[var(--fg-muted)] leading-relaxed">
              The{" "}
              <Link href="/timestamp-converter" className="text-[var(--lime)] hover:underline">
                Unix Timestamp Converter
              </Link>{" "}
              shows live epoch seconds, milliseconds, and ISO 8601 time, converts a pasted
              timestamp to UTC, local time, ISO 8601, and relative time, and converts a
              date back to seconds and milliseconds. Unit detection reports what it picked,
              and nothing is uploaded, which makes it a safer place to paste an internal
              timestamp than a service that posts it to a backend.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/timestamp-converter"
                className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-medium bg-[var(--lime)] text-black hover:opacity-90 transition-opacity"
              >
                Open Timestamp Converter <ArrowRight className="w-3.5 h-3.5" />
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
                href="/timestamp-converter"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Timestamp Converter <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
