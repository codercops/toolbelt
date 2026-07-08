import { Star } from "lucide-react";
import { cn } from "@/lib/cn";
import { GITHUB_REPO, GITHUB_REPO_URL } from "@/lib/tools";

// Server-side star-count fetch. Cached for an hour, so GitHub's API is hit at
// most once per hour (far under the 60/hr unauthenticated limit) no matter how
// much traffic we get, and no request ever reaches the browser. A bounded
// timeout plus a null fallback means a slow or failing GitHub never breaks a
// page — we just render the button without a count.
async function getStarCount(): Promise<number | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "toolbelt-site" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
  } catch {
    return null;
  }
}

function formatStars(n: number): string {
  if (n < 1000) return String(n);
  const k = n / 1000;
  // Decide the branch on the rounded value so 9.95k–9.999k renders "10k",
  // not "10.0k" (which matches neither the sub-10k nor the 10k+ format).
  return k >= 9.95 ? `${Math.round(k)}k` : `${k.toFixed(1)}k`;
}

// The official GitHub mark, inlined so we don't depend on lucide's deprecated
// brand icons.
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/**
 * A "Star on GitHub" link with a live star count. Renders in both the header
 * (compact, no label) and the footer (with label). If the count can't be
 * fetched it degrades to just the link, so people can still star.
 */
export async function GitHubStars({
  showLabel = false,
  className,
}: {
  showLabel?: boolean;
  className?: string;
}) {
  const count = await getStarCount();
  return (
    <a
      href={GITHUB_REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Star ${GITHUB_REPO} on GitHub${count != null ? `, ${formatStars(count)} star${count === 1 ? "" : "s"}` : ""}`}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline-strong)] bg-[var(--bg-raise)] px-2 py-1 font-mono text-[11px] text-[var(--fg-muted)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--fg)]",
        className
      )}
    >
      <GitHubMark className="w-3.5 h-3.5" />
      {showLabel && <span className="tracking-wider uppercase">Star on GitHub</span>}
      {count != null && (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Star className="w-3 h-3 fill-[var(--amber)] text-[var(--amber)]" aria-hidden="true" />
          {formatStars(count)}
        </span>
      )}
    </a>
  );
}
