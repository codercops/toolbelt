"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "./Toast";
import { cn } from "@/lib/cn";

interface CopyButtonProps {
  value: string | (() => string);
  label?: string;
  successMessage?: string;
  className?: string;
  iconOnly?: boolean;
  disabled?: boolean;
}

export function CopyButton({
  value,
  label = "Copy",
  successMessage = "Copied to clipboard",
  className,
  iconOnly,
  disabled,
}: CopyButtonProps) {
  const { push } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const v = typeof value === "function" ? value() : value;
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
      setCopied(true);
      push(successMessage, "success");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      push("Could not copy — clipboard blocked", "error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      className={cn("btn", className)}
      aria-label={label}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[var(--cyan)]" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {!iconOnly && <span>{copied ? "Copied" : label}</span>}
    </button>
  );
}
