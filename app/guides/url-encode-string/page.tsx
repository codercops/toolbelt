import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { Faq } from "@/components/shared/Faq";
import { GuideToolCta } from "@/components/shared/GuideToolCta";
import { getGuide, getRelatedGuides } from "@/lib/guides";
import { generateGuideMetadata } from "@/lib/toolMetadata";
import { guideArticleJsonLd, guideBreadcrumbJsonLd, guideFaqJsonLd, guideHowToJsonLd } from "@/lib/jsonLd";

const guide = getGuide("url-encode-string")!;
const relatedGuides = getRelatedGuides(guide.slug);
export const metadata: Metadata = generateGuideMetadata(guide);

const codeClass = "font-mono text-[var(--fg)]";

export default function UrlEncodeStringGuidePage() {
  const faqData = guideFaqJsonLd(guide);
  return (
    <>
      {[guideArticleJsonLd(guide), guideHowToJsonLd(guide), guideBreadcrumbJsonLd(guide), ...(faqData ? [faqData] : [])].map((data, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
      ))}
      <article className="mx-auto max-w-4xl w-full px-4 sm:px-6 pt-10 pb-20">
        <nav aria-label="Breadcrumb" className="mb-6 font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
          <Link href="/">Home</Link> <span aria-hidden="true">/</span> <Link href="/guides">Guides</Link> <span aria-hidden="true">/</span> <span className="text-[var(--fg)]">{guide.title}</span>
        </nav>
        <header className="mb-10 pb-8 border-b border-[var(--hairline)]">
          <div className="flex flex-wrap items-center gap-4 mb-4 text-xs font-mono text-[var(--fg-dim)]">
            <span className="inline-flex items-center gap-1.5 text-[var(--cyan)]"><BookOpen className="w-3 h-3" />{guide.tagline}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Published {guide.publishedAt}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{guide.readingTime}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--fg)] leading-tight">{guide.title}</h1>
          <p className="mt-4 text-[16px] text-[var(--fg-muted)] leading-relaxed">{guide.cardDescription}</p>
          <GuideToolCta guide={guide} />
        </header>

        <div className="space-y-12 text-[15px] text-[var(--fg-muted)] leading-relaxed">
          <section><p><strong className="text-[var(--fg)]">Use <code className={codeClass}>encodeURIComponent</code> for a single URL value and <code className={codeClass}>encodeURI</code> for a complete URL.</strong> Both use percent-encoding so characters can travel safely in a URL; the right choice depends on whether punctuation is data or URL structure.</p></section>

          <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">What URL encoding does</h2><p>URLs are made from components separated by punctuation. Percent-encoding represents a byte as <code className={codeClass}>%</code> followed by two hexadecimal digits: a space becomes <code className={codeClass}>%20</code>, and an ampersand inside a parameter value becomes <code className={codeClass}>%26</code>. Encoding is representation, not encryption.</p><p className="mt-4">The unreserved characters are letters, digits, <code className={codeClass}>- . _ ~</code>. Reserved characters such as <code className={codeClass}>: / ? # [ ] @ &amp; = +</code> can delimit URL components, so whether they should be encoded depends on the component you are building.</p></section>

          <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">encodeURIComponent vs encodeURI</h2><div className="overflow-x-auto rounded-lg border border-[var(--hairline)]"><table className="w-full text-left text-[13.5px]"><thead className="bg-[var(--bg-raise)] font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]"><tr><th className="px-4 py-3">Function</th><th className="px-4 py-3">Use it for</th><th className="px-4 py-3">Example</th></tr></thead><tbody className="divide-y divide-[var(--hairline)]"><tr><td className="px-4 py-3 font-mono text-[var(--fg)]">encodeURIComponent</td><td className="px-4 py-3">One component or parameter value</td><td className="px-4 py-3 font-mono">encodeURIComponent(&quot;a&amp;b&quot;) → &quot;a%26b&quot;</td></tr><tr><td className="px-4 py-3 font-mono text-[var(--fg)]">encodeURI</td><td className="px-4 py-3">A complete URL with its separators</td><td className="px-4 py-3 font-mono">encodeURI(&quot;https://x.test/a b&quot;) → &quot;https://x.test/a%20b&quot;</td></tr></tbody></table></div><p className="mt-4">If you encode a whole URL with <code className={codeClass}>encodeURIComponent</code>, it will encode <code className={codeClass}>://</code>, <code className={codeClass}>?</code>, and <code className={codeClass}>&amp;</code> too—correct for treating the entire URL as one value, but not for navigating to it.</p></section>

          <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">Build query strings safely</h2><p>Encode names and values separately, then combine them with the query-string delimiters:</p><pre className="mt-4 p-4 rounded-lg border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12.5px] whitespace-pre-wrap text-[var(--fg)]">{`const query = "q=" + encodeURIComponent("cats & dogs")
  + "&page=" + encodeURIComponent("2");
// q=cats%20%26%20dogs&page=2`}</pre><p className="mt-4">For form submissions and many query-string libraries, spaces are serialized as <code className={codeClass}>+</code> instead of <code className={codeClass}>%20</code>. A literal plus in that format is encoded as <code className={codeClass}>%2B</code>. The two spellings are not interchangeable in every URL context.</p></section>

          <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">Unicode and double encoding</h2><p>JavaScript’s encoders convert text to UTF-8 before percent-encoding its bytes. For example, <code className={codeClass}>é</code> becomes UTF-8 bytes <code className={codeClass}>C3 A9</code>, written as <code className={codeClass}>%C3%A9</code>. A character can therefore occupy several percent-encoded bytes.</p><p className="mt-4">Encode once at the URL boundary and decode once at the matching boundary. If an already encoded <code className={codeClass}>%20</code> is encoded again, the percent sign becomes <code className={codeClass}>%25</code>, producing <code className={codeClass}>%2520</code>. That is double encoding, not extra safety.</p></section>

          <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">Try the URL Encoder</h2><p>The <Link href="/url-encoder" className="text-[var(--cyan)] hover:underline">URL Encoder &amp; Decoder</Link> runs these operations in your browser. Choose <strong className="text-[var(--fg)]">Component</strong> for a parameter or other single value, <strong className="text-[var(--fg)]">Full URL</strong> for a URL whose structure should remain intact, and enable <strong className="text-[var(--fg)]">Treat + as space</strong> only when decoding form-style data. It also reports malformed percent sequences and shows the breakdown of an absolute URL.</p></section>

          <section><h2 className="font-display text-2xl font-semibold text-[var(--fg)] mb-4">How to URL encode a string</h2><div className="space-y-4">{guide.steps.map((step, i) => <div key={step.name} id={`step-${i + 1}`} className="p-5 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] scroll-mt-20"><h3 className="font-display text-lg font-semibold text-[var(--fg)] mb-2">{i + 1}. {step.name}</h3><p>{step.text}</p></div>)}</div></section>

          {guide.faqs && <section className="pt-6 border-t border-[var(--hairline)]"><h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-6">{"// Frequently Asked Questions"}</h2><div className="grid gap-4">{guide.faqs.map((f) => <Faq key={f.q} q={f.q} a={f.a} />)}</div></section>}
          <section className="pt-6 border-t border-[var(--hairline)]"><div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-3">Keep reading</div><div className="flex flex-wrap gap-3">{relatedGuides.map((related) => <Link key={related.slug} href={related.path} className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--cyan)] hover:underline">{related.title} <ArrowRight className="w-3.5 h-3.5" /></Link>)}</div></section>
        </div>
      </article>
    </>
  );
}
