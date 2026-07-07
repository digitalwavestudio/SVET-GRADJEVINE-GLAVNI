import React from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import logoImage from '@/src/assets/images/logo.webp';

interface CategoryOption {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  disabled?: boolean;
}

interface CategorySelectorProps {
  options: CategoryOption[];
  selectedCategory: string | null;
  onSelect: (id: string) => void;
  logoUrl?: string;
  userRole?: string;
}

const CATEGORY_THEMES: Record<string, {
  borderActive: string;
  bgActive: string;
  shadowActive: string;
  borderHover: string;
  iconColor: string;
  textGlow: string;
  iconBgActive: string;
  badgeGlow: string;
}> = {
  job: {
    borderActive: "border-blue-500/80 ring-1 ring-blue-500/30",
    bgActive: "bg-gradient-to-b from-[#0c1835]/80 to-[#050814]/85",
    shadowActive: "shadow-[0_0_50px_rgba(59,130,246,0.3)] scale-[1.02] -translate-y-1",
    borderHover: "hover:border-blue-500/40 hover:bg-slate-900/60 hover:-translate-y-1",
    iconColor: "text-blue-400",
    textGlow: "text-blue-400 [text-shadow:0_0_15px_rgba(59,130,246,0.4)]",
    iconBgActive: "bg-blue-500/20 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.4)]",
    badgeGlow: "text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]",
  },
  accommodation: {
    borderActive: "border-emerald-500/80 ring-1 ring-emerald-500/30",
    bgActive: "bg-gradient-to-b from-[#0a2316]/80 to-[#030c07]/85",
    shadowActive: "shadow-[0_0_50px_rgba(16,185,129,0.3)] scale-[1.02] -translate-y-1",
    borderHover: "hover:border-emerald-500/40 hover:bg-slate-900/60 hover:-translate-y-1",
    iconColor: "text-emerald-400",
    textGlow: "text-emerald-400 [text-shadow:0_0_15px_rgba(16,185,129,0.4)]",
    iconBgActive: "bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.4)]",
    badgeGlow: "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]",
  },
  catering: {
    borderActive: "border-amber-500/80 ring-1 ring-amber-500/30",
    bgActive: "bg-gradient-to-b from-[#211505]/80 to-[#0b0701]/85",
    shadowActive: "shadow-[0_0_50px_rgba(245,158,11,0.3)] scale-[1.02] -translate-y-1",
    borderHover: "hover:border-amber-500/40 hover:bg-slate-900/60 hover:-translate-y-1",
    iconColor: "text-amber-400",
    textGlow: "text-amber-400 [text-shadow:0_0_15px_rgba(245,158,11,0.4)]",
    iconBgActive: "bg-amber-500/20 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.4)]",
    badgeGlow: "text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]",
  },
  default: {
    borderActive: "border-secondary/80 ring-1 ring-secondary/30",
    bgActive: "bg-gradient-to-b from-[#1c140a]/85 to-[#070502]/85",
    shadowActive: "shadow-[0_0_50px_rgba(254,191,13,0.3)] scale-[1.02] -translate-y-1",
    borderHover: "hover:border-secondary/40 hover:bg-slate-900/60 hover:-translate-y-1",
    iconColor: "text-secondary",
    textGlow: "text-secondary [text-shadow:0_0_15px_rgba(254,191,13,0.3)]",
    iconBgActive: "bg-secondary border-secondary shadow-[0_0_20px_rgba(254,191,13,0.4)]",
    badgeGlow: "text-secondary drop-shadow-[0_0_8px_rgba(254,191,13,0.5)]",
  }
};

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  options,
  selectedCategory,
  onSelect,
  logoUrl,
  userRole
}) => {
  const navigate = useNavigate();

  const handleCategoryClick = (id: string, disabled?: boolean) => {
    if (disabled) return;
    onSelect(id);
  };

  return (
    <div className="min-h-screen bg-[#0B1219] text-white flex flex-col pt-32 pb-20 px-6 relative overflow-hidden font-body">
      <div className="absolute inset-0 futuristic-grid opacity-20 pointer-events-none"></div>

      {/* BACKGROUND BLOBS REMOVED AS REQUESTED */}

      <div className="max-w-7xl mx-auto w-full flex justify-center items-center mb-8 sm:mb-20 relative z-10 mt-2 sm:mt-10">
        <Link to="/" className="inline-block hover:opacity-80 transition-opacity">
          <img src={logoUrl || logoImage} alt="Svet Građevine" className="!h-16 md:!h-32 !w-auto max-w-[200px] md:max-w-none object-contain drop-shadow-md mx-auto" />
        </Link>
      </div>

      <div className="relative z-10 max-w-5xl w-full mx-auto text-center flex-1 flex flex-col justify-center">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 font-headline leading-none">
            ŠTA <span className="text-secondary">OGLAŠAVATE?</span>
          </h1>
          <p className="text-on-surface-variant text-lg mb-16 max-w-2xl mx-auto font-medium">
            Izaberite tip oglasa kako bismo vam ponudili najrelevantnija polja za unos podataka.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {options.map((opt, idx) => {
              const isSelected = selectedCategory === opt.id && !opt.disabled;
              const theme = CATEGORY_THEMES[opt.id] || CATEGORY_THEMES.default;
              return (
                <motion.div
                  key={opt.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 * idx }}
                  onClick={() => handleCategoryClick(opt.id, opt.disabled)}
                  tabIndex={opt.disabled ? 0 : undefined}
                  className={`p-10 rounded-[24px] border text-center transition-all duration-500 group/tooltip relative overflow-hidden backdrop-blur-xl flex flex-col items-center justify-center ${
                    opt.disabled 
                      ? 'cursor-not-allowed opacity-40 border-white/5 bg-slate-950/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]' 
                      : 'cursor-pointer'
                  } ${
                    isSelected
                      ? `${theme.borderActive} ${theme.bgActive} ${theme.shadowActive}`
                      : `border-white/10 bg-slate-900/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] ${theme.borderHover}`
                  }`}
                >
                  <div className={`w-16 h-16 rounded-[12px] flex items-center justify-center mb-6 ${!opt.disabled && "group-hover:scale-110"} transition-all duration-300 border ${
                    isSelected 
                      ? theme.iconBgActive
                      : "bg-white/5 border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] group-hover:border-secondary/50 group-hover:bg-secondary/[0.05]"
                  }`}>
                    <span className={`material-symbols-outlined text-3xl ${isSelected ? "!text-black" : "text-secondary"}`}>{opt.icon}</span>
                  </div>
                  <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 font-headline whitespace-pre-line leading-tight transition-all duration-300 ${isSelected ? theme.textGlow : "text-white group-hover:text-secondary"}`}>{opt.title}</h3>

                  <div className={`absolute top-6 right-6 transition-all duration-300 ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
                    <span className={`material-symbols-outlined text-3xl ${theme.badgeGlow}`}>check_circle</span>
                  </div>

                {opt.disabled && (
                  <>
                    {/* Mobile Tooltip */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 group-focus/tooltip:opacity-100 transition-all duration-300 scale-95 group-hover/tooltip:scale-100 group-focus/tooltip:scale-100 z-50 w-max md:hidden">
                      <div className="bg-[#0b131a]/95 backdrop-blur-md border border-white/10 py-1.5 px-3 rounded-[8px] shadow-lg flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-[14px]">hourglass_empty</span>
                        <span className="text-white/90 text-[11px] font-bold tracking-wide">Stiže uskoro!</span>
                      </div>
                    </div>
                    {/* Desktop Tooltip */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 group-focus/tooltip:opacity-100 transition-all duration-300 scale-90 group-hover/tooltip:scale-100 group-focus/tooltip:scale-100 z-50 w-max hidden md:block">
                      <div className="bg-[#0b131a]/95 backdrop-blur-md border border-white/10 p-4 md:p-5 rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.5)] whitespace-nowrap md:min-w-[260px] flex flex-col items-start text-left">
                        <div className="flex items-center gap-2.5 mb-2">
                          <img src={logoUrl || logoImage} alt="Svet Građevine Logo" className="h-5 md:h-6 w-auto object-contain drop-shadow-md flex-shrink-0" />
                          <span className="text-secondary font-black text-[11px] md:text-[12px] uppercase tracking-widest">USKORO!</span>
                        </div>
                        <p className="text-white/90 text-[12px] md:text-[13px] font-medium tracking-wide">Ova sekcija stiže uskoro!</p>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
