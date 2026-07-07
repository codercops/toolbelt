export function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="card p-5">
      <h3 className="font-display text-[15px] font-semibold text-[var(--fg)] mb-2">{q}</h3>
      <p className="text-[13.5px] text-[var(--fg-muted)] leading-relaxed">{a}</p>
    </div>
  );
}
