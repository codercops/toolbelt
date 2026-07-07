"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, ArrowRight, Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { TOOLS } from "@/lib/tools";
import { cn } from "@/lib/cn";

export interface Command {
  id: string;
  title: string;
  hint?: string;
  section?: string;
  keywords?: string;
  run: () => void | Promise<void>;
  icon?: React.ReactNode;
  shortcut?: string[];
}

interface PaletteCtx {
  open: () => void;
  close: () => void;
  register: (scope: string, commands: Command[]) => () => void;
}

const Ctx = createContext<PaletteCtx | null>(null);

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();
  const scopedRef = useRef<Record<string, Command[]>>({});
  const [scopedTick, setScopedTick] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const register = useCallback((scope: string, commands: Command[]) => {
    scopedRef.current[scope] = commands;
    setScopedTick((n) => n + 1);
    return () => {
      delete scopedRef.current[scope];
      setScopedTick((n) => n + 1);
    };
  }, []);

  const open = useCallback(() => {
    setQuery("");
    setCursor(0);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((o) => !o);
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      } else if (e.key === "?" && !isOpen) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
        e.preventDefault();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Focus the input on open, and restore focus to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, [isOpen]);

  const allCommands: Command[] = useMemo(() => {
    void scopedTick;
    const navigationCommands: Command[] = [
      {
        id: "nav:home",
        section: "Navigation",
        title: "Go to Home",
        hint: "/",
        keywords: "home index tools",
        run: () => router.push("/"),
      },
      ...TOOLS.map((t) => ({
        id: `nav:${t.slug}`,
        section: "Navigation",
        title: `Go to ${t.title}`,
        hint: t.path,
        keywords: `${t.slug} ${t.tagline} ${t.features.join(" ")}`.toLowerCase(),
        run: () => router.push(t.path),
      })),
    ];
    const system: Command[] = [
      {
        id: "sys:theme",
        section: "System",
        title: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        icon: theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
        keywords: "theme dark light mode toggle",
        run: toggleTheme,
      },
    ];
    const scoped = Object.values(scopedRef.current).flat();
    return [...scoped, ...navigationCommands, ...system];
  }, [router, theme, toggleTheme, scopedTick]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter((c) =>
      (c.title + " " + (c.hint ?? "") + " " + (c.keywords ?? "") + " " + (c.section ?? ""))
        .toLowerCase()
        .includes(q)
    );
  }, [allCommands, query]);

  useEffect(() => setCursor(0), [query]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Tab") {
      // Trap focus: the palette is a combobox driven by arrows, so keep focus
      // on the input rather than letting Tab escape the modal.
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(filtered.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[cursor];
      if (cmd) {
        setIsOpen(false);
        Promise.resolve(cmd.run()).catch(() => {});
      }
    }
  }

  void pathname; // ensure rerender on route change

  return (
    <Ctx.Provider value={{ open, close, register }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center pt-24 px-4 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="w-full max-w-xl card-raise overflow-hidden animate-slide-down shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--hairline)]">
              <Search className="w-4 h-4 text-[var(--fg-dim)] shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search commands, tools, actions..."
                className="flex-1 bg-transparent text-[14px] text-[var(--fg)] outline-none font-mono"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-palette-listbox"
                aria-autocomplete="list"
                aria-activedescendant={filtered[cursor] ? `cmd-opt-${cursor}` : undefined}
                aria-label="Search commands"
              />
              <kbd className="kbd hidden sm:inline-block">esc</kbd>
            </div>
            <div id="cmd-palette-listbox" className="max-h-[360px] overflow-auto py-1" role="listbox">
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-[13px] text-[var(--fg-muted)]">
                  No matches for &quot;{query}&quot;
                </div>
              )}
              {filtered.map((cmd, i) => (
                <div key={cmd.id}>
                  {i === 0 || filtered[i - 1].section !== cmd.section ? (
                    <div className="px-4 pt-2 pb-1 font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                      {cmd.section ?? "Actions"}
                    </div>
                  ) : null}
                  <button
                    id={`cmd-opt-${i}`}
                    role="option"
                    aria-selected={i === cursor}
                    onClick={() => {
                      setIsOpen(false);
                      Promise.resolve(cmd.run()).catch(() => {});
                    }}
                    onMouseEnter={() => setCursor(i)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2 text-left transition-colors",
                      i === cursor ? "bg-white/[0.05]" : "hover:bg-white/[0.03]"
                    )}
                  >
                    <span className="w-4 flex items-center justify-center text-[var(--fg-muted)]">
                      {cmd.icon ?? <ArrowRight className="w-3 h-3" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13.5px] text-[var(--fg)] truncate">
                        {cmd.title}
                      </span>
                      {cmd.hint && (
                        <span className="block font-mono text-[11px] text-[var(--fg-dim)] truncate">
                          {cmd.hint}
                        </span>
                      )}
                    </span>
                    {cmd.shortcut && (
                      <span className="flex items-center gap-1 shrink-0">
                        {cmd.shortcut.map((k, j) => (
                          <kbd key={j} className="kbd">
                            {k}
                          </kbd>
                        ))}
                      </span>
                    )}
                  </button>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-[var(--hairline)] flex items-center justify-between font-mono text-[10.5px] text-[var(--fg-dim)]">
              <span className="flex items-center gap-2">
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-2">
                <kbd className="kbd">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-2">
                <kbd className="kbd">⌘</kbd>
                <kbd className="kbd">K</kbd>
                toggle
              </span>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useCommandPalette(): PaletteCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return { open: () => {}, close: () => {}, register: () => () => {} };
  }
  return ctx;
}

export function useRegisterCommands(scope: string, commands: Command[], deps: unknown[] = []) {
  const { register } = useCommandPalette();
  useEffect(() => {
    const unreg = register(scope, commands);
    return unreg;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, ...deps]);
}
