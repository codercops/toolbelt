"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24">
      <div className="card p-8 max-w-md text-center">
        <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--rose)] mb-3">
          Something broke
        </p>
        <h1 className="font-display text-2xl font-semibold text-[var(--fg)] mb-2">
          This tool hit an unexpected error
        </h1>
        <p className="text-[14px] text-[var(--fg-muted)] leading-relaxed mb-6">
          Nothing left your browser. You can retry, or head back to the tools list.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset} className="btn btn-primary">
            <RotateCw className="w-3.5 h-3.5" />
            Try again
          </button>
          <Link href="/" className="btn">
            All tools
          </Link>
        </div>
        {error.digest && (
          <p className="mt-5 font-mono text-[10px] text-[var(--fg-dim)]">ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
