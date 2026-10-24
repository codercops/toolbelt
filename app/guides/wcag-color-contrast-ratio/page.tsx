import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
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

const guide = getGuide("wcag-color-contrast-ratio")!;
const relatedGuides = getRelatedGuides(guide.slug);

export const metadata: Metadata = generateGuideMetadata(guide);

const tableWrap = "overflow-x-auto rounded-lg border border-[var(--hairline)]";
const thead =
  "bg-[var(--bg-raise)] font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]";
const pre =
  "p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] leading-[1.7] whitespace-pre-wrap break-all text-[var(--fg)]";
const h2 = "font-display text-2xl font-semibold text-[var(--fg)] mb-4";
const body = "text-[15px] text-[var(--fg-muted)] leading-relaxed space-y-4";

export default function WcagColorContrastGuidePage() {
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
              <li aria-hidden="true" className="text-[var(--fg-dim)]">/</li>
              <li>
                <Link href="/guides" className="text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors">
                  Guides
                </Link>
              </li>
              <li aria-hidden="true" className="text-[var(--fg-dim)]">/</li>
              <li aria-current="page" className="text-[var(--fg)]">{guide.title}</li>
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
              WCAG requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large
              text at Level AA, rising to 7:1 and 4.5:1 at Level AAA. The ratio compares the
              relative luminance of two colors as (L1 + 0.05) / (L2 + 0.05), so it runs from 1:1
              for identical colors to 21:1 for black on white.
            </p>
          </section>

          <section>
            <h2 className={h2}>WCAG contrast ratio requirements</h2>
            <div className={body}>
              <div className={tableWrap}>
                <table className="w-full text-left text-[13.5px]">
                  <thead className={thead}>
                    <tr>
                      <th className="px-4 py-3 font-medium">What you are checking</th>
                      <th className="px-4 py-3 font-medium">Success criterion</th>
                      <th className="px-4 py-3 font-medium">Minimum ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)] text-[var(--fg-muted)]">
                    <tr>
                      <td className="px-4 py-3">Normal text, AA</td>
                      <td className="px-4 py-3 font-mono">1.4.3</td>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">4.5 : 1</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Large text, AA</td>
                      <td className="px-4 py-3 font-mono">1.4.3</td>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">3 : 1</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Normal text, AAA</td>
                      <td className="px-4 py-3 font-mono">1.4.6</td>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">7 : 1</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Large text, AAA</td>
                      <td className="px-4 py-3 font-mono">1.4.6</td>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">4.5 : 1</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">UI components and graphics, AA</td>
                      <td className="px-4 py-3 font-mono">1.4.11</td>
                      <td className="px-4 py-3 font-mono text-[var(--fg)]">3 : 1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                The UI component rule covers things like input borders, focus rings, toggle
                states and icons that carry meaning, measured against the colors next to them.
                These thresholds are the same in WCAG 2.1 and 2.2.
              </p>
            </div>
          </section>

          <section>
            <h2 className={h2}>What counts as large text</h2>
            <div className={body}>
              <p>
                WCAG treats text as large when it is at least 18 point, or at least 14 point
                and bold. A CSS point is 4/3 of a pixel, so that is about 24px at regular weight
                or about 18.66px bold. Anything smaller is normal text and needs the higher ratio.
              </p>
              <p>
                The checker&apos;s sample heading is labelled Large Text and its body paragraph
                Normal Text, but it does not measure the sizes you actually use. Read the Large
                badges only if your text meets the size rule above.
              </p>
            </div>
          </section>

          <section>
            <h2 className={h2}>How the contrast ratio is calculated</h2>
            <div className={body}>
              <p>The calculation has three steps, applied to each of the two colors.</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  Divide each red, green and blue value by 255 to get <code className="font-mono text-[var(--fg)]">c</code>.
                </li>
                <li>
                  Linearize it: if <code className="font-mono text-[var(--fg)]">c ≤ 0.04045</code>, use{" "}
                  <code className="font-mono text-[var(--fg)]">c / 12.92</code>; otherwise use{" "}
                  <code className="font-mono text-[var(--fg)]">((c + 0.055) / 1.055) ^ 2.4</code>.
                </li>
                <li>
                  Weight the channels:{" "}
                  <code className="font-mono text-[var(--fg)]">L = 0.2126 R + 0.7152 G + 0.0722 B</code>.
                </li>
              </ol>
              <p>
                Then divide: <code className="font-mono text-[var(--fg)]">(L1 + 0.05) / (L2 + 0.05)</code>,
                where L1 is the lighter color. Green carries the most weight, which is why a
                bright green can look light but a pure blue of the same strength fails.
              </p>
              <p className="text-[13.5px] text-[var(--fg-dim)]">
                Older versions of the WCAG text give the cutoff as 0.03928. W3C changed it to
                0.04045 in 2021 and says this has no practical effect, because no 8-bit color
                value falls between the two numbers.
              </p>
              <pre className={pre}>
                {`const toLinear = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) =>
  0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};`}
              </pre>

              <h3 className="font-display text-lg font-semibold text-[var(--fg)] pt-2">
                Worked example: gray text on white
              </h3>
              <p>
                Take <code className="font-mono text-[var(--fg)]">#777777</code> text on a white
                background. All three channels are 119, so the weights add up to 1 and L equals
                the linearized value.
              </p>
              <div className={tableWrap}>
                <table className="w-full text-left text-[13.5px]">
                  <thead className={thead}>
                    <tr>
                      <th className="px-4 py-3 font-medium">Step</th>
                      <th className="px-4 py-3 font-medium">#777777</th>
                      <th className="px-4 py-3 font-medium">#FFFFFF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)] text-[var(--fg-muted)] font-mono">
                    <tr>
                      <td className="px-4 py-3">c = value / 255</td>
                      <td className="px-4 py-3">0.4667</td>
                      <td className="px-4 py-3">1</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Linearized</td>
                      <td className="px-4 py-3">0.1845</td>
                      <td className="px-4 py-3">1</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">L</td>
                      <td className="px-4 py-3">0.1845</td>
                      <td className="px-4 py-3">1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                The ratio is (1 + 0.05) / (0.1845 + 0.05) = 1.05 / 0.2345 ≈ 4.478. That is just
                under 4.5, so it fails Normal AA but passes Large AA. Most tools round this to
                4.48. The Color Converter &amp; Contrast Checker truncates to two decimals
                instead, so it shows 4.47, and a pair that misses a threshold never reads as if
                it met it.
              </p>
              <p>
                Nudging the gray to <code className="font-mono text-[var(--fg)]">#767676</code>{" "}
                gives L ≈ 0.1812 and a ratio of about 4.54, which passes Normal AA. It is the
                lightest pure gray that does on white.
              </p>
            </div>
          </section>

          <section>
            <h2 className={h2}>How to check contrast step by step</h2>
            <div className="space-y-8">
              {guide.steps.map((step, idx) => (
                <div
                  key={step.name}
                  id={`step-${idx + 1}`}
                  className="relative p-6 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] scroll-mt-20"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--fuchsia)]/10 border border-[var(--fuchsia)]/30 font-mono text-xs font-bold text-[var(--fuchsia)]">
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
            <h2 className={h2}>How to fix a pair that fails</h2>
            <div className={body}>
              <p>
                The checker reports pass or fail and does not suggest replacements, so the fix is
                yours to make. These changes work in roughly this order:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong className="text-[var(--fg)]">Change lightness, not hue.</strong> Darken
                  the text on a light background, or lighten it on a dark one. Typing{" "}
                  <code className="font-mono text-[var(--fg)]">hsl()</code> with a lower or
                  higher lightness keeps the color family intact.
                </li>
                <li>
                  <strong className="text-[var(--fg)]">Change the background instead</strong> when
                  the text color is fixed, such as a brand color.
                </li>
                <li>
                  <strong className="text-[var(--fg)]">Make the text larger or bold</strong> if it
                  qualifies as large text, which lowers the minimum from 4.5:1 to 3:1.
                </li>
                <li>
                  <strong className="text-[var(--fg)]">Use an opaque color</strong> in place of a
                  semi-transparent one, so the ratio does not depend on what sits behind it.
                </li>
                <li>
                  <strong className="text-[var(--fg)]">Test the reverse pairing</strong> with Swap
                  colors, which is useful when the same two colors appear on both light and dark
                  surfaces.
                </li>
              </ul>
              <p>
                After each change, type the new value in the color input and use Set as FG or Set
                as BG to send it to the checker, then read the new ratio.
              </p>
            </div>
          </section>

          <section className="p-6 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-raise)]">
            <h2 className="font-display text-xl font-semibold text-[var(--fg)] mb-3">
              Check your colors in the browser
            </h2>
            <p className="text-[14.5px] text-[var(--fg-muted)] leading-relaxed">
              The{" "}
              <Link href="/color-converter" className="text-[var(--fuchsia)] hover:underline">
                Color Converter &amp; Contrast Checker
              </Link>{" "}
              accepts HEX (3, 4, 6 or 8 digits), rgb() and hsl() values, including the space and
              slash syntax. It shows the ratio, each color&apos;s relative luminance and four
              pass or fail badges, and previews your colors on a sample heading and paragraph.
              It runs in your browser, so nothing is uploaded.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/color-converter"
                className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-medium bg-[var(--fuchsia)] text-black hover:opacity-90 transition-opacity"
              >
                Open Color Converter <ArrowRight className="w-3.5 h-3.5" />
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
                href="/color-converter"
                className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Color Converter <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
