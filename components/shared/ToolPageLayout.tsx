import { cn } from "@/lib/cn";
import { toolJsonLd } from "@/lib/toolMetadata";
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
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pt-10 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <span
            className="font-mono text-[10.5px] tracking-[0.22em] uppercase"
            style={{ color: `var(${tool.accentVar})` }}
          >
            /{tool.slug}
          </span>
          <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
          <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
            {tool.heroBreadcrumb}
          </span>
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
