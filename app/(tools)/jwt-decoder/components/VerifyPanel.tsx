"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert, Loader2, Globe } from "lucide-react";
import {
  fetchJwks,
  type SupportedAlg,
  verifyJwt,
  verifyWithJwks,
  type JwksKey,
} from "@/lib/jwt-utils";
import { cn } from "@/lib/cn";

interface VerifyPanelProps {
  token: string;
  alg: SupportedAlg | string | undefined;
}

type VerifyState =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "valid" }
  | { status: "invalid"; reason?: string }
  | { status: "error"; reason: string };

export function VerifyPanel({ token, alg }: VerifyPanelProps) {
  const [mode, setMode] = useState<"secret" | "jwks">("secret");
  const [secret, setSecret] = useState("");
  const [jwksUrl, setJwksUrl] = useState("");
  const [jwksKeys, setJwksKeys] = useState<JwksKey[] | null>(null);
  const [jwksLoading, setJwksLoading] = useState(false);
  const [jwksError, setJwksError] = useState<string | null>(null);
  const [state, setState] = useState<VerifyState>({ status: "idle" });

  const supported = typeof alg === "string" && /^(HS|RS|PS|ES)\d+$/.test(alg);
  const isHmac = typeof alg === "string" && alg.startsWith("HS");

  const runVerify = useCallback(async () => {
    if (!supported || !token) return;
    setState({ status: "pending" });
    try {
      if (mode === "secret") {
        if (!secret && isHmac) return setState({ status: "idle" });
        if (!secret && !isHmac) return setState({ status: "idle" });
        const r = await verifyJwt(token, secret, alg as SupportedAlg);
        if (r.ok) {
          setState(r.valid ? { status: "valid" } : { status: "invalid" });
        } else {
          setState({ status: "error", reason: r.error });
        }
      } else {
        if (!jwksKeys) return;
        const r = await verifyWithJwks(token, jwksKeys);
        if (r.ok) {
          setState(r.valid ? { status: "valid" } : { status: "invalid" });
        } else {
          setState({ status: "error", reason: r.error });
        }
      }
    } catch (e) {
      setState({ status: "error", reason: e instanceof Error ? e.message : "Unknown error" });
    }
  }, [supported, token, mode, secret, jwksKeys, alg, isHmac]);

  // Auto-verify on secret change (debounced)
  useEffect(() => {
    if (mode !== "secret") return;
    if (!secret) {
      setState({ status: "idle" });
      return;
    }
    const id = window.setTimeout(runVerify, 220);
    return () => window.clearTimeout(id);
  }, [mode, secret, runVerify]);

  // Auto-verify when jwksKeys loaded
  useEffect(() => {
    if (mode === "jwks" && jwksKeys) runVerify();
  }, [mode, jwksKeys, runVerify]);

  async function loadJwks() {
    if (!jwksUrl) return;
    setJwksLoading(true);
    setJwksError(null);
    const r = await fetchJwks(jwksUrl.trim());
    setJwksLoading(false);
    if (r.ok) {
      setJwksKeys(r.keys);
    } else {
      setJwksError(r.error ?? "Failed to load JWKS");
      setJwksKeys(null);
    }
  }

  if (!supported) {
    return (
      <div className="card p-4">
        <p className="text-[13px] text-[var(--fg-muted)]">
          Signature verification is not available for this algorithm.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-[var(--cyan)]" />
          <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--cyan)]">
            Verify signature
          </span>
        </div>
        <VerifyStatus state={state} />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="segmented">
            <button data-active={mode === "secret"} onClick={() => setMode("secret")}>
              {isHmac ? "Secret" : "PEM / JWK"}
            </button>
            <button
              data-active={mode === "jwks"}
              onClick={() => setMode("jwks")}
              disabled={isHmac}
              title={isHmac ? "JWKS only for asymmetric algorithms" : "Fetch keys from JWKS URL"}
              className={isHmac ? "opacity-40 cursor-not-allowed" : ""}
            >
              JWKS URL
            </button>
          </div>
        </div>

        {mode === "secret" && (
          <>
            {isHmac ? (
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                spellCheck={false}
                placeholder="Shared HMAC secret..."
                className="w-full px-3 py-2 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] text-[var(--fg)] font-mono text-[13px] outline-none focus:border-[var(--cyan)]"
              />
            ) : (
              <textarea
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                spellCheck={false}
                placeholder={`Paste PEM public key (-----BEGIN PUBLIC KEY-----) or JWK JSON to verify ${alg}...`}
                className="w-full px-3 py-2 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] text-[var(--fg)] font-mono text-[12.5px] outline-none focus:border-[var(--cyan)] resize-none"
                style={{ minHeight: 120 }}
              />
            )}
            <div className="mt-2 font-mono text-[10.5px] text-[var(--fg-dim)]">
              {isHmac
                ? "HMAC: Any UTF-8 string."
                : "Paste the public key in SPKI PEM format or the JWK JSON object."}
            </div>
          </>
        )}

        {mode === "jwks" && !isHmac && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="url"
                value={jwksUrl}
                onChange={(e) => setJwksUrl(e.target.value)}
                placeholder="https://your-auth-provider/.well-known/jwks.json"
                className="flex-1 px-3 py-2 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] text-[var(--fg)] font-mono text-[13px] outline-none focus:border-[var(--cyan)]"
              />
              <button
                className="btn btn-primary"
                onClick={loadJwks}
                disabled={jwksLoading || !jwksUrl}
              >
                {jwksLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
                {jwksLoading ? "Loading..." : "Fetch keys"}
              </button>
            </div>
            {jwksError && (
              <p className="text-[12.5px] text-[var(--rose)]">{jwksError}</p>
            )}
            {jwksKeys && (
              <p className="text-[12.5px] text-[var(--fg-muted)] font-mono">
                Loaded {jwksKeys.length} key(s): {jwksKeys.map((k) => k.kid ?? "(no kid)").join(", ").slice(0, 140)}
              </p>
            )}
            <p className="font-mono text-[10.5px] text-[var(--fg-dim)]">
              Note: The JWKS endpoint must allow cross-origin requests for browser fetch to succeed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function VerifyStatus({ state }: { state: VerifyState }) {
  if (state.status === "idle")
    return <span className="font-mono text-[10.5px] text-[var(--fg-dim)]">awaiting input</span>;
  if (state.status === "pending")
    return (
      <span className="font-mono text-[10.5px] text-[var(--fg-muted)] inline-flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        verifying
      </span>
    );
  if (state.status === "valid")
    return (
      <span className={cn("badge badge-ok")}>
        <CheckCircle2 className="w-3 h-3" />
        Signature valid
      </span>
    );
  if (state.status === "invalid")
    return <span className="badge badge-err">Signature invalid</span>;
  return (
    <span className="font-mono text-[10.5px] text-[var(--rose)] truncate max-w-[260px]" title={state.reason}>
      {state.reason}
    </span>
  );
}
