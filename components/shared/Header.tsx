import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPaletteButton } from "./CommandPaletteButton";
import { GitHubStars } from "./GitHubStars";

export function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--bg-header)] border-b border-[var(--hairline)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative flex items-center justify-center">
            <span className="absolute inset-0 rounded-[6px] bg-[rgba(0,229,199,0.16)] blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative w-7 h-7 rounded-[6px] border border-[var(--hairline-strong)] bg-[var(--bg-raise)] flex items-center justify-center font-mono text-[11px] font-bold tracking-tight text-[var(--cyan)]">
              {"{}"}
            </span>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display font-semibold text-[13px] tracking-tight text-[var(--fg)]">
              CODERCOPS
            </span>
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
              tools
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="hidden sm:inline-flex font-mono text-[11px] tracking-wider uppercase text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors px-2 py-1"
          >
            All tools
          </Link>
          <a
            href="https://www.codercops.com"
            className="hidden md:inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider uppercase text-[var(--fg-muted)] hover:text-[var(--cyan)] transition-colors px-2 py-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to CODERCOPS</span>
          </a>
          <GitHubStars />
          <CommandPaletteButton />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
