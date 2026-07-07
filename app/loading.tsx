export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-24" aria-busy="true">
      <div className="flex items-center gap-3 text-[var(--fg-muted)]">
        <span className="w-2 h-2 rounded-full bg-[var(--cyan)] animate-pulse" />
        <span className="font-mono text-[12px] tracking-wider uppercase">Loading</span>
      </div>
    </div>
  );
}
