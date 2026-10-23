"use client";

import { Keyboard } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export interface Shortcut {
  keys: string[];
  label: string;
}

export function ShortcutsLegend({ shortcuts }: { shortcuts: Shortcut[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupId = `shortcuts-popup-${useId()}`;
  const headingId = `${popupId}-heading`;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost"
        aria-label="Keyboard shortcuts"
        aria-expanded={open}
        aria-controls={popupId}
      >
        <Keyboard className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Shortcuts</span>
      </button>
      {open && (
        <div
          id={popupId}
          role="dialog"
          aria-labelledby={headingId}
          className="absolute right-0 top-full mt-2 w-72 card-raise p-3 z-30 animate-fade-in shadow-2xl"
        >
          <div
            id={headingId}
            className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-2 px-1"
          >
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