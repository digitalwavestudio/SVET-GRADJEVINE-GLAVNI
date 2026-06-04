
export default function Spinner({ className, colorClass = 'border-slate-950' }: { className?: string, colorClass?: string }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-t-transparent ${colorClass} ${className}`} />
  );
}
