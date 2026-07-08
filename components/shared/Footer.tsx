import { GitHubStars } from "./GitHubStars";

export function Footer() {
  return (
    <footer className="border-t border-[var(--hairline)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-[11px] text-[var(--fg-dim)]">
          © {new Date().getFullYear()} CODERCOPS
        </span>
        <div className="flex items-center gap-3">
          <GitHubStars showLabel />
          <a
            href="https://www.codercops.com"
            className="font-mono text-[11px] tracking-wider uppercase text-[var(--fg-dim)] hover:text-[var(--fg)] transition-colors"
          >
            codercops.com
          </a>
        </div>
      </div>
    </footer>
  );
}
