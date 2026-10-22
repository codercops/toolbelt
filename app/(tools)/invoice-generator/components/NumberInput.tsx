"use client";

import { useEffect, useRef, useState } from "react";

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
  const lastValue = useRef(value);

  // Ignore echoes of our own updates so partial entries survive parent renders.
  // Outside changes (e.g. Load example) still replace the buffer.
  useEffect(() => {
    if (!Object.is(value, lastValue.current)) {
      lastValue.current = value;
      setText(Number.isFinite(value) ? String(value) : "");
    }
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
          const nextValue = Number.isFinite(n) ? n : 0;
          lastValue.current = nextValue;
          onChange(nextValue);
        }
      }}
      onBlur={() => {
        const n = parseFloat(text);
        const finalN = Number.isFinite(n) ? n : 0;
        setText(String(finalN));
        lastValue.current = finalN;
        onChange(finalN);
      }}
    />
  );
}
