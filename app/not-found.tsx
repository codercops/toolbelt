import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found — CODERCOPS Tools",
};

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="text-center max-w-md">
        <p className="font-mono text-[64px] font-semibold leading-none text-[var(--cyan)]">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-[var(--fg)]">
          That page does not exist
        </h1>
        <p className="mt-2 text-[14px] text-[var(--fg-muted)] leading-relaxed">
          The tool or page you are looking for is not here. Everything runs in your browser, so
          nothing was lost.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Browse all tools
          </Link>
        </div>
      </div>
    </div>
  );
}
