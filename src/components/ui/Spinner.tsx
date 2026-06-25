
export default function Spinner({ className, colorClass = 'border-slate-950' }: { className?: string, colorClass?: string }) {
  return (
    <span className={`text-white/40 text-[10px] font-black uppercase tracking-widest animate-pulse ${className}`}>Učitavanje...</span>
  );
}
