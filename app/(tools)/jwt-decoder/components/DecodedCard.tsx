"use client";

import { useMemo } from "react";
import { tokenize } from "@/lib/json-utils";
import { formatTimestamp, relativeTime, STANDARD_CLAIMS } from "@/lib/jwt-utils";
import { CopyButton } from "@/components/shared/CopyButton";
import { cn } from "@/lib/cn";

interface DecodedCardProps {
  title: string;
  data: Record<string, unknown>;
  accent: string;
  algDescription?: string;
  isPayload?: boolean;
}

export function DecodedCard({
  title,
  data,
  accent,
  algDescription,
  isPayload,
}: DecodedCardProps) {
  const formatted = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const tokens = useMemo(() => tokenize(formatted), [formatted]);
  const claims = useMemo(
    () =>
      isPayload
        ? Object.entries(data).map(([key, value]) => ({
            key,
            value,
            standard: key in STANDARD_CLAIMS,
          }))
        : [],
    [data, isPayload]
  );

  return (
    <div
      className="card overflow-hidden animate-fade-in"
      style={{
        borderColor: "var(--hairline)",
        boxShadow: `0 0 60px -30px ${accent}60`,
      }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
        <div className="flex items-center gap-2.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
          />
          <span
            className="font-mono text-[10.5px] tracking-[0.22em] uppercase"
            style={{ color: accent }}
          >
            {title}
          </span>
          {algDescription && (
            <span className="hidden sm:inline font-mono text-[11px] text-[var(--fg-muted)] ml-2">
              · {algDescription}
            </span>
          )}
        </div>
        <CopyButton value={formatted} className="py-1" />
      </div>
      <pre className="px-4 py-3 font-mono text-[12.5px] leading-[1.7] whitespace-pre overflow-x-auto">
        {tokens.map((t, i) => {
          if (t.kind === "ws") return <span key={i}>{t.value}</span>;
          const kls =
            t.kind === "key"
              ? "tok-key"
              : t.kind === "string"
              ? "tok-string"
              : t.kind === "number"
              ? "tok-number"
              : t.kind === "bool"
              ? "tok-bool"
              : t.kind === "null"
              ? "tok-null"
              : t.kind === "brace"
              ? "tok-brace"
              : "tok-punct";
          return (
            <span key={i} className={kls}>
              {t.value}
            </span>
          );
        })}
      </pre>
      {isPayload && claims.length > 0 && (
        <div className="border-t border-[var(--hairline)] px-4 py-3 bg-[var(--bg-soft)]">
          <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-2">
            Humanized claims
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            {claims.map((c) => (
              <ClaimRow key={c.key} name={c.key} value={c.value} standard={c.standard} />
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}

function ClaimRow({
  name,
  value,
  standard,
}: {
  name: string;
  value: unknown;
  standard: boolean;
}) {
  const label = STANDARD_CLAIMS[name];
  const description = useMemo(() => {
    if (!standard) return null;
    if (name === "exp" && typeof value === "number") {
      const future = value * 1000 > Date.now();
      return (
        <span className="inline-flex items-center gap-2">
          <span>{formatTimestamp(value)}</span>
          <span
            className={cn(
              "badge",
              future ? "badge-ok" : "badge-err"
            )}
          >
            {future ? `expires ${relativeTime(value)}` : `expired ${relativeTime(value)}`}
          </span>
        </span>
      );
    }
    if ((name === "iat" || name === "nbf") && typeof value === "number") {
      return (
        <span className="inline-flex items-center gap-2">
          <span>{formatTimestamp(value)}</span>
          <span className="text-[var(--fg-dim)]">({relativeTime(value)})</span>
        </span>
      );
    }
    return null;
  }, [name, value, standard]);

  return (
    <>
      <dt className="font-mono text-[12px] text-[var(--fg-muted)] sm:text-right pt-[1px]">
        <span className={cn(standard ? "text-[var(--sky)]" : "text-[var(--fg-muted)]")}>
          {name}
        </span>
      </dt>
      <dd className="text-[12.5px] text-[var(--fg)] break-all">
        {label && (
          <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--fg-dim)] mr-2">
            {label}
          </span>
        )}
        {description ?? (
          <span className="font-mono text-[12.5px] text-[var(--fg)]">
            {typeof value === "object" ? JSON.stringify(value) : String(value)}
          </span>
        )}
      </dd>
    </>
  );
}
