"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Download,
  Sparkles,
  Trash2,
  Share2,
  Info,
  ChevronDown,
  Lock,
  KeyRound,
  Signature,
  Terminal,
} from "lucide-react";
import {
  ALG_DESCRIPTIONS,
  decodeJwt,
  SAMPLE_JWT,
  securityAudit,
  type DecodedJwt,
} from "@/lib/jwt-utils";
import { curlWithToken } from "@/lib/jwt-templates";
import { downloadBlob } from "@/lib/download";
import { DecodedCard } from "./components/DecodedCard";
import { TokenHealthPanel } from "./components/TokenHealthPanel";
import { EncoderTab } from "./components/EncoderTab";
import { VerifyPanel } from "./components/VerifyPanel";
import { ClaimValidators } from "./components/ClaimValidators";
import { AuditPanel } from "./components/AuditPanel";
import { CopyButton } from "@/components/shared/CopyButton";
import { useToast } from "@/components/shared/Toast";
import { HistoryPanel, useHistory } from "@/components/shared/HistoryPanel";
import { useRegisterCommands } from "@/components/shared/CommandPalette";
import { cn } from "@/lib/cn";

type TabId = "decode" | "encode";

export function JwtDecoderClient() {
  const [tab, setTab] = useState<TabId>("decode");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<DecodedJwt | null>(null);
  const [urlWarning, setUrlWarning] = useState(false);
  const [howVerifyOpen, setHowVerifyOpen] = useState(false);
  const [curlOpen, setCurlOpen] = useState(false);
  const [curlEndpoint, setCurlEndpoint] = useState("https://api.example.com/me");
  const { push } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const history = useHistory("jwt-decoder", 15);

  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("t");
    if (t) {
      setToken(t);
      setUrlWarning(true);
    }
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!token.trim()) {
      setDecoded(null);
      setError(null);
      return;
    }
    const r = decodeJwt(token);
    if (r.ok) {
      setDecoded(r.value);
      setError(null);
      // Record to history (debounced via effect cleanup timing)
      const id = window.setTimeout(() => history.push(token, redact(token)), 600);
      return () => window.clearTimeout(id);
    } else {
      setDecoded(null);
      setError(r.error);
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // The token is a bearer credential, so it is never auto-written to the URL.
  // It only enters the URL via the explicit "Copy share link" action below.

  const loadSample = useCallback(() => {
    setToken(SAMPLE_JWT);
  }, []);

  const shareLink = useCallback(async () => {
    const url = new URL(window.location.href);
    if (token.trim()) url.searchParams.set("t", token.trim());
    try {
      await navigator.clipboard.writeText(url.toString());
      setUrlWarning(true); // remind the user the copied link carries the token
      push("Share link copied — it contains the token", "success");
    } catch {
      push("Could not copy link", "error");
    }
  }, [token, push]);

  const downloadJson = useCallback(() => {
    if (!decoded) return;
    const json = JSON.stringify(
      { header: decoded.header, payload: decoded.payload, signature: decoded.signature },
      null,
      2
    );
    downloadBlob(json, "decoded-jwt.json", "application/json");
    push("Downloaded decoded-jwt.json", "success");
  }, [decoded, push]);

  const alg = decoded?.header.alg;
  const algDesc = typeof alg === "string" ? ALG_DESCRIPTIONS[alg] ?? "Unknown algorithm" : undefined;
  const findings = decoded ? securityAudit(decoded, false) : [];
  const parts = token.split(".");
  const partsValid = parts.length === 3;

  useRegisterCommands(
    "jwt-decoder",
    [
      { id: "jwt:sample", section: "JWT Decoder", title: "Load example token", run: loadSample },
      { id: "jwt:share", section: "JWT Decoder", title: "Copy share link", run: shareLink },
      { id: "jwt:download", section: "JWT Decoder", title: "Download decoded JSON", run: downloadJson },
      { id: "jwt:clear", section: "JWT Decoder", title: "Clear token", run: () => setToken("") },
      {
        id: "jwt:tab-encode",
        section: "JWT Decoder",
        title: "Switch to Encode tab",
        run: () => setTab("encode"),
      },
      {
        id: "jwt:tab-decode",
        section: "JWT Decoder",
        title: "Switch to Decode tab",
        run: () => setTab("decode"),
      },
    ],
    [loadSample, shareLink, downloadJson]
  );

  return (
    <>
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-5">
        <div className="inline-flex p-1 rounded-lg border border-[var(--hairline)] bg-[var(--bg-card)]">
          <TabButton active={tab === "decode"} onClick={() => setTab("decode")}>
            <Lock className="w-3.5 h-3.5" />
            Decode
          </TabButton>
          <TabButton active={tab === "encode"} onClick={() => setTab("encode")}>
            <KeyRound className="w-3.5 h-3.5" />
            Encode
          </TabButton>
        </div>
      </section>

      {tab === "decode" && (
        <>
          <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-5">
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
                <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)] flex items-center gap-2">
                  <Signature className="w-3 h-3" />
                  Encoded token
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button className="btn" onClick={loadSample}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load example</span>
                  </button>
                  <button className="btn" onClick={shareLink} disabled={!decoded}>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share link</span>
                  </button>
                  <button className="btn" onClick={downloadJson} disabled={!decoded}>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    className="btn"
                    onClick={() => setCurlOpen((v) => !v)}
                    disabled={!decoded}
                    title="Generate a cURL snippet that uses this token"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>cURL</span>
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => setToken("")}
                    disabled={!token}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre
                  aria-hidden
                  className="px-4 py-4 font-mono text-[13px] leading-[1.75] whitespace-pre-wrap break-all pointer-events-none min-h-[140px]"
                >
                  {partsValid ? (
                    <>
                      <span className="jwt-part-h">{parts[0]}</span>
                      <span className="jwt-dot">.</span>
                      <span className="jwt-part-p">{parts[1]}</span>
                      <span className="jwt-dot">.</span>
                      <span className="jwt-part-s">{parts[2]}</span>
                    </>
                  ) : (
                    <span className="text-[var(--fg-muted)]">{token || " "}</span>
                  )}
                  <span className="opacity-0">.</span>
                </pre>
                <textarea
                  ref={inputRef}
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\s/g, ""))}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  placeholder="Paste a JWT here (eyJhbGci...)"
                  className="absolute inset-0 w-full h-full px-4 py-4 bg-transparent text-transparent caret-[var(--cyan)] font-mono text-[13px] leading-[1.75] resize-none outline-none break-all"
                  style={{
                    minHeight: 140,
                    WebkitTextFillColor: "transparent",
                  }}
                />
              </div>
              {partsValid && (
                <div className="border-t border-[var(--hairline)] bg-[var(--bg-soft)] px-4 py-2 flex items-center flex-wrap gap-2">
                  <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                    Copy part:
                  </span>
                  <CopyButton value={parts[0]} label="Header b64" className="!py-1 !text-[11px]" />
                  <CopyButton value={parts[1]} label="Payload b64" className="!py-1 !text-[11px]" />
                  <CopyButton value={parts[2]} label="Signature b64" className="!py-1 !text-[11px]" />
                </div>
              )}
            </div>

            {curlOpen && decoded && (
              <div className="mt-3 card overflow-hidden animate-slide-down">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
                  <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
                    cURL snippet
                  </span>
                  <CopyButton value={curlWithToken(token, curlEndpoint)} className="py-1" />
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="font-mono text-[11px] text-[var(--fg-dim)] shrink-0">Endpoint</label>
                    <input
                      value={curlEndpoint}
                      onChange={(e) => setCurlEndpoint(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] text-[var(--fg)] font-mono text-[12.5px]"
                    />
                  </div>
                  <pre className="p-3 rounded-md border border-[var(--hairline)] bg-[var(--bg-soft)] font-mono text-[12px] leading-[1.55] whitespace-pre-wrap break-all">
                    {curlWithToken(token, curlEndpoint)}
                  </pre>
                </div>
              </div>
            )}

            {urlWarning && (
              <div className="mt-3 animate-slide-down flex items-start gap-2 px-3 py-2 rounded-md border border-[var(--hairline-strong)] bg-[rgba(255,181,71,0.06)]">
                <Info className="w-4 h-4 text-[var(--amber)] mt-0.5 shrink-0" />
                <p className="text-[12.5px] text-[var(--fg-muted)] flex-1">
                  Token loaded from URL. Don&apos;t share sensitive tokens via URL — they can be
                  logged by browsers, proxies, and analytics.
                </p>
                <button
                  className="btn btn-ghost text-[11px] px-2 py-1"
                  onClick={() => setUrlWarning(false)}
                >
                  Dismiss
                </button>
              </div>
            )}
          </section>

          {error && (
            <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-5">
              <div className="rounded-lg border border-[rgba(255,77,109,0.3)] bg-[rgba(255,77,109,0.06)] px-4 py-3 flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-[var(--rose)] mt-0.5" />
                <div>
                  <span className="font-mono text-[11px] tracking-[0.22em] uppercase text-[var(--rose)]">
                    Decoding failed
                  </span>
                  <p className="mt-1 text-[14px] text-[var(--fg)]">{error}</p>
                </div>
              </div>
            </section>
          )}

          {decoded && (
            <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-5">
              <TokenHealthPanel decoded={decoded} />
            </section>
          )}

          {decoded && (
            <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <VerifyPanel token={token} alg={typeof alg === "string" ? alg : undefined} />
              <AuditPanel findings={findings} />
            </section>
          )}

          {decoded && (
            <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-5">
              <ClaimValidators decoded={decoded} />
            </section>
          )}

          {decoded && (
            <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-8 reveal grid grid-cols-1 md:grid-cols-3 gap-4">
              <DecodedCard
                title="Header"
                data={decoded.header}
                accent="#9E7BFF"
                algDescription={algDesc}
              />
              <DecodedCard
                title="Payload"
                data={decoded.payload}
                accent="#5AB5FF"
                isPayload
              />
              <SignatureCard
                signature={decoded.signature}
                open={howVerifyOpen}
                onToggle={() => setHowVerifyOpen((v) => !v)}
                alg={typeof alg === "string" ? alg : "?"}
              />
            </section>
          )}

          <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-8">
            <HistoryPanel
              storageKey="jwt-decoder"
              title="Recent tokens"
              onSelect={(v) => setToken(v)}
              formatLabel={(item) => item.label ?? redact(item.value)}
            />
          </section>

          {!decoded && !error && !token && (
            <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-8">
              <div className="card p-10 text-center border-dashed">
                <Signature className="w-8 h-8 mx-auto text-[var(--fg-dim)] mb-3" />
                <h3 className="font-display text-lg text-[var(--fg)]">Paste a JWT to decode it</h3>
                <p className="mt-1 text-[13px] text-[var(--fg-muted)]">
                  The token is decoded entirely in your browser. Nothing is sent to any server.
                </p>
                <button className="btn btn-primary mt-4" onClick={loadSample}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load example token</span>
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {tab === "encode" && (
        <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10">
          <EncoderTab />
        </section>
      )}
    </>
  );
}

function redact(token: string): string {
  const parts = token.split(".");
  if (parts.length !== 3) return token.slice(0, 28) + "…";
  const head = parts[0].slice(0, 8);
  const pay = parts[1].slice(0, 8);
  return `${head}…·${pay}…·***`;
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-mono transition-all",
        active
          ? "bg-[var(--bg-raise)] text-[var(--fg)] shadow-[inset_0_0_0_1px_var(--hairline-strong)]"
          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
      )}
    >
      {children}
    </button>
  );
}

function SignatureCard({
  signature,
  open,
  onToggle,
  alg,
}: {
  signature: string;
  open: boolean;
  onToggle: () => void;
  alg: string;
}) {
  return (
    <div
      className="card overflow-hidden animate-fade-in"
      style={{ boxShadow: "0 0 60px -30px rgba(134,243,107,0.35)" }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--lime)", boxShadow: "0 0 8px var(--lime)" }}
          />
          <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--lime)]">
            Signature
          </span>
        </div>
        <CopyButton value={signature} className="py-1" />
      </div>
      <pre className="px-4 py-3 font-mono text-[12px] leading-[1.6] break-all whitespace-pre-wrap text-[var(--lime)]">
        {signature}
      </pre>
      <div className="border-t border-[var(--hairline)] bg-[var(--bg-soft)] px-4 py-3">
        <div className="flex items-start gap-2 text-[12.5px] text-[var(--fg-muted)]">
          <Info className="w-3.5 h-3.5 mt-0.5 text-[var(--amber)] shrink-0" />
          <p>
            Use the <span className="text-[var(--fg)]">Verify signature</span> panel above with
            the correct secret, public key, or JWKS URL to confirm this signature.
          </p>
        </div>
        <button
          onClick={onToggle}
          className="mt-2 flex items-center gap-1 font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--fg-dim)] hover:text-[var(--fg)]"
        >
          <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
          How verification works
        </button>
        {open && (
          <div className="mt-3 text-[12.5px] text-[var(--fg-muted)] leading-relaxed space-y-2 animate-fade-in">
            <p>Verification proves the token was signed by a party who knows the secret (or private key):</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Split the token into <span className="font-mono text-[var(--fg)]">header.payload.signature</span>.</li>
              <li>
                Compute {alg}
                (<span className="font-mono">{`base64url(header) + "." + base64url(payload)`}</span>)
                using the secret or private key.
              </li>
              <li>Compare the computed signature with the token&apos;s signature (constant-time).</li>
              <li>Also check <span className="font-mono">exp</span>, <span className="font-mono">nbf</span>, and <span className="font-mono">aud</span> claims.</li>
            </ol>
            <p>
              This tool performs verification in the browser via the SubtleCrypto API — the secret or key never
              leaves your machine.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
