import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { getGuide, getRelatedGuides } from "@/lib/guides";
import { generateGuideMetadata } from "@/lib/toolMetadata";
import { guideArticleJsonLd, guideHowToJsonLd, guideBreadcrumbJsonLd, guideFaqJsonLd } from "@/lib/jsonLd";
import { Faq } from "@/components/shared/Faq";

const guide = getGuide("convert-between-binary-decimal-hexadecimal")!;
const relatedGuides = getRelatedGuides(guide.slug);
export const metadata: Metadata = generateGuideMetadata(guide);
const code = "font-mono text-[var(--fg)]";

export default function NumberBaseGuidePage() {
  const faq = guideFaqJsonLd(guide);
  const schemas = [guideArticleJsonLd(guide), guideHowToJsonLd(guide), guideBreadcrumbJsonLd(guide), faq];
  return <>
    {schemas.map((schema, i) => schema && <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />)}
    <article className="mx-auto max-w-4xl w-full px-4 sm:px-6 pt-10 pb-20">
      <nav aria-label="Breadcrumb" className="mb-6 font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]"><Link href="/">Home</Link> <span aria-hidden="true">/</span> <Link href="/guides">Guides</Link> <span aria-hidden="true">/</span> <span className="text-[var(--fg)]">{guide.title}</span></nav>
      <header className="mb-10 pb-8 border-b border-[var(--hairline)]"><div className="flex flex-wrap items-center gap-3 mb-4 text-xs font-mono text-[var(--fg-dim)]"><span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full uppercase tracking-wider" style={{ backgroundColor: `color-mix(in srgb, var(${guide.accentVar}) 12%, transparent)`, color: `var(${guide.accentVar})` }}><BookOpen className="w-3 h-3" />{guide.tagline}</span><span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Published {guide.publishedAt}</span><span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{guide.readingTime}</span></div><h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--fg)] leading-tight">{guide.title}</h1><p className="mt-4 text-[16px] text-[var(--fg-muted)] leading-relaxed">{guide.cardDescription}</p><div className="mt-6 p-4 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-raise)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div><div className="font-display text-sm font-semibold text-[var(--fg)]">Try the Number Base Converter</div><div className="text-xs text-[var(--fg-muted)]">Exact client-side conversion for bases 2 through 36.</div></div><Link href="/number-base-converter" className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-medium bg-[var(--violet)] text-black hover:opacity-90 whitespace-nowrap">Open Tool <ArrowRight className="w-3.5 h-3.5" /></Link></div></header>
      <div className="space-y-12 text-[15px] text-[var(--fg-muted)] leading-relaxed">
        <section><p><strong className="text-[var(--fg)]">Binary 101101 is decimal 45 and hexadecimal 2D.</strong> Expand each digit by its positional value, or group binary digits into four-bit chunks. The <Link className="text-[var(--violet)] hover:underline" href="/number-base-converter">Number Base Converter</Link> checks the arithmetic and converts integers between bases 2 and 36.</p></section>
        <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">Positional notation: what a base means</h2><p>In base <em>b</em>, each position represents a power of <em>b</em>. Decimal uses 0–9, binary uses 0 and 1, and hexadecimal uses 0–9 plus A–F, where A is 10 and F is 15. Thus 2D₁₆ = 2×16¹ + 13×16⁰ = 45₁₀.</p></section>
        <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">Convert binary, decimal, and hex by hand</h2><h3 className="font-display text-lg font-semibold text-[var(--fg)] mb-2">Binary to decimal</h3><p>For <code className={code}>101101₂</code>, add the powers of two under the 1 digits: <code className={code}>32 + 8 + 4 + 1 = 45</code>.</p><h3 className="font-display text-lg font-semibold text-[var(--fg)] mt-6 mb-2">Decimal to binary</h3><p>Repeatedly divide by 2, record each remainder, and read the remainders upward. That converts <code className={code}>45₁₀</code> to <code className={code}>101101₂</code>.</p><h3 className="font-display text-lg font-semibold text-[var(--fg)] mt-6 mb-2">Binary to hexadecimal</h3><p>Pad on the left and split into groups of four: <code className={code}>101101₂ → 0010 1101₂ → 2D₁₆</code>. One hex digit is four bits because 16 = 2⁴.</p></section>
        <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">How the converter handles input</h2><p>The tool accepts an optional leading sign. In auto-detect mode, <code className={code}>0b</code>, <code className={code}>0o</code>, and <code className={code}>0x</code> select binary, octal, and hexadecimal; otherwise input is decimal. Spaces and underscores between digits are ignored, and custom bases from 2 through 36 are supported.</p></section>
        <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">Negative numbers and two’s complement</h2><p>A mathematical negative value keeps its minus sign. Hardware commonly stores a signed integer in a fixed width using two’s complement: for <em>w</em> bits, a negative value is represented by 2<sup>w</sup> plus that value. Thus -1 in 8 bits is <code className={code}>11111111</code>. The tool offers signed 8-, 16-, 32-, and 64-bit widths and reports values that do not fit.</p></section>
        <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">JavaScript: radix, parseInt, and BigInt</h2><p>For safe integers, <code className={code}>parseInt(text, radix)</code> reads a string and <code className={code}>number.toString(radix)</code> writes a number. Pass the radix explicitly. For values beyond <code className={code}>Number.MAX_SAFE_INTEGER</code> (2⁵³ − 1), use <code className={code}>BigInt</code>; <code className={code}>BigInt(&quot;18446744073709551616&quot;).toString(16)</code> returns <code className={code}>10000000000000000</code>. A plain <code className={code}>BigInt(&quot;101101&quot;)</code> is decimal, not binary.</p></section>
        <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-6">Step-by-step checklist</h2><div className="space-y-4">{guide.steps.map((step, i) => <div key={step.name} id={`step-${i + 1}`} className="p-5 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] scroll-mt-20"><h3 className="font-display text-lg font-semibold text-[var(--fg)] mb-2"><span className="mr-2 font-mono text-[var(--violet)]">{i + 1}.</span>{step.name}</h3><p>{step.text}</p></div>)}</div></section>
        {guide.faqs && <section className="pt-6 border-t border-[var(--hairline)]"><h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-6">{"// Frequently Asked Questions"}</h2><div className="grid gap-4">{guide.faqs.map((item) => <Faq key={item.q} q={item.q} a={item.a} />)}</div></section>}
        <section className="pt-6 border-t border-[var(--hairline)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">Keep reading</div>
            <div className="font-display text-base font-semibold text-[var(--fg)] mt-1">Related guides and tools</div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {relatedGuides.map((related) => (
              <Link key={related.slug} href={related.path} className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--cyan)] hover:underline">
                {related.title} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </article>
  </>;
}
