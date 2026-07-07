import { ToolCard } from "@/components/shared/ToolCard";
import { CtaBanner } from "@/components/shared/CtaBanner";
import { Footer } from "@/components/shared/Footer";
import { TOOLS } from "@/lib/tools";

export default function HomePage() {
  return (
    <>
      <section className="relative">
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-14">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse" />
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-muted)]">
              Runs entirely in your browser · Zero uploads
            </span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-[var(--fg)] leading-[0.98] max-w-4xl">
            Sharp, focused tools<br />for the daily grind of{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-[var(--cyan)]">shipping software</span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-[rgba(0,229,199,0.12)] -z-0" />
            </span>
            .
          </h1>
          <p className="mt-6 max-w-2xl text-[var(--fg-muted)] text-[16px] md:text-[17px] leading-relaxed">
            A small, careful collection of developer utilities — formatters, decoders,
            encoders. No login, no analytics that follow you, no data leaves your tab.
            Built and maintained by{" "}
            <a
              href="https://www.codercops.com"
              className="text-[var(--fg)] underline decoration-[var(--cyan)] underline-offset-4 hover:text-[var(--cyan)] transition-colors"
            >
              CODERCOPS
            </a>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-14">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
            &#47;&#47; Available tools
          </h2>
          <span className="font-mono text-[11px] text-[var(--fg-dim)]">{TOOLS.length} tools</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 reveal">
          {TOOLS.map((tool) => (
            <ToolCard
              key={tool.slug}
              href={tool.path}
              slug={tool.slug}
              title={tool.title}
              tagline={tool.tagline}
              accentVar={tool.accentVar}
              accentHex={tool.accentHex}
              description={tool.cardDescription}
              features={tool.features}
            />
          ))}
        </div>
      </section>

      <CtaBanner
        headline="Need more than a tool? We build the whole product."
        sub="CODERCOPS builds production-grade backends, REST APIs, auth systems, and full-stack applications for startups and enterprises."
        primaryLabel="View our work"
        primaryHref="https://www.codercops.com/projects"
        secondaryLabel="Get a free quote"
        secondaryHref="https://www.codercops.com/contact"
      />

      <Footer />
    </>
  );
}
