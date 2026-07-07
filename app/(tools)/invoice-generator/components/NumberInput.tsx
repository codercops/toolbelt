"use client";

import { useEffect, useState } from "react";

interface NumberInputProps {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
}

/**
 * A numeric input that keeps a local text buffer so partial entries like "-",
 * "1." or an empty field survive while typing. A plain controlled
 * type="number" coerces those to 0 on every keystroke, which makes negative
 * values (deductions) impossible to type.
 */
export function NumberInput({ value, onChange, className, ariaLabel, placeholder }: NumberInputProps) {
  const [text, setText] = useState(() => (Number.isFinite(value) ? String(value) : ""));

  // Resync the buffer when the value changes from the outside (e.g. Load example),
  // but not while the buffer already represents that same number.
  useEffect(() => {
    const parsed = parseFloat(text);
    if (!(Number.isFinite(parsed) && parsed === value)) {
      setText(Number.isFinite(value) ? String(value) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      value={text}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "" || raw === "-" || /^-?\d*\.?\d*$/.test(raw)) {
          setText(raw);
          const n = parseFloat(raw);
          onChange(Number.isFinite(n) ? n : 0);
        }
      }}
      onBlur={() => {
        const n = parseFloat(text);
        const finalN = Number.isFinite(n) ? n : 0;
        setText(String(finalN));
        onChange(finalN);
      }}
    />
  );
}
