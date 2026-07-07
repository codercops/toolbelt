"use client";

import { Command as CommandIcon } from "lucide-react";
import { useCommandPalette } from "./CommandPalette";

export function CommandPaletteButton() {
  const { open } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Open command palette"
      className="inline-flex items-center gap-2 px-2.5 h-8 rounded-md border border-[var(--hairline)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--hairline-strong)] transition-colors"
    >
      <CommandIcon className="w-3 h-3" />
      <kbd className="kbd !border-0 !bg-transparent !px-0 !py-0 !text-[10.5px]">⌘K</kbd>
    </button>
  );
}
