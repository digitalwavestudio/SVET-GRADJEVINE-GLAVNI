import React from 'react';
import { useTheme } from '@/src/context/ThemeContext';
import logoImage from '@/src/assets/images/logo.webp';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "mt-8" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center gap-1.5 p-1.5 rounded-[10px] bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)] w-max ${className}`}>
      <button 
        onClick={() => theme === 'light' && toggleTheme()}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-secondary to-yellow-500 !text-black shadow-[0_2px_10px_rgba(255,193,7,0.3)]' 
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
      >
        <span className="material-symbols-outlined text-[16px] drop-shadow-sm" style={{ fontVariationSettings: theme === 'dark' ? '"FILL" 1' : '"FILL" 0' }}>bedtime</span> Tamni mod
      </button>
      <button 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-all duration-300 relative group/tooltip ${
          theme === 'light' 
            ? 'bg-gradient-to-br from-secondary to-yellow-500 !text-black shadow-[0_2px_10px_rgba(255,193,7,0.3)]' 
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }`}
      >
        <span className="material-symbols-outlined text-[16px] drop-shadow-sm" style={{ fontVariationSettings: theme === 'light' ? '"FILL" 1' : '"FILL" 0' }}>sunny</span> Svetli
        
        {/* Tooltip Popup */}
        <>
          {/* Mobile Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 scale-95 group-hover/tooltip:scale-100 z-50 w-max md:hidden">
            <div className="bg-[#0b131a]/95 backdrop-blur-md border border-white/10 py-1.5 px-3 rounded-[8px] shadow-lg flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[14px]">hourglass_empty</span>
              <span className="text-white/90 text-[11px] font-bold tracking-wide">Stiže uskoro!</span>
            </div>
          </div>
          {/* Desktop Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 scale-90 group-hover/tooltip:scale-100 z-50 w-max hidden md:block">
            <div className="bg-[#0b131a]/95 backdrop-blur-md border border-white/10 p-4 md:p-5 rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.5)] whitespace-nowrap md:min-w-[260px] flex flex-col items-start text-left">
              <div className="flex items-center gap-2.5 mb-2">
                <img src={logoImage} alt="Svet Građevine Logo" className="h-5 md:h-6 w-auto object-contain drop-shadow-md flex-shrink-0" />
                <span className="text-secondary font-black text-[11px] md:text-[12px] uppercase tracking-widest">USKORO!</span>
              </div>
              <p className="text-white/90 text-[12px] md:text-[13px] font-medium tracking-wide">Svetli mod stiže uskoro, još uvek je u izradi!</p>
            </div>
          </div>
        </>
      </button>
    </div>
  );
};

export default ThemeToggle;
