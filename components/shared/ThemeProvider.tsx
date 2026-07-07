"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light";
interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Seed from the attribute the pre-paint inline script already set (in
  // app/layout.tsx), so React does not re-flip the theme after hydration.
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof document !== "undefined") {
      const t = document.documentElement.dataset.theme;
      if (t === "dark" || t === "light") return t;
    }
    return "dark";
  });

  // Reflect on <html data-theme> and keep the native color-scheme in sync.
  useEffect(() => {
    const d = document.documentElement;
    d.setAttribute("data-theme", theme);
    d.style.colorScheme = theme;
    try {
      window.localStorage.setItem("cc:theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggle = useCallback(() => setThemeState((t) => (t === "dark" ? "light" : "dark")), []);

  return <Ctx.Provider value={{ theme, setTheme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) return { theme: "dark", setTheme: () => {}, toggle: () => {} };
  return ctx;
}
