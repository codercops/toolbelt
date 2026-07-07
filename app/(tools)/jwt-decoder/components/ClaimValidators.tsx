"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import type { DecodedJwt } from "@/lib/jwt-utils";
import { cn } from "@/lib/cn";

interface Props {
  decoded: DecodedJwt;
}

interface Check {
  label: string;
  pass: boolean;
  actual: string;
  detail?: string;
}

export function ClaimValidators({ decoded }: Props) {
  const [iss, setIss] = useState("");
  const [aud, setAud] = useState("");
  const [leeway, setLeeway] = useState(30);

  const now = Math.floor(Date.now() / 1000);
  const payload = decoded.payload;

  const checks: Check[] = useMemo(() => {
    const out: Check[] = [];

    if (iss) {
      out.push({
        label: `iss matches "${iss}"`,
        pass: payload.iss === iss,
        actual: String(payload.iss ?? "(missing)"),
      });
    }

    if (aud) {
      const pass = Array.isArray(payload.aud)
        ? (payload.aud as unknown[]).includes(aud)
        : payload.aud === aud;
      out.push({
        label: `aud contains "${aud}"`,
        pass,
        actual: Array.isArray(payload.aud) ? (payload.aud as string[]).join(", ") : String(payload.aud ?? "(missing)"),
      });
    }

    if (typeof payload.exp === "number") {
      out.push({
        label: "exp in future",
        pass: payload.exp + leeway >= now,
        actual: `${payload.exp} (${formatDelta(payload.exp - now)})`,
      });
    }

    if (typeof payload.nbf === "number") {
      out.push({
        label: "nbf reached",
        pass: payload.nbf - leeway <= now,
        actual: `${payload.nbf} (${formatDelta(payload.nbf - now)})`,
      });
    }

    if (typeof payload.iat === "number") {
      out.push({
        label: "iat not in future",
        pass: payload.iat - leeway <= now,
        actual: `${payload.iat} (${formatDelta(payload.iat - now)})`,
      });
    }
    return out;
  }, [iss, aud, leeway, now, payload]);

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
        <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--sky)]">
          Claim validators
        </span>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <InputRow label="Expected iss" value={iss} onChange={setIss} placeholder="https://auth.example.com" />
          <InputRow label="Expected aud" value={aud} onChange={setAud} placeholder="your-api" />
          <div>
            <label className="block font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-1">
              Clock leeway
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={leeway}
                onChange={(e) => setLeeway(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 px-2 py-1.5 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] text-[var(--fg)] font-mono text-[12.5px]"
              />
              <span className="font-mono text-[11px] text-[var(--fg-dim)]">seconds</span>
            </div>
          </div>
        </div>
        {checks.length === 0 ? (
          <p className="text-[12.5px] text-[var(--fg-muted)]">
            Fill in expected issuer or audience above to validate claims.
          </p>
        ) : (
          <ul className="space-y-1.5 mt-1">
            {checks.map((c, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-2 px-3 py-2 rounded-md border text-[13px]",
                  c.pass
                    ? "border-[rgba(0,229,199,0.25)] bg-[rgba(0,229,199,0.05)]"
                    : "border-[rgba(255,77,109,0.25)] bg-[rgba(255,77,109,0.04)]"
                )}
              >
                {c.pass ? (
                  <Check className="w-4 h-4 text-[var(--cyan)] mt-0.5" />
                ) : (
                  <X className="w-4 h-4 text-[var(--rose)] mt-0.5" />
                )}
                <div>
                  <div className="font-mono text-[12.5px] text-[var(--fg)]">{c.label}</div>
                  <div className="font-mono text-[11px] text-[var(--fg-muted)]">
                    actual: {c.actual}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InputRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-dim)] mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] text-[var(--fg)] font-mono text-[12.5px] outline-none focus:border-[var(--cyan)]"
      />
    </div>
  );
}

function formatDelta(seconds: number): string {
  const abs = Math.abs(seconds);
  const unit =
    abs < 60 ? `${Math.round(abs)}s` :
    abs < 3600 ? `${Math.round(abs / 60)}m` :
    abs < 86400 ? `${Math.round(abs / 3600)}h` :
    `${Math.round(abs / 86400)}d`;
  return seconds >= 0 ? `in ${unit}` : `${unit} ago`;
}
