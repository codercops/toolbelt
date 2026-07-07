"use client";

import { useState } from "react";
import { Play, AlertCircle, Sparkles } from "lucide-react";
import { encodeJwt, type SupportedAlg } from "@/lib/jwt-utils";
import { validate as validateJson } from "@/lib/json-utils";
import { CopyButton } from "@/components/shared/CopyButton";
import { useToast } from "@/components/shared/Toast";
import { JWT_TEMPLATES } from "@/lib/jwt-templates";
import { cn } from "@/lib/cn";

const ALG_GROUPS: { label: string; algs: SupportedAlg[] }[] = [
  { label: "HMAC (symmetric)", algs: ["HS256", "HS384", "HS512"] },
  { label: "RSA PKCS#1 v1.5", algs: ["RS256", "RS384", "RS512"] },
  { label: "RSA PSS", algs: ["PS256", "PS384", "PS512"] },
  { label: "ECDSA", algs: ["ES256", "ES384", "ES512"] },
];

const DEFAULT_PAYLOAD = () => `{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": ${Math.floor(Date.now() / 1000)},
  "exp": ${Math.floor(Date.now() / 1000) + 3600}
}`;

export function EncoderTab() {
  const [alg, setAlg] = useState<SupportedAlg>("HS256");
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD());
  const [keyMaterial, setKeyMaterial] = useState("your-256-bit-secret");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  const isHmac = alg.startsWith("HS");

  async function generate() {
    setError(null);
    const v = validateJson(payload);
    if (!v.ok) {
      setError(`Payload is not valid JSON — ${v.error.message}`);
      return;
    }
    if (!keyMaterial) {
      setError(isHmac ? "Secret is required" : "Private key is required");
      return;
    }
    try {
      setLoading(true);
      const payloadObj = JSON.parse(payload);
      const t = await encodeJwt({}, payloadObj, keyMaterial, alg);
      setToken(t);
      push("Token generated ✓", "success");
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message.includes("InvalidAccessError") || e.message.includes("DataError")
            ? "Key could not be imported. Check format (PEM PKCS8 for private, PEM SPKI for public, or JWK JSON)."
            : e.message
          : "Failed to generate token"
      );
    } finally {
      setLoading(false);
    }
  }

  function loadTemplate(id: string) {
    const t = JWT_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setPayload(JSON.stringify(t.payload, null, 2));
    if (typeof t.header.alg === "string") {
      const supported = ["HS256","HS384","HS512","RS256","RS384","RS512","PS256","PS384","PS512","ES256","ES384","ES512"];
      if (supported.includes(t.header.alg)) setAlg(t.header.alg as SupportedAlg);
    }
    push(`Loaded ${t.name}`, "info");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--violet)]">
              Algorithm
            </span>
          </div>
          <div className="p-4 space-y-3">
            <select
              value={alg}
              onChange={(e) => setAlg(e.target.value as SupportedAlg)}
              className="w-full px-3 py-2 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] text-[var(--fg)] font-mono text-[13px]"
            >
              {ALG_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.algs.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="font-mono text-[11px] text-[var(--fg-muted)]">
              {alg.startsWith("HS") && "HMAC with SHA-" + alg.slice(2) + " · symmetric · paste a raw string secret"}
              {alg.startsWith("RS") && "RSASSA-PKCS1-v1_5 · paste PEM PKCS#8 private key"}
              {alg.startsWith("PS") && "RSA-PSS · paste PEM PKCS#8 private key"}
              {alg.startsWith("ES") && "ECDSA · paste PEM PKCS#8 private key"}
            </p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--sky)]">
              Payload (JSON)
            </span>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) loadTemplate(e.target.value);
                  e.currentTarget.selectedIndex = 0;
                }}
                className="bg-[var(--bg-soft)] border border-[var(--hairline)] rounded px-2 py-1 text-[11.5px] text-[var(--fg)] font-mono"
              >
                <option value="">Templates…</option>
                {JWT_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-ghost py-1 !text-[11px]"
                onClick={() => setPayload(DEFAULT_PAYLOAD())}
                title="Reset to default"
              >
                <Sparkles className="w-3 h-3" />
                Reset
              </button>
            </div>
          </div>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            spellCheck={false}
            className="editor-input w-full px-4 py-3 min-h-[180px]"
            style={{ minHeight: 200 }}
          />
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
            <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--lime)]">
              {isHmac ? "Secret" : "Private key (PEM PKCS#8 or JWK)"}
            </span>
            <span className="font-mono text-[11px] text-[var(--fg-dim)]">
              {isHmac ? "raw string · utf-8" : "-----BEGIN PRIVATE KEY----- or JSON"}
            </span>
          </div>
          {isHmac ? (
            <input
              value={keyMaterial}
              onChange={(e) => setKeyMaterial(e.target.value)}
              spellCheck={false}
              type="text"
              className="editor-input w-full px-4 py-3 bg-transparent font-mono"
            />
          ) : (
            <textarea
              value={keyMaterial}
              onChange={(e) => setKeyMaterial(e.target.value)}
              spellCheck={false}
              placeholder={"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"}
              className="editor-input w-full px-4 py-3 bg-transparent font-mono text-[12px]"
              style={{ minHeight: 160 }}
            />
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-primary" onClick={generate} disabled={loading}>
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? "Signing..." : "Generate JWT"}</span>
          </button>
          {error && (
            <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--rose)]">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </span>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
          <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--cyan)]">
            Generated token
          </span>
          <CopyButton value={token} disabled={!token} className="py-1" />
        </div>
        {token ? (
          <div className="p-4 font-mono text-[12.5px] leading-[1.75] break-all">
            <ColorizedJwt token={token} />
            <div className="mt-4 flex flex-col gap-1 font-mono text-[11px] text-[var(--fg-dim)]">
              <span>Length · {token.length} chars</span>
              <span className="text-[var(--fg-muted)]">
                Paste into the Decode tab to verify the payload round-trips.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-[var(--fg-muted)] text-[13px]">
            Signed JWT will appear here.
          </div>
        )}
      </div>
    </div>
  );
}

function ColorizedJwt({ token }: { token: string }) {
  const parts = token.split(".");
  if (parts.length !== 3) return <>{token}</>;
  return (
    <>
      <span className="jwt-part-h">{parts[0]}</span>
      <span className="jwt-dot">.</span>
      <span className="jwt-part-p">{parts[1]}</span>
      <span className="jwt-dot">.</span>
      <span className="jwt-part-s">{parts[2]}</span>
    </>
  );
}

void cn;
