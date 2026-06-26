import React, { useState } from 'react';
import { LOCATIONS, SECTORS, PROFESSIONS, BENEFITS } from '@/src/constants/taxonomy';
import { FilterSidebar, FilterClearButton, FilterSection, FilterToggle, FilterRadio, FilterCTA } from '@/src/modules/core/components/filters/FilterComponents';
import { LocationCombobox } from '@/src/components/LocationCombobox';
import { useNavigate } from 'react-router-dom';

interface JobFiltersProps {
  stats: { total: number; today: number };
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedSector: string | null;
  handleSectorChange: (slug: string | null) => void;
  selectedProfession: string | null;
  setSelectedProfession: (slug: string | null) => void;
  selectedLocations: string[];
  filterRadius: string;
  setFilterRadius: (v: string) => void;
  toggleLocation: (slug: string) => void;
  setSelectedLocations: (locs: string[]) => void;
  selectedBenefits: string[];
  toggleBenefit: (slug: string) => void;
  setSelectedBenefits: (benefits: string[]) => void;
  salaryRange: [number, number];
  setSalaryRange: (range: [number, number]) => void;
  handleApplyFilters: () => void;
}

export function JobFilters({
  stats,
  searchQuery, setSearchQuery,
  selectedSector, handleSectorChange,
  selectedProfession, setSelectedProfession,
  selectedLocations, filterRadius, setFilterRadius, toggleLocation, setSelectedLocations,
  selectedBenefits, toggleBenefit, setSelectedBenefits,
  salaryRange, setSalaryRange,
  handleApplyFilters
}: JobFiltersProps) {
  const navigate = useNavigate();
  const [professionSearch, setProfessionSearch] = useState('');

  let allProfessions: { slug: string; name: string; sectorSlug: string }[] = [];
  if (selectedSector) {
    allProfessions = (PROFESSIONS[selectedSector] || []).map(p => ({ ...p, sectorSlug: selectedSector }));
  } else {
    Object.entries(PROFESSIONS).forEach(([sectorSlug, prods]) => {
      prods.forEach(p => allProfessions.push({ ...p, sectorSlug }));
    });
  }

  const filteredProfessions = professionSearch
    ? allProfessions.filter(p => p.name.toLowerCase().includes(professionSearch.toLowerCase()))
    : allProfessions;

  return (
    <FilterSidebar>
      {/* Clear All Button - Always visible at the top */}
      <FilterClearButton 
        onClick={() => {
          setFilterRadius('50');
          setSearchQuery('');
          handleSectorChange(null);
          setSelectedProfession(null);
          setSelectedLocations([]);
          setSelectedBenefits([]);
          setSalaryRange([0, 5000]);
          handleApplyFilters();
        }}
      />

      {/* Location Filter */}
      <FilterSection title="Lokacija">
        <div className="space-y-4">
          <LocationCombobox 
            selectedLocation={selectedLocations.length > 0 ? selectedLocations[0] : null}
            onChange={(slug) => {
               if (slug) setSelectedLocations([slug]);
               else setSelectedLocations([]);
            }}
          />
          {selectedLocations.length > 0 && selectedLocations[0] !== 'all' && (
            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-white/60">Radijus pretrage:</label>
                <span className="text-xs font-bold text-secondary">+{filterRadius} km</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={filterRadius}
                onChange={(e) => setFilterRadius(e.target.value)}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
              />
              <div className="flex justify-between mt-1 px-1">
                <span className="text-[10px] text-white/40">Samo grad</span>
                <span className="text-[10px] text-white/40">+100 km</span>
              </div>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Salary Filter */}
      <FilterSection title="Plata">
        <div className="flex justify-between items-center mb-6">
          <span className="text-[10px] text-white/40 font-bold uppercase">Raspon (Eura)</span>
          <span className="text-xs text-secondary font-black">{salaryRange[0]}€ &mdash; {salaryRange[1]}€</span>
        </div>
        
        <div className="space-y-4">
          <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="absolute h-full bg-secondary" 
              style={{ 
                left: `${(salaryRange[0] / 5000) * 100}%`, 
                right: `${100 - (salaryRange[1] / 5000) * 100}%` 
              }}
            ></div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[10px] text-white/40 font-bold uppercase mb-1 block">Min</label>
              <input 
                type="number" 
                value={salaryRange[0]}
                onChange={(e) => setSalaryRange([Number(e.target.value), salaryRange[1]])}
                className="w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2 text-xs text-white outline-none focus:border-secondary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-white/40 font-bold uppercase mb-1 block">Max</label>
              <input 
                type="number" 
                value={salaryRange[1]}
                onChange={(e) => setSalaryRange([salaryRange[0], Number(e.target.value)])}
                className="w-full bg-white/5 border border-white/10 rounded-[10px] px-3 py-2 text-xs text-white outline-none focus:border-secondary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Sector Filter */}
      <FilterSection title="Sektor">
        <div className="space-y-3">
          <FilterRadio 
            name="sector" 
            label="Svi sektori" 
            checked={selectedSector === null} 
            onChange={() => handleSectorChange(null)} 
          />
          {SECTORS.map((sector) => (
            <FilterRadio 
              key={sector.slug} 
              name="sector" 
              label={sector.name} 
              checked={selectedSector === sector.slug} 
              onChange={() => handleSectorChange(sector.slug)} 
            />
          ))}
        </div>
      </FilterSection>

      {/* Profession Filter */}
      <FilterSection title="Zanimanje">
        <div className="mb-3">
          <input 
            type="text"
            value={professionSearch}
            onChange={(e) => setProfessionSearch(e.target.value)}
            placeholder="Pretraži zanimanja..."
            className="w-full bg-slate-900 border border-white/5 hover:border-secondary/30 rounded-[10px] px-4 py-3 text-sm text-white outline-none focus:border-secondary/80 focus:bg-slate-950 focus:shadow-[0_0_15px_rgba(254,191,13,0.15)] placeholder:text-white/30 transition-all"
          />
        </div>
        {professionSearch || selectedSector ? (
        <div className="space-y-1 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          <div 
            onClick={() => { setSelectedProfession(null); setProfessionSearch(''); }}
            className={`px-3 py-2 text-xs cursor-pointer transition-all rounded-[10px] mb-1 ${selectedProfession === null ? 'bg-secondary !text-black font-black' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
          >
            Sva zanimanja
          </div>
          {filteredProfessions.map((prof) => (
            <div 
              key={prof.slug}
              onClick={() => {
                setProfessionSearch('');
                if (prof.slug === selectedProfession) {
                  setSelectedProfession(null);
                } else {
                  if (!selectedSector || prof.sectorSlug !== selectedSector) {
                    handleSectorChange(prof.sectorSlug);
                  }
                  setSelectedProfession(prof.slug);
                }
              }}
              className={`px-3 py-2 text-xs cursor-pointer transition-all rounded-[10px] mb-1 ${selectedProfession === prof.slug ? 'bg-secondary !text-black font-black' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
            >
              {!selectedSector && prof.sectorSlug && (
                <span className="text-[8px] text-white/20 uppercase tracking-wider mr-2">
                  [{SECTORS.find(s => s.slug === prof.sectorSlug)?.name || prof.sectorSlug}]
                </span>
              )}
              {prof.name}
            </div>
          ))}
          {filteredProfessions.length === 0 && (
            <div className="text-xs text-white/30 text-center py-4">Nema rezultata za "{professionSearch}"</div>
          )}
        </div>
        ) : (
          <div className="text-xs text-white/30 text-center py-4">Izaberite sektor ili ukucajte zanimanje</div>
        )}
      </FilterSection>

      {/* Benefits Filter */}
      <FilterSection title="Benefiti">
        <div className="space-y-4">
          {BENEFITS.map((benefit) => (
            <FilterToggle 
              key={benefit.slug} 
              label={benefit.name} 
              checked={selectedBenefits.includes(benefit.slug)} 
              onChange={() => toggleBenefit(benefit.slug)} 
            />
          ))}
        </div>
      </FilterSection>

      {/* Job Alert Card */}
      <FilterCTA 
        title="POSTAVITE OGLAS ZA POSAO"
        description="PRONAĐITE NAJBOLJE MAJSTORE, INŽENJERE I STRUČNE TIMOVE ZA VAŠE PROJEKTE."
        buttonText="POSTAVI OGLAS"
        onClick={() => navigate('/postavi-oglas')}
        icon="person_add"
      />
    </FilterSidebar>
  );
}
