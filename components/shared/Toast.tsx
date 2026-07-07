"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Check, AlertCircle, Info } from "lucide-react";

type ToastVariant = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}
interface ToastCtx {
  push: (message: string, variant?: ToastVariant) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, message, variant }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 2800);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : undefined}
            className="animate-slide-down pointer-events-auto card-raise px-4 py-2.5 flex items-center gap-2.5 text-sm shadow-2xl min-w-[220px]"
            style={{
              borderColor:
                t.variant === "success"
                  ? "rgba(0,229,199,0.35)"
                  : t.variant === "error"
                  ? "rgba(255,77,109,0.35)"
                  : "rgba(90,181,255,0.3)",
            }}
          >
            {t.variant === "success" && <Check className="w-4 h-4 text-[var(--cyan)]" />}
            {t.variant === "error" && <AlertCircle className="w-4 h-4 text-[var(--rose)]" />}
            {t.variant === "info" && <Info className="w-4 h-4 text-[var(--sky)]" />}
            <span className="text-[var(--fg)] font-mono text-[12.5px]">{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      push: (msg: string) => {
        if (typeof window !== "undefined") console.log("[toast]", msg);
      },
    };
  }
  return ctx;
}
