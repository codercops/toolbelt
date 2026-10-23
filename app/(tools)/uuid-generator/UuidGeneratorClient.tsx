"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/shared/CopyButton";
import { inspectUuid, uuidV4, uuidV7, formatUuid, type UuidInspection } from "@/lib/uuid";

type UuidVersion = "v4" | "v7";

const labelClass = "mb-1 block text-sm font-medium text-[var(--fg)]";
const inputClass =
  "w-full rounded-xl border border-[var(--hairline)] bg-[var(--bg)] px-3 py-2.5 font-mono text-sm text-[var(--fg)]";
const VARIANT_LABELS = {
  ncs: "NCS (reserved)",
  rfc: "RFC 9562",
  microsoft: "Microsoft (reserved)",
  future: "Future (reserved)",
} as const;

function InspectionResult({ result }: { result: UuidInspection }) {
  if (!result.ok) {
    return (
      <p role="alert" className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose)]/5 p-3 text-sm text-[var(--rose)]">
        Enter a valid UUID in hyphenated or compact format.
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="rounded-xl border border-[var(--hairline)] bg-[var(--bg-soft)] p-3">
        <dt className="text-xs text-[var(--fg-muted)]">Version</dt>
        <dd className="mt-1 font-mono text-sm text-[var(--fg)]">
          {result.special === "nil"
            ? "Nil UUID (version 0)"
            : result.special === "max"
              ? "Max UUID (version 15)"
              : `Version ${result.version}`}
        </dd>
      </div>
      <div className="rounded-xl border border-[var(--hairline)] bg-[var(--bg-soft)] p-3">
        <dt className="text-xs text-[var(--fg-muted)]">Variant</dt>
        <dd className="mt-1 font-mono text-sm text-[var(--fg)]">{VARIANT_LABELS[result.variant]}</dd>
      </div>
      {result.timestampMs !== undefined && (
        <div className="rounded-xl border border-[var(--hairline)] bg-[var(--bg-soft)] p-3 sm:col-span-2">
          <dt className="text-xs text-[var(--fg-muted)]">UUID v7 timestamp</dt>
          <dd className="mt-1 font-mono text-sm text-[var(--fg)]">
            {result.timestampMs} ms
            <span className="ml-2 text-[var(--fg-muted)]">
              ({new Date(result.timestampMs).toISOString()})
            </span>
          </dd>
        </div>
      )}
      {result.special && (
        <p className="sm:col-span-2 text-sm text-[var(--fg-muted)]">
          {result.special === "nil"
            ? "This is the nil UUID: every bit is zero."
            : "This is the max UUID: every bit is one."}
        </p>
      )}
    </dl>
  );
}

export function UuidGeneratorClient() {
  const [version, setVersion] = useState<UuidVersion>("v4");
  const [count, setCount] = useState("1");
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [generated, setGenerated] = useState<Uint8Array[]>([]);
  const [generationError, setGenerationError] = useState("");
  const [input, setInput] = useState("");

  const output = useMemo(
    () => generated.map((bytes) => formatUuid(bytes, { uppercase, hyphens })),
    [generated, uppercase, hyphens],
  );
  const inspection = useMemo(() => {
    if (!input.trim()) return null;
    return inspectUuid(input);
  }, [input]);

  function generate() {
    const amount = Number(count);
    if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
      setGenerationError("Choose a quantity from 1 to 100.");
      setGenerated([]);
      return;
    }

    try {
      const uuids = Array.from({ length: amount }, () => {
        const random = crypto.getRandomValues(new Uint8Array(16));
        return version === "v4" ? uuidV4(random) : uuidV7(Date.now(), random);
      });
      setGenerated(uuids);
      setGenerationError("");
    } catch (error) {
      setGenerated([]);
      setGenerationError(
        error instanceof Error ? error.message : "Secure UUID generation failed.",
      );
    }
  }

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-4">
      <div className="card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="segmented" role="group" aria-label="UUID version">
            {(["v4", "v7"] as const).map((choice) => (
              <button
                key={choice}
                type="button"
                aria-pressed={version === choice}
                data-active={version === choice}
                onClick={() => setVersion(choice)}
              >
                UUID {choice}
              </button>
            ))}
          </div>

          <div className="w-28">
            <label htmlFor="uuid-count" className={labelClass}>Quantity</label>
            <input
              id="uuid-count"
              type="number"
              min="1"
              max="100"
              step="1"
              value={count}
              onChange={(event) => setCount(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-[12.5px] font-mono text-[var(--fg-muted)]">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(event) => setUppercase(event.target.checked)}
              className="accent-[var(--amber)]"
            />
            Uppercase
          </label>
          <label className="flex items-center gap-2 text-[12.5px] font-mono text-[var(--fg-muted)]">
            <input
              type="checkbox"
              checked={!hyphens}
              onChange={(event) => setHyphens(!event.target.checked)}
              className="accent-[var(--amber)]"
            />
            No hyphens
          </label>
          <button type="button" className="btn btn-primary" onClick={generate}>
            Generate UUIDs
          </button>
        </div>

        {generationError && (
          <p role="alert" className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose)]/5 p-3 text-sm text-[var(--rose)]">
            {generationError}
          </p>
        )}
      </div>

      {output.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2">
            <h2 className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">
              Generated UUIDs ({output.length})
            </h2>
            <CopyButton
              value={output.join("\n")}
              label="Copy all"
              successMessage="UUIDs copied"
              className="py-1"
            />
          </div>
          <ol aria-label="Generated UUIDs" className="divide-y divide-[var(--hairline)]">
            {output.map((uuid, index) => (
              <li key={index} className="flex items-center justify-between gap-3 p-3">
                <code className="min-w-0 break-all font-mono text-sm text-[var(--fg)]">{uuid}</code>
                <CopyButton
                  value={uuid}
                  label={`Copy UUID ${index + 1}`}
                  iconOnly
                  className="shrink-0"
                />
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="card p-4 sm:p-5 space-y-4">
        <div>
          <label htmlFor="uuid-inspector" className={labelClass}>Inspect a UUID</label>
          <input
            id="uuid-inspector"
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={inspection?.ok === false}
            className={inputClass}
          />
        </div>
        {inspection && <InspectionResult result={inspection} />}
      </div>
    </section>
  );
}
