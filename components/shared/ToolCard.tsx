import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface ToolCardProps {
  href: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  /** Theme-aware CSS variable name for text, e.g. "--sky". */
  accentVar: string;
  /** Raw hex for the decorative hover glow only. */
  accentHex: string;
}

export function ToolCard({
  href,
  slug,
  title,
  tagline,
  description,
  features,
  accentVar,
  accentHex,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group relative block card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--hairline-strong)]"
    >
      {/* Accent glow on hover */}
      <div
        className="absolute inset-0 rounded-[10px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(400px 200px at 50% 0%, ${accentHex}18, transparent 70%)`,
        }}
      />
      <div className="relative flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[10px] tracking-[0.22em] uppercase"
            style={{ color: `var(${accentVar})` }}
          >
            /{slug}
          </span>
          <span className="w-1 h-1 rounded-full bg-[var(--fg-dim)]" />
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
            {tagline}
          </span>
        </div>
        <ArrowUpRight className="w-4 h-4 text-[var(--fg-dim)] group-hover:text-[var(--fg)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="relative font-display text-2xl font-semibold tracking-tight text-[var(--fg)] leading-tight">
        {title}
      </h3>
      <p className="relative mt-2 text-[var(--fg-muted)] text-[14px] leading-relaxed">
        {description}
      </p>
      <ul className="relative mt-5 flex flex-wrap gap-1.5">
        {features.map((f) => (
          <li
            key={f}
            className="font-mono text-[10.5px] tracking-wide px-2 py-1 rounded-md border border-[var(--hairline)] text-[var(--fg-muted)] bg-white/[0.015]"
          >
            {f}
          </li>
        ))}
      </ul>
    </Link>
  );
}
