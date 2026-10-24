import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Guide } from "@/lib/guides";
import { getTool, type Tool } from "@/lib/tools";

export function GuideToolCta({ guide }: { guide: Guide }) {
  const tools = (guide.relatedTools ?? [])
    .map((slug) => getTool(slug))
    .filter((tool): tool is Tool => Boolean(tool));

  if (tools.length === 0) return null;

  return (
    <div className="mt-6 space-y-3">
      {tools.map((tool) => (
        <div
          key={tool.slug}
          className="p-4 rounded-lg border border-[var(--hairline-strong)] bg-[var(--bg-raise)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <div className="font-display text-sm font-semibold text-[var(--fg)]">
              Try the {tool.title}
            </div>
            <div className="mt-1 text-xs text-[var(--fg-muted)] leading-relaxed">
              {tool.cardDescription}
            </div>
          </div>
          <Link
            href={tool.path}
            className="inline-flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-medium text-black hover:opacity-90 transition-opacity whitespace-nowrap"
            style={{ backgroundColor: `var(${guide.accentVar})` }}
          >
            Open {tool.title}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ))}
    </div>
  );
}
