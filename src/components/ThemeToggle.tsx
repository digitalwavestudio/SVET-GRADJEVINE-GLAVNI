import React from 'react';
import { useTheme } from '@/src/context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "mt-8" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`flex items-center gap-2 bg-surface-container-highest p-1 rounded-lg border border-outline-variant/10 w-max ${className}`}>
      <button 
        onClick={() => theme === 'light' && toggleTheme()}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-secondary to-yellow-600 text-slate-950 shadow-md' 
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: theme === 'dark' ? '"FILL" 1' : '"FILL" 0' }}>dark_mode</span> Tamni mod
      </button>
      <button 
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-300 relative group/tooltip ${
          theme === 'light' 
            ? 'bg-gradient-to-br from-secondary to-yellow-600 text-slate-950 shadow-md' 
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: theme === 'light' ? '"FILL" 1' : '"FILL" 0' }}>light_mode</span> Svetli
        
        {/* Tooltip Popup */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 scale-90 group-hover/tooltip:scale-100 z-50">
          <div className="bg-[#0F1923] border border-secondary/50 p-3 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] whitespace-nowrap">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-secondary text-sm">construction</span>
              <span className="text-secondary font-black text-[10px] uppercase tracking-widest">Uskoro</span>
            </div>
            <p className="text-white text-[11px] font-medium">Svetli mod stiže uskoro, još uvek je u izradi!</p>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#0F1923]"></div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default ThemeToggle;
