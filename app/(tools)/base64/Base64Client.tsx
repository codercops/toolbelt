"use client";

import { useRef, useState } from "react";
import { FileText, Image as ImageIcon, File as FileIcon, Unlock, Binary } from "lucide-react";
import { TextTab } from "./components/TextTab";
import { ImageTab } from "./components/ImageTab";
import { FileTab } from "./components/FileTab";
import { DecodeTab } from "./components/DecodeTab";
import { EncodingsTab } from "./components/EncodingsTab";
import { ShortcutsLegend } from "@/components/shared/ShortcutsLegend";
import { useRegisterCommands } from "@/components/shared/CommandPalette";
import { cn } from "@/lib/cn";

type TabId = "text" | "image" | "file" | "decode" | "encodings";

const TABS: { id: TabId; label: string; icon: React.ReactNode; hint: string }[] = [
  { id: "text", label: "Text ↔ Base64", icon: <FileText className="w-3.5 h-3.5" />, hint: "String encoding" },
  { id: "image", label: "Image → Data URI", icon: <ImageIcon className="w-3.5 h-3.5" />, hint: "Embed images" },
  { id: "file", label: "File → Base64", icon: <FileIcon className="w-3.5 h-3.5" />, hint: "Any binary · batch" },
  { id: "decode", label: "Base64 → File", icon: <Unlock className="w-3.5 h-3.5" />, hint: "Reverse · magic-bytes · hex" },
  { id: "encodings", label: "Other encodings", icon: <Binary className="w-3.5 h-3.5" />, hint: "Hex · Base32 · Base58 · Ascii85 · Hashes" },
];

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? "⌘" : "Ctrl";

export function Base64Client() {
  const [tab, setTab] = useState<TabId>("text");
  const tablistRef = useRef<HTMLDivElement>(null);

  function onTabKeyDown(e: React.KeyboardEvent, index: number) {
    let next = index;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[next].id);
    const btns = tablistRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    btns?.[next]?.focus();
  }

  useRegisterCommands(
    "base64",
    [
      { id: "b64:text", section: "Base64", title: "Text ↔ Base64 tab", run: () => setTab("text") },
      { id: "b64:image", section: "Base64", title: "Image → Data URI tab", run: () => setTab("image") },
      { id: "b64:file", section: "Base64", title: "File → Base64 tab", run: () => setTab("file") },
      { id: "b64:decode", section: "Base64", title: "Base64 → File tab", run: () => setTab("decode") },
      { id: "b64:encodings", section: "Base64", title: "Other encodings tab (Hex, Base32, Base58, Ascii85, Hashes)", run: () => setTab("encodings") },
    ],
    []
  );

  return (
    <>
      <section className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div
            ref={tablistRef}
            className="flex overflow-x-auto border-b border-[var(--hairline)]"
            role="tablist"
            aria-label="Base64 tools"
          >
            {TABS.map((t, i) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`panel-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                className={cn(
                  "relative inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[12.5px] text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors border-b-2 -mb-px",
                  tab === t.id
                    ? "text-[var(--fg)] border-[var(--amber)]"
                    : "border-transparent"
                )}
              >
                {t.icon}
                <span>{t.label}</span>
                <span className="hidden md:inline text-[10px] text-[var(--fg-dim)] ml-1">
                  · {t.hint}
                </span>
              </button>
            ))}
          </div>
          <ShortcutsLegend
            shortcuts={[
              { keys: [MOD, "Enter"], label: "Encode/Decode" },
              { keys: [MOD, "⇧", "S"], label: "Swap direction" },
              { keys: [MOD, "⇧", "K"], label: "Clear" },
              { keys: [MOD, "K"], label: "Command palette" },
            ]}
          />
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-10"
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        tabIndex={0}
      >
        {tab === "text" && <TextTab />}
        {tab === "image" && <ImageTab />}
        {tab === "file" && <FileTab />}
        {tab === "decode" && <DecodeTab />}
        {tab === "encodings" && <EncodingsTab />}
      </section>
    </>
  );
}
