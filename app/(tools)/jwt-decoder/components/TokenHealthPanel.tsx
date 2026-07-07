"use client";

import { CheckCircle2, XCircle, Clock, Cpu, KeySquare, ShieldAlert } from "lucide-react";
import type { DecodedJwt } from "@/lib/jwt-utils";
import { computeHealth, relativeTime } from "@/lib/jwt-utils";
import { useMemo } from "react";

export function TokenHealthPanel({ decoded }: { decoded: DecodedJwt }) {
  const health = useMemo(() => computeHealth(decoded), [decoded]);

  return (
    <div className="card p-4 sm:p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
        <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
          Token health
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          label="Structure"
          value="Valid · 3 parts"
          tone="ok"
        />
        <Stat
          icon={
            health.expiry.status === "valid" ? (
              <Clock className="w-3.5 h-3.5" />
            ) : health.expiry.status === "expired" ? (
              <XCircle className="w-3.5 h-3.5" />
            ) : health.expiry.status === "future" ? (
              <ShieldAlert className="w-3.5 h-3.5" />
            ) : (
              <Clock className="w-3.5 h-3.5" />
            )
          }
          label="Expiry"
          value={health.expiry.label}
          tone={
            health.expiry.status === "valid"
              ? "ok"
              : health.expiry.status === "expired"
              ? "err"
              : "warn"
          }
        />
        <Stat
          icon={<Cpu className="w-3.5 h-3.5" />}
          label="Algorithm"
          value={`${health.alg}`}
          sub={health.algDesc}
          tone="info"
        />
        <Stat
          icon={<KeySquare className="w-3.5 h-3.5" />}
          label="Claims"
          value={`${health.totalClaims}`}
          sub={`${health.standardCount} standard · ${health.customCount} custom`}
          tone="info"
        />
      </div>
      {health.iat !== null && (
        <div className="mt-3 text-[11.5px] font-mono text-[var(--fg-dim)]">
          Token age — issued {relativeTime(health.iat)}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone: "ok" | "err" | "warn" | "info";
}) {
  const color =
    tone === "ok"
      ? "var(--cyan)"
      : tone === "err"
      ? "var(--rose)"
      : tone === "warn"
      ? "var(--amber)"
      : "var(--sky)";
  const glow =
    tone === "ok"
      ? "rgba(0,229,199,0.1)"
      : tone === "err"
      ? "rgba(255,77,109,0.1)"
      : tone === "warn"
      ? "rgba(255,181,71,0.08)"
      : "rgba(90,181,255,0.08)";
  return (
    <div
      className="rounded-md px-3 py-2.5 border"
      style={{
        borderColor: "var(--hairline-strong)",
        background: glow,
      }}
    >
      <div className="flex items-center gap-1.5" style={{ color }}>
        {icon}
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase">{label}</span>
      </div>
      <div className="mt-1 font-display font-semibold text-[14.5px] text-[var(--fg)] truncate">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 font-mono text-[10.5px] text-[var(--fg-muted)] truncate">{sub}</div>
      )}
    </div>
  );
}
