"use client";

import React, { useState, useEffect } from "react";
import { parseInteger, formatInteger, toTwosComplement, fromTwosComplement } from "@/lib/number-base";

export default function NumberBaseConverter() {
  const [inputValue, setInputValue] = useState("255");
  const [inputBase, setInputBase] = useState(10);
  const [bitWidth, setBitWidth] = useState(8);
  const [error, setError] = useState("");

  const [outputs, setOutputs] = useState({
    binary: "",
    octal: "",
    decimal: "",
    hex: "",
    twosComplement: "",
  });

  useEffect(() => {
    try {
      setError("");
      if (!inputValue.trim()) {
        setOutputs({ binary: "", octal: "", decimal: "", hex: "", twosComplement: "" });
        return;
      }

      // Parse the current input into a BigInt value safely
      const parsedValue = parseInteger(inputValue, inputBase);

      // Format the number into all standard target bases
      const binStr = formatInteger(parsedValue, 2, { groupSize: 4 });
      const octStr = formatInteger(parsedValue, 8);
      const decStr = formatInteger(parsedValue, 10);
      const hexStr = formatInteger(parsedValue, 16, { uppercase: true });

      // Calculate signed two's complement string representation if applicable
      let twosStr = "N/A (Value must be within signed bit range)";
      try {
        twosStr = toTwosComplement(parsedValue, bitWidth).replace(/(.{4})/g, "\$1 ").trim();
      } catch (e) {
        // Suppress bounds errors for two's complement display gracefully
      }

      setOutputs({
        binary: binStr,
        octal: octStr,
        decimal: decStr,
        hex: hexStr,
        twosComplement: twosStr,
      });
    } catch (err: any) {
      setError(err.message || "Invalid input vector mapping");
    }
  }, [inputValue, inputBase, bitWidth]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 text-slate-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
        <h2 className="text-xl font-bold text-cyan-400">Number Base Configuration Input</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-slate-400">Numeric Input Value</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 font-mono text-white"
              placeholder="e.g. 255, 0xff, 11111111"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-slate-400">Source Number Base</label>
            <select
              value={inputBase}
              onChange={(e) => setInputBase(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 text-white"
            >
              <option value={0}>Auto-Detect (0x, 0b, 0o)</option>
              <option value={2}>Binary (Base 2)</option>
              <option value={8}>Octal (Base 8)</option>
              <option value={10}>Decimal (Base 10)</option>
              <option value={16}>Hexadecimal (Base 16)</option>
            </select>
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-slate-400">Signed Bit Width</label>
            <select
              value={bitWidth}
              onChange={(e) => setBitWidth(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 text-white"
            >
              <option value={8}>8-bit (Signed Byte)</option>
              <option value={16}>16-bit (Signed Short)</option>
              <option value={32}>32-bit (Signed Int)</option>
              <option value={64}>64-bit (Signed Long)</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-800 text-red-400 p-3 rounded-lg text-sm font-mono">
            ⚠️ Error: {error}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
        <h2 className="text-xl font-bold text-slate-200">Converted Output Vector Targets</h2>
        
        <div className="space-y-4 font-mono">
          {[
            { label: "Decimal (Base 10)", val: outputs.decimal },
            { label: "Hexadecimal (Base 16)", val: outputs.hex },
            { label: "Binary (Base 2)", val: outputs.binary },
            { label: "Octal (Base 8)", val: outputs.octal },
            { label: "Signed Two's Complement", val: outputs.twosComplement, highlight: true }
          ].map((out, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg gap-2">
              <span className="text-sm font-semibold text-slate-400 sm:w-1/3">{out.label}</span>
              <span className={`text-md select-all overflow-x-auto whitespace-nowrap sm:w-2/3 text-right font-bold ${out.highlight ? 'text-cyan-400' : 'text-emerald-400'}`}>
                {out.val || "0"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
