import { ArrowRight } from "lucide-react";

interface CtaBannerProps {
  headline: string;
  sub: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export function CtaBanner({
  headline,
  sub,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CtaBannerProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--hairline-strong)] bg-gradient-to-br from-[var(--cta-from)] to-[var(--cta-to)]">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(ellipse 70% 80% at 70% 30%, black, transparent 70%)",
          }}
        />
        {/* Accent glow */}
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-40"
          style={{
            background:
              "radial-gradient(circle, rgba(0,229,199,0.25) 0%, transparent 60%)",
            filter: "blur(40px)",
          }}
        />
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)] animate-pulse" />
              <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--cyan)]">
                CODERCOPS · For builders
              </span>
            </div>
            <h3 className="font-display text-2xl md:text-3xl font-semibold tracking-tight text-[var(--fg)] leading-tight">
              {headline}
            </h3>
            <p className="mt-3 text-[var(--fg-muted)] text-[15px] leading-relaxed">{sub}</p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <a
              href={primaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary justify-center md:justify-start px-5 py-2.5 text-[13px]"
            >
              {primaryLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href={secondaryHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn justify-center md:justify-start px-5 py-2.5 text-[13px]"
            >
              {secondaryLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
