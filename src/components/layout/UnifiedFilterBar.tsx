import React, { ReactNode } from 'react';
import { LOCATIONS } from '@/src/constants/taxonomy';

export interface UnifiedFilterBarProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  searchPlaceholder?: string;
  
  selectedLocation: string;
  onLocationChange: (val: string) => void;
  
  onApplyFilters: () => void;
  
  slots?: ReactNode; // specific filters for the niche (e.g. number of beds, salary, etc.)
}

export const UnifiedFilterBar: React.FC<UnifiedFilterBarProps> = ({
  searchQuery, onSearchChange, searchPlaceholder = "Pretraži...",
  selectedLocation, onLocationChange,
  onApplyFilters,
  slots
}) => {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex-1 min-w-[200px]">
        <label className="font-label text-[10px] text-secondary font-black tracking-[0.2em] block mb-2 uppercase">KLUČNA REČ</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary text-xl font-black transition-colors group-focus-within:text-white">search</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#13212e]/40 backdrop-blur-xl border border-white/5 text-[#dce6f5] text-sm font-bold h-12 pl-12 pr-4 rounded-[10px] focus:ring-2 focus:ring-secondary/50 appearance-none outline-none group-hover:bg-[#192735]/60 transition-colors"
            onKeyDown={(e) => e.key === 'Enter' && onApplyFilters()}
          />
        </div>
      </div>

      <div className="flex-1 min-w-[200px]">
        <label className="font-label text-[10px] text-secondary font-black tracking-[0.2em] block mb-2 uppercase">LOKACIJA</label>
        <div className="relative group">
          <select 
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full bg-[#13212e]/40 backdrop-blur-xl border border-white/5 text-[#dce6f5] text-sm font-bold h-12 px-4 pr-10 rounded-[10px] focus:ring-2 focus:ring-secondary/50 appearance-none outline-none group-hover:bg-[#192735]/60 transition-colors cursor-pointer"
          >
            <option value="all">Sve lokacije</option>
            {LOCATIONS.map(loc => <option key={loc.slug} value={loc.id || loc.slug}>{loc.name}</option>)}
          </select>
          <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">expand_more</span>
        </div>
      </div>
      
      {slots}

      <div className="w-full md:w-auto self-end mt-4 md:mt-0">
        <button
          onClick={onApplyFilters}
          className="bg-secondary text-slate-950 h-12 px-10 rounded-[10px] font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-xl shadow-secondary/10 flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <span className="material-symbols-outlined text-lg">filter_alt</span>
          PRIMENI FILTERE
        </button>
      </div>
    </div>
  );
};
