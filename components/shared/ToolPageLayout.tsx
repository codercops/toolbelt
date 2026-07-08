import Link from "next/link";
import { cn } from "@/lib/cn";
import { toolJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonLd";
import type { Tool } from "@/lib/tools";
import { CtaBanner } from "./CtaBanner";
import { Faq } from "./Faq";

function splitOnce(s: string, sep: string): [string, string] {
  const i = sep ? s.indexOf(sep) : -1;
  if (i === -1) return [s, ""];
  return [s.slice(0, i), s.slice(i + sep.length)];
}

// Shared shell for every tool page: JSON-LD, hero, the interactive client, an
// optional FAQ, and the CTA. The footer is rendered once by the (tools) layout.
export function ToolPageLayout({
  tool,
  children,
}: {
  tool: Tool;
  children: React.ReactNode;
}) {
  const [before, after] = splitOnce(tool.heroHeading, tool.heroDim);
  // Keep both literals in source so Tailwind generates them.
  const faqCols = tool.faqs.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolJsonLd(tool)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(tool)) }}
      />
      {tool.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(tool)) }}
        />
      )}
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pt-10 pb-6">
        {/* The breadcrumb trail is only Home > Tool (matching the JSON-LD). The
            heroBreadcrumb tagline sits outside the <nav>/<ol> so assistive tech
            doesn't announce it as a third crumb. The current crumb uses --fg
            (not the accent) so it clears WCAG AA contrast in both themes. */}
        <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10.5px] tracking-[0.22em] uppercase">
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
              <li aria-current="page" className="text-[var(--fg)]">
                {tool.jsonLdName}
              </li>
            </ol>
          </nav>
          <span aria-hidden="true" className="text-[var(--fg-dim)]">
            ·
          </span>
          <span className="text-[var(--fg-dim)]">{tool.heroBreadcrumb}</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--fg)] leading-tight">
          {before}
          {tool.heroDim && <span className="text-[var(--fg-dim)]">{tool.heroDim}</span>}
          {after}
        </h1>
        <p className="mt-3 text-[var(--fg-muted)] text-[15px] max-w-2xl leading-relaxed">
          {tool.heroDescription}
        </p>
      </section>

      {children}

      {tool.faqs.length > 0 && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-8">
          <h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-5">
            &#47;&#47; FAQ
          </h2>
          <div className={cn("grid grid-cols-1 gap-4", faqCols)}>
            {tool.faqs.map((f) => (
              <Faq key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </section>
      )}

      <CtaBanner {...tool.cta} />
    </>
  );
}
