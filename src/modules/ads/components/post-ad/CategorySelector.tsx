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

      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-6 mb-12 sm:mb-20 relative z-10 mt-4 sm:mt-10">
        <Link to="/" className="flex flex-col items-center sm:items-start leading-none hover:opacity-80 transition-opacity">
          <img src={logoUrl || logoImage} alt="Svet Građevine" className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-md" />
        </Link>
        <div className="flex flex-col items-center sm:items-end">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">POČETNI KORAK</span>
            <span className="text-xs font-black uppercase tracking-widest text-white">PROFILISANJE</span>
          </div>
          <div className="w-32 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
            <div className="w-2/3 h-full bg-secondary"></div>
          </div>
        </div>
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
            {options.map((opt, idx) => (
              <motion.div
                key={opt.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.1 * idx }}
                onClick={() => handleCategoryClick(opt.id, opt.disabled)}
                tabIndex={opt.disabled ? 0 : undefined}
                className={`p-10 rounded-[10px] border-2 text-left transition-all duration-500 group/tooltip relative overflow-hidden ${opt.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'} ${selectedCategory === opt.id && !opt.disabled ? "border-secondary bg-secondary/5" : "border-white/5 bg-white/[0.02] " + (!opt.disabled ? "hover:border-secondary/50 hover:bg-secondary/5" : "")}`}
              >
                <div className={`w-16 h-16 rounded-[10px] flex items-center justify-center mb-8 ${!opt.disabled && "group-hover:scale-110"} transition-transform border ${selectedCategory === opt.id && !opt.disabled ? "bg-secondary border-secondary" : "bg-surface-container-high border-white/10"}`}>
                  <span className={`material-symbols-outlined text-3xl ${selectedCategory === opt.id && !opt.disabled ? "!text-black" : "text-secondary"}`}>{opt.icon}</span>
                </div>
                <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 font-headline transition-colors ${selectedCategory === opt.id && !opt.disabled ? "text-secondary" : "text-white"}`}>{opt.title}</h3>
                <p className="text-[10px] font-black tracking-[0.2em] text-on-surface-variant uppercase">{opt.subtitle}</p>

                <div className={`absolute top-6 right-6 transition-all duration-300 ${selectedCategory === opt.id && !opt.disabled ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
                  <span className="material-symbols-outlined text-secondary text-3xl">check_circle</span>
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
            ))}
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-6 mt-16 sm:mt-20 pt-8 border-t border-white/5 relative z-10 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant text-center sm:text-left">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center">
          <span>© 2026 Svet Građevine. Izgrađeno sa preciznošću.</span>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/kontakt" className="hover:text-white transition-colors">Uslovi korišćenja</Link>
            <Link to="/kontakt" className="hover:text-white transition-colors">Politika privatnosti</Link>
            <Link to="/kontakt" className="hover:text-white transition-colors">Kontakt podrške</Link>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span>Sistem: Operativan</span>
        </div>
      </div>
    </div>
  );
};
