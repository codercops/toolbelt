import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { Faq } from "@/components/shared/Faq";
import { GuideToolCta } from "@/components/shared/GuideToolCta";
import { getGuide, getRelatedGuides } from "@/lib/guides";
import { generateGuideMetadata } from "@/lib/toolMetadata";
import { guideArticleJsonLd, guideBreadcrumbJsonLd, guideFaqJsonLd, guideHowToJsonLd } from "@/lib/jsonLd";

const guide = getGuide("uuid-v4-vs-v7-generate-uuid")!;
const relatedGuides = getRelatedGuides(guide.slug);
export const metadata: Metadata = generateGuideMetadata(guide);

const codeClass = "font-mono text-[var(--fg)]";
const h2Class = "font-display text-2xl font-semibold text-[var(--fg)] mb-4";
const tableWrapClass = "mt-4 overflow-x-auto rounded-lg border border-[var(--hairline)]";
const tableClass = "w-full text-left text-[13.5px]";
const theadClass = "bg-[var(--bg-raise)] font-mono text-[11px] uppercase tracking-wider text-[var(--fg-dim)]";
const tbodyClass = "divide-y divide-[var(--hairline)]";
const thClass = "px-4 py-3";
const tdClass = "px-4 py-3 align-top";
const tdCodeClass = "px-4 py-3 align-top font-mono text-[var(--fg)] whitespace-nowrap";
const linkClass = "text-[var(--cyan)] hover:underline";

type Row = [ReactNode, ReactNode, ReactNode];
function Table({ heads, rows, wide = false }: { heads: [string, string, string]; rows: Row[]; wide?: boolean }) {
  return (
    <div className={tableWrapClass}>
      <table className={tableClass}>
        <thead className={theadClass}>
          <tr>{heads.map((head) => <th key={head} className={thClass}>{head}</th>)}</tr>
        </thead>
        <tbody className={tbodyClass}>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className={tdCodeClass}>{row[0]}</td>
              <td className={wide ? tdClass : tdCodeClass}>{row[1]}</td>
              <td className={tdClass}>{row[2]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const C = ({ children }: { children: string }) => <code className={codeClass}>{children}</code>;

// Every UUID and result below is produced by lib/uuid.ts; the test in
// lib/__tests__/uuid-guide-examples.test.ts checks them against the tool.
const VARIANTS: Row[] = [
  ["0xxx", "NCS (reserved)", "Reserved for backward compatibility with NCS. The nil UUID has this variant."],
  ["10xx", "RFC 9562", "The variant defined by the RFC. Every v4 and v7 UUID uses it, so the first digit of the fourth group is 8, 9, a or b."],
  ["110x", "Microsoft (reserved)", "Reserved for backward compatibility with Microsoft."],
  ["111x", "Future (reserved)", "Reserved for future definition. The max UUID has this variant."],
];

const V4_LAYOUT: Row[] = [
  ["Random", "122 bits", "Everything except the six fixed bits"],
  ["Version", "4 bits", "0100, so the first digit of the third group is 4"],
  ["Variant", "2 bits", "10, so the first digit of the fourth group is 8, 9, a or b"],
];

const V7_LAYOUT: Row[] = [
  ["unix_ts_ms", "48 bits", "The Unix time in milliseconds, big-endian, in the first 12 hex digits"],
  ["ver", "4 bits", "0111, so the first digit of the third group is 7"],
  ["rand_a", "12 bits", "Random in this generator"],
  ["var", "2 bits", "10"],
  ["rand_b", "62 bits", "Random in this generator"],
];

const COMPARE: Row[] = [
  ["Random bits", "122", "74 (12 in rand_a and 62 in rand_b)"],
  ["Starts with", "Random digits", "The Unix time in milliseconds"],
  ["Sorts by creation time", "No", "Yes, as raw bytes or as text"],
  ["Shows when it was made", "No", "Yes, anyone with the UUID can read the time"],
  ["Made in the same millisecond", "No order at all", "Different, but not in creation order unless a counter is added"],
];

const SPECIAL: Row[] = [
  ["00000000-0000-0000-0000-000000000000", "Nil UUID (version 0), NCS (reserved)", "Every bit is zero"],
  ["ffffffff-ffff-ffff-ffff-ffffffffffff", "Max UUID (version 15), Future (reserved)", "Every bit is one"],
];

export default function UuidGuidePage() {
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
            <span className="inline-flex items-center gap-1.5 text-[var(--amber)]"><BookOpen className="w-3 h-3" />{guide.tagline}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />Published {guide.publishedAt}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{guide.readingTime}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[var(--fg)] leading-tight">{guide.title}</h1>
          <p className="mt-4 text-[16px] text-[var(--fg-muted)] leading-relaxed">{guide.cardDescription}</p>
          <GuideToolCta guide={guide} />
        </header>

        <div className="space-y-12 text-[15px] text-[var(--fg-muted)] leading-relaxed">
          <section>
            <p>
              <strong className="text-[var(--fg)]">A UUID is a 128-bit identifier, written as 32 hex digits in five groups of 8, 4, 4, 4 and 12 (<C>550e8400-e29b-41d4-a716-446655440000</C>).</strong> A version 4 UUID is 122 random bits, while a version 7 UUID starts with the Unix time in milliseconds, so version 7 values sort by creation time and version 4 values do not.
            </p>
            <p className="mt-4">
              Use v7 when you want identifiers that sort in the order they were made, and v4 when you only need a unique value. To make one, open the <Link href="/uuid-generator" className={linkClass}>UUID Generator &amp; Inspector</Link>, choose a version and press Generate UUIDs.
            </p>
          </section>

          <section>
            <h2 className={h2Class}>What is a UUID and how is it written?</h2>
            <p>
              A UUID (Universally Unique IDentifier, also called a GUID) is 128 bits long. The usual text form, which RFC 9562 calls hex-and-dash, writes it as 32 hex digits in groups of 8, 4, 4, 4 and 12, joined by hyphens: <C>00112233-4455-6677-8899-aabbccddeeff</C>. The groups are 4, 2, 2, 2 and 6 bytes. The hyphens are only formatting, so the same UUID is also written as <C>00112233445566778899aabbccddeeff</C>, and the case of the digits does not matter.
            </p>
            <p className="mt-4">
              RFC 9562 replaced RFC 4122 in May 2024. It added version 7, a Unix-time based UUID, along with versions 6 and 8.
            </p>
          </section>

          <section>
            <h2 className={h2Class}>Where do the version and the variant sit in a UUID?</h2>
            <p>
              The <strong className="text-[var(--fg)]">version</strong> is the top 4 bits of byte 6, which is the first hex digit of the third group. In <C>550e8400-e29b-41d4-a716-446655440000</C> it is the 4 of <C>41d4</C>, so this is a version 4 UUID. The <strong className="text-[var(--fg)]">variant</strong> is the top bits of byte 8, the first hex digit of the fourth group. The RFC&apos;s variant is bits <C>10</C>, so that digit is 8, 9, a or b, and here it is the a of <C>a716</C>.
            </p>
            <Table heads={["Leading bits", "Variant", "Meaning"]} rows={VARIANTS} wide />
            <p className="mt-4">
              This is the table the inspector uses, so a UUID such as <C>12345678-1234-1234-c234-123456789012</C> shows the variant Microsoft (reserved).
            </p>
          </section>

          <section>
            <h2 className={h2Class}>What is a version 4 UUID?</h2>
            <p>
              A version 4 UUID is random. The generator takes 16 random bytes and overwrites the six version and variant bits, which leaves 122 random bits.
            </p>
            <Table heads={["Field", "Size", "What it holds"]} rows={V4_LAYOUT} wide />
            <p className="mt-4">
              The fixed bits are easy to see if you feed in the extremes. All-one bytes give <C>ffffffff-ffff-4fff-bfff-ffffffffffff</C> and all-zero bytes give <C>00000000-0000-4000-8000-000000000000</C>: everything is random except the 4 and the 8, 9, a or b.
            </p>
          </section>

          <section>
            <h2 className={h2Class}>What is a version 7 UUID?</h2>
            <p>
              A version 7 UUID begins with the Unix time in milliseconds, and the rest is random apart from the version and variant bits. The RFC calls the timestamp field <C>unix_ts_ms</C>.
            </p>
            <Table heads={["Field", "Size", "What it holds"]} rows={V7_LAYOUT} wide />
            <p className="mt-4">
              For example, <C>1793188800000</C> ms is 12:00:00 UTC on 28 October 2026, and its first 48 bits are <C>01a18261-a600</C>. With all-zero random bytes the UUID is <C>01a18261-a600-7000-8000-000000000000</C>, and with all-one random bytes it is <C>01a18261-a600-7fff-bfff-ffffffffffff</C>. The inspector reads the timestamp back from either one.
            </p>
            <p className="mt-4">
              Because the time comes first, version 7 UUIDs from different milliseconds sort in time order, and the RFC says they are designed so that databases can sort them as opaque raw bytes. Two UUIDs made in the <em>same</em> millisecond are different, because the bits after the timestamp are random, but they are not in the order they were made unless an implementation adds a counter. The UUID Generator sorts a version 7 batch, so the list comes out in ascending order.
            </p>
          </section>

          <section>
            <h2 className={h2Class}>UUID v4 or v7: which should I use?</h2>
            <Table heads={["", "Version 4", "Version 7"]} rows={COMPARE} wide />
            <ul className="mt-4 list-disc pl-6 space-y-3">
              <li><strong className="text-[var(--fg)]">Pick v7</strong> when you want identifiers that sort by creation time, for example as database keys, in logs, or in anything you list newest-last. RFC 9562 recommends v7 over the older time-based versions 1 and 6 when there is no legacy reason to keep them.</li>
              <li><strong className="text-[var(--fg)]">Pick v4</strong> when you only need a unique value and do not want it to carry a time. A v7 UUID shows when it was made to anyone who has it, and the inspector prints that time as an ISO date.</li>
            </ul>
            <p className="mt-4">
              The RFC does not say to use v7 instead of v4: it recommends v7 over v1 and v6. Which of v4 and v7 suits you depends on whether you want the time order and can accept the time being visible.
            </p>
          </section>

          <section>
            <h2 className={h2Class}>What are the nil and max UUIDs?</h2>
            <p>The RFC defines two special UUIDs. The inspector recognizes both:</p>
            <Table heads={["UUID", "The inspector shows", "Meaning"]} rows={SPECIAL} wide />
          </section>

          <section>
            <h2 className={h2Class}>How likely is a UUID collision?</h2>
            <p>
              RFC 9562 gives no collision figure. It says implementations should use a cryptographically secure random number generator so that values have a low likelihood of collision, and also that true global uniqueness cannot be guaranteed. You can work out the odds for version 4 yourself with the usual birthday approximation: with 122 random bits you would need to generate about <strong className="text-[var(--fg)]">2.7 quintillion</strong> (2.7 × 10<sup>18</sup>) UUIDs for a 50% chance of one duplicate, and about <strong className="text-[var(--fg)]">103 trillion</strong> (1.03 × 10<sup>14</sup>) for a one in a billion chance. That assumes the random bits are really random, which is why the generator uses <C>crypto.getRandomValues</C>.
            </p>
            <p className="mt-4">
              For version 7, a collision needs the same millisecond <em>and</em> the same 74 random bits.
            </p>
            <p className="mt-4">
              A UUID is not a secret. RFC 9562 says implementations should not assume UUIDs are hard to guess and that they must not be used as security capabilities, meaning identifiers that grant access just by being possessed.
            </p>
          </section>

          <section>
            <h2 className={h2Class}>What is specific to the UUID Generator &amp; Inspector?</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>It makes <strong className="text-[var(--fg)]">version 4 and version 7</strong> UUIDs, <strong className="text-[var(--fg)]">1 to 100 at a time</strong>, with the random bits from <C>crypto.getRandomValues</C>.</li>
              <li>You can show them in <strong className="text-[var(--fg)]">uppercase</strong> or <strong className="text-[var(--fg)]">without hyphens</strong>. Each UUID has a copy button, and Copy all copies the whole list, one per line.</li>
              <li>A version 7 UUID puts the Unix time in milliseconds in its first 48 bits, and the generator sorts a version 7 batch so the list comes out in ascending order.</li>
              <li>The inspector reads a UUID <strong className="text-[var(--fg)]">with or without hyphens, in any case</strong>. It shows the version, the variant, whether it is the nil or the max UUID, and for versions 1 and 7 the timestamp in milliseconds and as an ISO date. Version 1 also shows its raw 100-nanosecond timestamp, clock sequence, and hexadecimal node identifier. The node may be randomly generated and does not necessarily identify a physical device.</li>
              <li>It only accepts the plain 32-digit forms: a UUID wrapped in braces, such as <C>{"{550e8400-e29b-41d4-a716-446655440000}"}</C>, is reported as invalid, so remove the braces first.</li>
              <li>Everything runs in your browser, and nothing you generate or paste is uploaded.</li>
            </ul>
          </section>

          <section>
            <h2 className={h2Class}>Try the UUID Generator &amp; Inspector</h2>
            <p>
              Open the <Link href="/uuid-generator" className={linkClass}>UUID Generator &amp; Inspector</Link>, choose UUID v7, generate a batch and paste one of the results into the inspector to read its timestamp. Then paste <C>550e8400-e29b-41d4-a716-446655440000</C> to see version 4 and the RFC 9562 variant.
            </p>
          </section>

          <section>
            <h2 className={h2Class}>How to generate a UUID</h2>
            <div className="space-y-4">{guide.steps.map((step, i) => <div key={step.name} id={`step-${i + 1}`} className="p-5 rounded-lg border border-[var(--hairline)] bg-[var(--bg-raise)] scroll-mt-20"><h3 className="font-display text-lg font-semibold text-[var(--fg)] mb-2">{i + 1}. {step.name}</h3><p>{step.text}</p></div>)}</div>
          </section>

          {guide.faqs && <section className="pt-6 border-t border-[var(--hairline)]"><h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-6">{"// Frequently Asked Questions"}</h2><div className="grid gap-4">{guide.faqs.map((f) => <Faq key={f.q} q={f.q} a={f.a} />)}</div></section>}
          <section className="pt-6 border-t border-[var(--hairline)]"><div className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-3">Keep reading</div><div className="flex flex-wrap gap-3">{relatedGuides.map((related) => <Link key={related.slug} href={related.path} className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--cyan)] hover:underline">{related.title} <ArrowRight className="w-3.5 h-3.5" /></Link>)}</div></section>
        </div>
      </article>
    </>
  );
}
