import React from 'react';
import { LOCATIONS, SECTORS } from '@/src/constants/taxonomy';

interface QuickFiltersProps {
  selectedLocations: string[];
  toggleLocation: (slug: string) => void;
  selectedSector: string | null;
  handleSectorChange: (slug: string | null) => void;
  selectedProfession: string | null;
  selectedBenefits: string[];
  searchQuery: string;
  onClearAll: () => void;
}

export const JobsQuickFilters: React.FC<QuickFiltersProps> = ({
  selectedLocations,
  toggleLocation,
  selectedSector,
  handleSectorChange,
  selectedProfession,
  selectedBenefits,
  searchQuery,
  onClearAll
}) => {
  return (
    <section className="bg-[#0A0F14] border-b border-white/5 py-3 overflow-x-auto no-scrollbar">
      <div className="max-w-screen-2xl mx-auto px-8 flex items-center gap-4">
        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] whitespace-nowrap">Brzi filteri:</span>
        {LOCATIONS.slice(0, 5).map(loc => (
          <button 
            key={loc.slug}
            onClick={() => toggleLocation(loc.slug)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${selectedLocations.includes(loc.slug) ? 'bg-secondary !text-black border-secondary' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}
          >
            {loc.name}
          </button>
        ))}
        <div className="w-px h-4 bg-white/10 shrink-0"></div>
        {SECTORS.slice(0, 3).map(sector => (
          <button 
            key={sector.slug}
            onClick={() => handleSectorChange(selectedSector === sector.slug ? null : sector.slug)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${selectedSector === sector.slug ? 'bg-secondary !text-black border-secondary' : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20'}`}
          >
            {sector.name.split(' (')[0]}
          </button>
        ))}
        {selectedLocations.length > 0 || selectedSector || selectedProfession || selectedBenefits.length > 0 || searchQuery ? (
          <button 
            onClick={onClearAll}
            className="ml-auto text-secondary text-[10px] font-black uppercase tracking-widest hover:underline whitespace-nowrap"
          >
            Očisti sve
          </button>
        ) : null}
      </div>
    </section>
  );
};
