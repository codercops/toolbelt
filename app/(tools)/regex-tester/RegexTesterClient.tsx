"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyButton } from "@/components/shared/CopyButton";
import { compileRegex, findMatches, replacePreview } from "@/lib/regex-utils";

const FLAGS = [
  { flag: "g", title: "Global: find every match" },
  { flag: "i", title: "Ignore case" },
  { flag: "m", title: "Multiline: ^ and $ match at line breaks" },
  { flag: "s", title: "Dot all: . also matches line breaks" },
  { flag: "u", title: "Unicode" },
  { flag: "y", title: "Sticky: match only at lastIndex" },
];

const MAX_TEXT_LENGTH = 100_000;
const DEBOUNCE_MS = 150;

const labelClass = "mb-1 block text-sm font-medium text-[var(--fg)]";
const inputClass =
  "w-full rounded-xl border border-[var(--hairline)] bg-[var(--bg)] px-3 py-2.5 font-mono text-base text-[var(--fg)]";
const headingClass = "font-mono text-[10.5px] tracking-[0.22em] uppercase text-[var(--fg-dim)]";

export function RegexTesterClient() {
  const [pattern, setPattern] = useState("(?<year>\\d{4})-(\\d{2})-(\\d{2})");
  const [flags, setFlags] = useState("g");
  const [text, setText] = useState("Released on 2026-10-01, patched on 2026-10-14.");
  const [replacement, setReplacement] = useState("$3/$2/$<year>");
  const [input, setInput] = useState({ pattern, flags, text, replacement });

  useEffect(() => {
    const timer = window.setTimeout(() => setInput({ pattern, flags, text, replacement }), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [pattern, flags, text, replacement]);

  const tooLong = input.text.length > MAX_TEXT_LENGTH;
  const compiled = useMemo(() => compileRegex(input.pattern, input.flags), [input.pattern, input.flags]);
  const regex = compiled.ok && input.pattern !== "" && !tooLong ? compiled.regex : null;
  const found = useMemo(() => (regex ? findMatches(regex, input.text) : null), [regex, input.text]);
  const replaced = useMemo(
    () => (regex ? replacePreview(regex, input.text, input.replacement) : ""),
    [regex, input.text, input.replacement]
  );

  const segments: { text: string; match: boolean }[] = [];
  if (found) {
    let last = 0;
    for (const match of found.matches) {
      if (match.end === match.index) continue;
      segments.push({ text: input.text.slice(last, match.index), match: false });
      segments.push({ text: match.text, match: true });
      last = match.end;
    }
    segments.push({ text: input.text.slice(last), match: false });
  }

  function toggleFlag(flag: string) {
    setFlags((current) =>
      FLAGS.map((f) => f.flag).filter((f) => (f === flag ? !current.includes(f) : current.includes(f))).join("")
    );
  }

  return (
    <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10 space-y-4">
      <div className="card p-4 sm:p-5 space-y-4">
        <div>
          <label htmlFor="regex-pattern" className={labelClass}>Pattern</label>
          <div className="flex items-center gap-2 font-mono text-[var(--fg-muted)]">
            <span aria-hidden="true">/</span>
            <input
              id="regex-pattern"
              type="text"
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              placeholder="\d+"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={!compiled.ok}
              className={inputClass}
            />
            <span aria-hidden="true">/{flags}</span>
          </div>
        </div>

        <div role="group" aria-label="Flags" className="segmented">
          {FLAGS.map(({ flag, title }) => (
            <button
              key={flag}
              type="button"
              title={title}
              aria-label={title}
              aria-pressed={flags.includes(flag)}
              data-active={flags.includes(flag)}
              onClick={() => toggleFlag(flag)}
            >
              {flag}
            </button>
          ))}
        </div>

        {!compiled.ok && (
          <p role="alert" className="rounded-xl border border-[var(--rose)]/30 bg-[var(--rose)]/5 p-3 text-sm text-[var(--rose)]">
            {compiled.error}
          </p>
        )}

        <div>
          <label htmlFor="regex-text" className={labelClass}>Test text</label>
          <textarea
            id="regex-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full resize-y rounded-xl border border-[var(--hairline)] bg-[var(--bg)] p-3 font-mono text-[13px] leading-relaxed text-[var(--fg)]"
          />
          {tooLong && (
            <p role="alert" className="mt-1.5 text-sm text-[var(--rose)]">
              The test text is limited to {MAX_TEXT_LENGTH.toLocaleString("en-US")} characters.
            </p>
          )}
        </div>
      </div>

      {found && (
        <>
          <div className="card overflow-hidden">
            <div className="border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2">
              <h2 className={headingClass}>
                {found.matches.length} {found.matches.length === 1 ? "match" : "matches"}
                {found.truncated && ", showing the first 1,000"}
              </h2>
            </div>
            <pre className="p-4 sm:p-5 whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-[var(--fg)]">
              {segments.map((segment, i) =>
                segment.match ? (
                  <mark key={i} style={{ color: "inherit", backgroundColor: "color-mix(in srgb, var(--cyan) 25%, transparent)" }}>{segment.text}</mark>
                ) : (
                  segment.text
                )
              )}
            </pre>
          </div>

          {found.matches.length > 0 && (
            <div className="card overflow-hidden">
              <div className="border-b border-[var(--hairline)] bg-[var(--bg-raise)] px-3 py-2">
                <h2 className={headingClass}>Match details</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">Each match with its position and capture groups</caption>
                  <thead>
                    <tr className="text-[var(--fg-muted)]">
                      <th scope="col" className="px-3 py-2 font-medium">#</th>
                      <th scope="col" className="px-3 py-2 font-medium">Match</th>
                      <th scope="col" className="px-3 py-2 font-medium">Index</th>
                      <th scope="col" className="px-3 py-2 font-medium">Groups</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)]">
                    {found.matches.map((match, i) => (
                      <tr key={match.index + ":" + i}>
                        <th scope="row" className="px-3 py-2.5 font-medium text-[var(--fg)]">{i + 1}</th>
                        <td className="px-3 py-2.5">{match.text === "" ? (
                            <span className="text-[var(--fg-dim)]">empty</span>
                          ) : (
                            <code className="font-mono text-[var(--fg)]">{match.text}</code>
                          )}</td>
                        <td className="px-3 py-2.5 font-mono text-[var(--fg-muted)]">{match.index}-{match.end}</td>
                        <td className="px-3 py-2.5 font-mono text-[var(--fg-muted)]">
                          {match.groups.map((group, g) => (
                            <div key={g}>${g + 1}: {group ?? "undefined"}</div>
                          ))}
                          {Object.entries(match.named).map(([name, group]) => (
                            <div key={name}>{name}: {group ?? "undefined"}</div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card p-4 sm:p-5 space-y-3">
            <div>
              <label htmlFor="regex-replacement" className={labelClass}>Replace with</label>
              <input
                id="regex-replacement"
                type="text"
                value={replacement}
                onChange={(event) => setReplacement(event.target.value)}
                placeholder="$1 or $<name>"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                className={inputClass}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <h2 className={headingClass}>Result</h2>
              <CopyButton value={replaced} label="Copy" successMessage="Result copied" className="py-1" />
            </div>
            <pre className="whitespace-pre-wrap break-words rounded-xl border border-[var(--hairline)] bg-[var(--bg)] p-3 font-mono text-[13px] leading-relaxed text-[var(--fg)]">
              {replaced}
            </pre>
          </div>
        </>
      )}
    </section>
  );
}
