export function PremiumBadge() {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded-[10px] text-[9px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.2)]">
      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>hotel_class</span>
      Premium
    </span>
  );
}
