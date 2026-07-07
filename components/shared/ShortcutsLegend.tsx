"use client";

import { Keyboard } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface Shortcut {
  keys: string[];
  label: string;
}

export function ShortcutsLegend({ shortcuts }: { shortcuts: Shortcut[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost"
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 card-raise p-3 z-30 animate-fade-in shadow-2xl">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-2 px-1">
            Keyboard shortcuts
          </div>
          <ul className="space-y-1">
            {shortcuts.map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-white/[0.03]"
              >
                <span className="text-[13px] text-[var(--fg)]">{s.label}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k, i) => (
                    <kbd key={i} className="kbd">
                      {k}
                    </kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
