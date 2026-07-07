"use client";

import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import type { SecurityFinding } from "@/lib/jwt-utils";

export function AuditPanel({ findings }: { findings: SecurityFinding[] }) {
  if (findings.length === 0) {
    return (
      <div className="card p-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--cyan)]" />
          <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
            Security audit
          </span>
        </div>
        <p className="mt-2 text-[13px] text-[var(--cyan)]">No security issues detected.</p>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
        <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--rose)]">
          Security audit · {findings.length} finding{findings.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul>
        {findings.map((f, i) => {
          const color =
            f.level === "critical"
              ? "var(--rose)"
              : f.level === "warning"
              ? "var(--amber)"
              : "var(--sky)";
          const Icon =
            f.level === "critical" ? AlertOctagon : f.level === "warning" ? AlertTriangle : Info;
          return (
            <li
              key={i}
              className="flex items-start gap-3 px-4 py-3 border-b border-[var(--hairline)] last:border-b-0"
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-[10px] tracking-[0.22em] uppercase"
                    style={{ color }}
                  >
                    {f.level}
                  </span>
                  <span className="text-[13.5px] font-medium text-[var(--fg)]">{f.title}</span>
                </div>
                <p className="mt-1 text-[12.5px] text-[var(--fg-muted)] leading-relaxed">
                  {f.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
