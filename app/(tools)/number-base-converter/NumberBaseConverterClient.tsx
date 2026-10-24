"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/shared/CopyButton";
import { useRegisterCommands } from "@/components/shared/CommandPalette";
import {
  formatInteger,
  MAX_BASE,
  MIN_BASE,
  parseInteger,
  toTwosComplement,
  TWOS_COMPLEMENT_WIDTHS,
} from "@/lib/number-base";

type InputBase = "auto" | "2" | "8" | "10" | "16" | "custom";
type Width = (typeof TWOS_COMPLEMENT_WIDTHS)[number];

const INPUT_BASES: { value: InputBase; label: string }[] = [
  { value: "auto", label: "Auto-detect (0b, 0o, 0x)" },
  { value: "2", label: "Binary (2)" },
  { value: "8", label: "Octal (8)" },
  { value: "10", label: "Decimal (10)" },
  { value: "16", label: "Hex (16)" },
  { value: "custom", label: "Custom base" },
];

const OUTPUTS = [
  { base: 2, label: "Binary", group: 4 },
  { base: 8, label: "Octal", group: 3 },
  { base: 10, label: "Decimal", group: 3 },
  { base: 16, label: "Hex", group: 4 },
];

const FIXED_BASES: Record<Exclude<InputBase, "auto" | "custom">, number> = { "2": 2, "8": 8, "10": 10, "16": 16 };

const BASE_CHOICES = Array.from({ length: MAX_BASE - MIN_BASE + 1 }, (_, i) => MIN_BASE + i);

const selectClass =
  "w-full rounded-xl border border-[var(--hairline)] bg-[var(--bg)] px-3 py-2.5 text-sm text-[var(--fg)]";
const labelClass = "mb-1 block text-sm font-medium text-[var(--fg)]";

function OutputCard({ label, value, placeholder }: { label: string; value: string; placeholder: string }) {
  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--bg-raise)]">
        <span className="font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]">{label}</span>
        <CopyButton
          value={value}
          ariaLabel={`Copy ${label}`}
          disabled={!value}
          successMessage={`${label} copied`}
          className="py-1"
        />
      </div>
      <pre
        className="flex-1 p-4 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap break-all overflow-auto text-[var(--fg)]"
        style={{ minHeight: 64 }}
      >
        {value || <span className="text-[var(--fg-muted)]">{placeholder}</span>}
      </pre>
    </div>
  );
}

export function NumberBaseConverterClient() {
  const [input, setInput] = useState("");
  const [inputBase, setInputBase] = useState<InputBase>("auto");
  const [customInputBase, setCustomInputBase] = useState(36);
  const [customOutputBase, setCustomOutputBase] = useState(36);
  const [bits, setBits] = useState<Width>(32);
  const [group, setGroup] = useState(false);
  const [uppercase, setUppercase] = useState(false);

  const base =
    inputBase === "auto" ? undefined : inputBase === "custom" ? customInputBase : FIXED_BASES[inputBase];

  // Pure conversion, derived from the inputs.
  const parsed = useMemo((): { value: bigint } | { error: string } | null => {
    if (!input.trim()) return null;
    try {
      return { value: parseInteger(input, base) };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Couldn't read that number" };
    }
  }, [input, base]);

  const value = parsed && "value" in parsed ? parsed.value : undefined;
  const format = (b: number, groupSize: number) =>
    value === undefined ? "" : formatInteger(value, b, { uppercase, groupSize: group ? groupSize : undefined });

  const twos = useMemo((): { binary: string; hex: string } | { error: string } | null => {
    if (value === undefined) return null;
    try {
      const binary = toTwosComplement(value, bits);
      const hex = formatInteger(parseInteger(binary, 2), 16, { uppercase }).padStart(bits / 4, "0");
      return { binary, hex };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Doesn't fit in that width" };
    }
  }, [value, bits, uppercase]);

  const groupBits = (digits: string, size: number) => (group ? digits.replace(new RegExp(`(.{${size}})(?=.)`, "g"), "$1_") : digits);

  useRegisterCommands(
    "number-base-converter",
    [
      { id: "nb:clear", section: "Number Base", title: "Clear the number", run: () => setInput("") },
      { id: "nb:auto", section: "Number Base", title: "Input base: auto-detect", run: () => setInputBase("auto") },
      { id: "nb:group", section: "Number Base", title: "Toggle digit grouping", run: () => setGroup((g) => !g) },
      ...TWOS_COMPLEMENT_WIDTHS.map((w) => ({
        id: `nb:bits-${w}`,
        section: "Number Base",
        title: `Two's complement width: ${w}-bit`,
        run: () => setBits(w),
      })),
    ],
    []
  );

  const error = parsed && "error" in parsed ? parsed.error : "";

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-4">
      <div className="card p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          <div>
            <label htmlFor="nb-input" className={labelClass}>
              Number
            </label>
            <input
              id="nb-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="0xff, -0b1010, 1_000_000"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "nb-error" : undefined}
              className="w-full rounded-xl border border-[var(--hairline)] bg-[var(--bg)] px-3 py-2.5 font-mono text-sm text-[var(--fg)]"
            />
          </div>
          <div>
            <label htmlFor="nb-input-base" className={labelClass}>
              Input base
            </label>
            <select
              id="nb-input-base"
              value={inputBase}
              onChange={(e) => setInputBase(e.target.value as InputBase)}
              className={selectClass}
            >
              {INPUT_BASES.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {inputBase === "custom" && (
          <div className="max-w-[220px]">
            <label htmlFor="nb-custom-input-base" className={labelClass}>
              Custom input base
            </label>
            <select
              id="nb-custom-input-base"
              value={customInputBase}
              onChange={(e) => setCustomInputBase(BASE_CHOICES[e.target.selectedIndex])}
              className={selectClass}
            >
              {BASE_CHOICES.map((b) => (
                <option key={b} value={b}>
                  Base {b}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p
            id="nb-error"
            role="alert"
            className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose)]/5 p-3 text-sm text-[var(--rose)]"
          >
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 text-[12.5px] font-mono text-[var(--fg-muted)]">
            <input
              type="checkbox"
              checked={group}
              onChange={(e) => setGroup(e.target.checked)}
              className="accent-[var(--violet)]"
            />
            Group digits with _
          </label>
          <label className="flex items-center gap-2 text-[12.5px] font-mono text-[var(--fg-muted)]">
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="accent-[var(--violet)]"
            />
            Uppercase letters
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {OUTPUTS.map((o) => (
          <OutputCard
            key={o.base}
            label={`${o.label} (base ${o.base})`}
            value={format(o.base, o.group)}
            placeholder="Enter a number above"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="max-w-[220px]">
            <label htmlFor="nb-custom-output-base" className={labelClass}>
              Custom output base
            </label>
            <select
              id="nb-custom-output-base"
              value={customOutputBase}
              onChange={(e) => setCustomOutputBase(BASE_CHOICES[e.target.selectedIndex])}
              className={selectClass}
            >
              {BASE_CHOICES.map((b) => (
                <option key={b} value={b}>
                  Base {b}
                </option>
              ))}
            </select>
          </div>
          <OutputCard
            label={`Base ${customOutputBase}`}
            value={format(customOutputBase, 4)}
            placeholder="Enter a number above"
          />
        </div>

        <div className="space-y-2">
          <div className="max-w-[220px]">
            <label htmlFor="nb-bits" className={labelClass}>
              Two&apos;s complement width
            </label>
            <select
              id="nb-bits"
              value={bits}
              onChange={(e) => setBits(TWOS_COMPLEMENT_WIDTHS[e.target.selectedIndex])}
              className={selectClass}
            >
              {TWOS_COMPLEMENT_WIDTHS.map((w) => (
                <option key={w} value={w}>
                  {w}-bit
                </option>
              ))}
            </select>
          </div>
          {twos && "error" in twos ? (
            <p role="alert" className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose)]/5 p-3 text-sm text-[var(--rose)]">
              {twos.error}
            </p>
          ) : (
            <>
              <OutputCard
                label={`Two's complement, ${bits}-bit binary`}
                value={twos ? groupBits(twos.binary, 4) : ""}
                placeholder="Enter a number above"
              />
              <OutputCard
                label={`Two's complement, ${bits}-bit hex`}
                value={twos ? groupBits(twos.hex, 4) : ""}
                placeholder="Enter a number above"
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
