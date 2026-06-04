import React, { useState, useRef, useEffect } from 'react';
import { LOCATIONS } from '@/src/constants/taxonomy';

interface LocationComboboxProps {
  selectedLocation: string | null;
  onChange: (slug: string | null) => void;
  placeholder?: string;
  className?: string;
}

export function LocationCombobox({ selectedLocation, onChange, placeholder = "Pretraži lokaciju (npr. Beograd)...", className = "" }: LocationComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedLocation) {
      const loc = LOCATIONS.find(l => l.slug === selectedLocation);
      if (loc) setQuery(loc.name);
    } else {
      setQuery("");
    }
  }, [selectedLocation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const filteredLocations = LOCATIONS.filter(loc => 
    loc.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 15); // Increased limit for better scrolling experience

  const handleSelect = (locSlug: string | null, locName: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setQuery(locName);
    setIsOpen(false);
    onChange(locSlug);
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef} onClick={(e) => e.stopPropagation()}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (e.target.value === "") onChange(null);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-slate-800/80 border border-white/5 hover:border-secondary/30 rounded-[10px] py-3.5 pl-12 pr-10 text-base text-white placeholder-white/30 focus:ring-1 focus:ring-secondary/50 outline-none transition-all"
        />
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl pointer-events-none">location_on</span>
        {query && (
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(null, "");
            }} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white mt-0.5"
          >
             <span className="material-symbols-outlined text-lg">close</span>
          </button>
        )}
      </div>

      {isOpen && query.length > 0 && (
        <div 
          className="absolute top-14 left-0 w-full bg-slate-950 border border-white/10 rounded-[10px] shadow-2xl overflow-y-auto max-h-[300px] z-[100] overscroll-contain"
          onClick={(e) => e.stopPropagation()}
        >
          {filteredLocations.length > 0 ? (
            <div className="py-2">
              {filteredLocations.map(loc => (
                <div
                  key={loc.slug}
                  onClick={(e) => handleSelect(loc.slug, loc.name, e)}
                  className="px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white cursor-pointer transition-colors flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-white/20 text-base">location_on</span>
                  {loc.name}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-white/40 text-center">
              Nema rezultata za "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
