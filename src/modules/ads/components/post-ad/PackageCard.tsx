import type { ReactNode } from 'react';

interface PackageCardProps {
  title: string;
  subtitle: string;
  price: string;
  features: string[];
  tone: 'standard' | 'premium' | 'urgent';
  selected: boolean;
  recommended?: boolean;
  discounted?: boolean;
  selectLabel: string;
  selectedLabel?: string;
  header?: ReactNode;
  onSelect: () => void;
}

const CONTAINER_TONES: Record<PackageCardProps['tone'], { selected: string; unselected: string }> = {
  standard: {
    selected: 'border-blue-500/80 bg-gradient-to-b from-[#0c1835]/70 to-[#050814]/70 shadow-[0_0_40px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/30 scale-[1.02] -translate-y-2 z-10',
    unselected: 'border-white/5 bg-slate-900/30 hover:border-blue-500/30 hover:bg-slate-900/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:-translate-y-2',
  },
  premium: {
    selected: 'border-secondary bg-gradient-to-b from-[#1c140a]/80 to-[#070502]/80 shadow-[0_0_55px_rgba(254,191,13,0.3)] ring-1 ring-secondary/50 -translate-y-2',
    unselected: 'border-secondary/20 bg-slate-900/30 hover:border-secondary/50 hover:bg-[#1a150c]/30 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:-translate-y-2',
  },
  urgent: {
    selected: 'border-blue-500 bg-gradient-to-b from-[#0b1b3f]/80 to-[#040915]/80 shadow-[0_0_45px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/50 scale-[1.02] -translate-y-2 z-10',
    unselected: 'border-blue-500/10 bg-slate-900/30 hover:border-blue-500/40 hover:bg-slate-900/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:-translate-y-2',
  },
};

const TITLE_TONES: Record<PackageCardProps['tone'], string> = {
  standard: 'text-blue-400',
  premium: 'text-secondary',
  urgent: 'text-blue-400',
};

const SELECTED_TITLE_GLOWS: Record<PackageCardProps['tone'], string> = {
  standard: '',
  premium: 'drop-shadow-[0_0_15px_rgba(254,191,13,0.3)]',
  urgent: 'drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]',
};

const SELECTED_GLOWS: Record<PackageCardProps['tone'], string> = {
  standard: '',
  premium: 'bg-secondary/10',
  urgent: 'bg-blue-500/10',
};

const BUTTON_TONES: Record<PackageCardProps['tone'], { selected: string; unselected: string }> = {
  standard: {
    selected: 'bg-white text-black font-black hover:bg-slate-100',
    unselected: 'border border-white/10 text-white/70 hover:bg-white/5 hover:text-white',
  },
  premium: {
    selected: 'bg-gradient-to-r from-secondary via-yellow-400 to-secondary text-black font-black hover:brightness-110 shadow-[0_0_20px_rgba(254,191,13,0.3)]',
    unselected: 'border border-secondary/20 text-secondary/80 hover:bg-secondary/5',
  },
  urgent: {
    selected: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white font-black hover:brightness-110 shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    unselected: 'border border-white/10 text-white/70 hover:bg-white/5 hover:text-white',
  },
};

export default function PackageCard({
  title,
  subtitle,
  price,
  features,
  tone,
  selected,
  recommended = false,
  discounted = false,
  selectLabel,
  selectedLabel = 'Izabran',
  header,
  onSelect,
}: PackageCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`relative p-6 rounded-[24px] text-center border backdrop-blur-xl transition-all duration-500 flex flex-col justify-between cursor-pointer ${tone === 'premium' ? 'md:py-8 md:scale-[1.08] z-20' : ''} ${selected ? CONTAINER_TONES[tone].selected : CONTAINER_TONES[tone].unselected}`}
    >
      {selected && tone !== 'standard' && (
        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none transition-transform duration-700 blur-[40px] ${SELECTED_GLOWS[tone]}`}></div>
      )}

      {recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#FEBF0D] to-[#F8A010] text-black text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] px-6 py-1.5 rounded-full shadow-[0_0_25px_rgba(254,191,13,0.6)] whitespace-nowrap z-30 flex items-center gap-1.5 border border-white/30">
          <span className="material-symbols-outlined text-[14px] animate-bounce" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          PREPORUČENO
        </div>
      )}

      <div className="space-y-4 relative z-10">
        <div>
          <h4 className={`font-black uppercase tracking-widest text-lg md:text-xl mb-1 ${selected ? `${TITLE_TONES[tone]} font-black ${SELECTED_TITLE_GLOWS[tone]}` : tone === 'premium' ? 'text-secondary/90' : 'text-white'} flex justify-center items-center gap-2`}>
            {title}
            {header}
          </h4>
          <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider opacity-65">
            {subtitle}
          </p>
        </div>

        <div className="py-2 border-y border-white/5 flex flex-col items-center justify-center gap-1">
          <span className={`font-black text-3xl tracking-tight ${discounted ? "text-red-500" : "text-white"}`}>
            {price}
          </span>
          <span className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest">
            SG KREDITA (RSD)
          </span>
        </div>

        <ul className="space-y-3 py-2">
          {features.map((feature) => (
            <li key={feature} className="flex flex-row items-center gap-3 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80 text-left">
              <span className="material-symbols-outlined text-[16px] text-green-500 shrink-0">
                check_circle
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        className={`w-full py-3 rounded-xl text-xs uppercase tracking-widest font-black transition-all duration-300 mt-6 relative z-10 ${selected ? BUTTON_TONES[tone].selected : BUTTON_TONES[tone].unselected}`}
      >
        {selected ? selectedLabel : selectLabel}
      </button>
    </div>
  );
}
