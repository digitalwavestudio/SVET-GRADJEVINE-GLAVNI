import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export const FilterSidebar = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.touches[0].clientY - touchStart;
    if (diff > 0) setTranslateY(diff);
  };

  const handleTouchEnd = () => {
    if (translateY > 100) {
      setIsOpen(false);
    }
    setTranslateY(0);
  };

  return (
    <>
      {/* Mobile Filter Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-secondary text-black font-black text-xs uppercase tracking-widest px-6 py-4 rounded-full shadow-[0_10px_40px_rgba(254,191,13,0.3)] hover:bg-yellow-500 transition-all flex items-center gap-3"
      >
        <span className="material-symbols-outlined text-lg">filter_list</span>
        Filteri
      </button>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Bottom Sheet */}
      {isOpen && (
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 z-[110] bg-slate-950 border-t border-white/10 rounded-t-3xl flex flex-col animate-in slide-in-from-bottom duration-300"
          style={{
            maxHeight: '80vh',
            transform: `translateY(${translateY}px)`,
            transition: translateY === 0 ? 'none' : 'none',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing shrink-0">
            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex justify-between items-center px-6 pb-4 border-b border-white/5 shrink-0">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Filteri</span>
            <button
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4 space-y-6 custom-scrollbar">
            {children}
          </div>

          {/* Apply Button */}
          <div className="px-6 pb-6 pt-4 border-t border-white/5 shrink-0 bg-slate-950">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-4 bg-secondary !text-black font-black rounded-[10px] uppercase tracking-widest text-xs hover:bg-yellow-500 transition-all"
            >
              Prikaži rezultate
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-full lg:w-[300px] shrink-0 space-y-6 relative z-10">
        {children}
      </aside>
    </>
  );
};

export const FilterClearButton = ({ onClick }: { onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full py-3.5 rounded-[10px] bg-white/5 border border-white/10 text-white/70 text-base font-bold uppercase tracking-widest hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all flex items-center justify-center gap-2 group duration-300"
  >
    <span className="material-symbols-outlined text-base group-hover:rotate-180 transition-transform duration-500">restart_alt</span>
    Resetuj filtere
  </button>
);


export const FilterSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-slate-950 p-6 rounded-[10px] border border-white/[0.08] hover:border-white/[0.15] transition-all duration-300 shadow-sm">
    <h3 className="text-sm font-black text-white/50 uppercase tracking-[0.2em] mb-5">{title}</h3>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

export const FilterSelect = ({ className, value, onChange, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) updateCoords();
    setIsOpen(!isOpen);
  };

  const options: {value: any; label: React.ReactNode}[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === 'option') {
      const childProps = (child as React.ReactElement).props as { value?: any; children?: React.ReactNode; className?: string };
      options.push({
        value: childProps.value !== undefined ? childProps.value : childProps.children,
        label: childProps.children,
      });
    }
  });

  const selectedOption = options.find(opt => opt.value == value) || options[0];

  const handleSelect = (val: any) => {
    if (onChange) {
      const event = {
        target: { value: val }
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(event);
    }
    setIsOpen(false);
  };

  const DropdownList = () => {
    if (!isOpen) return null;
    return createPortal(
      <div 
        ref={dropdownRef}
        style={{ 
          position: 'absolute', 
          top: `${coords.top + 8}px`, 
          left: `${coords.left}px`, 
          width: `${coords.width}px` 
        }}
        className="z-[9999] bg-slate-950 border border-white/20 rounded-[10px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden py-2 max-h-[420px] overflow-y-auto overscroll-contain custom-scrollbar animate-in fade-in zoom-in-95 duration-200"
      >
        {options.map((opt, i) => (
          <div
            key={i}
            onClick={() => handleSelect(opt.value)}
            className={`px-4 py-3.5 text-base cursor-pointer transition-colors ${opt.value == value ? 'bg-secondary !text-black font-black' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            {opt.label}
          </div>
        ))}
      </div>,
      document.body
    );
  };

  return (
    <div className={`relative ${className || ''}`}>
      <select value={value} onChange={onChange} className="hidden" {...props}>
        {children}
      </select>
      
      <div 
        ref={triggerRef}
        onClick={handleToggle}
        className={`w-full bg-slate-900 border ${isOpen ? 'border-secondary/80 ring-2 ring-secondary/20 shadow-[0_0_20px_rgba(254,191,13,0.2)]' : 'border-white/5 hover:border-secondary/30'} rounded-[10px] px-4 py-3.5 text-base text-white outline-none cursor-pointer transition-all flex items-center justify-between select-none min-h-[54px] group/select`}
      >
        <span className="truncate pr-6 font-medium">{selectedOption?.label}</span>
        <span className={`material-symbols-outlined text-white/30 transition-transform duration-300 ${isOpen ? 'rotate-180 text-secondary' : 'group-hover/select:text-white/50'} text-xl`}>expand_more</span>
      </div>

      <DropdownList />
    </div>
  );
};

export const FilterInput = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input 
    {...props} 
    className={`w-full bg-slate-900 border border-white/5 hover:border-secondary/30 rounded-[10px] px-4 py-3.5 text-base text-white outline-none focus:border-secondary/80 focus:bg-slate-950 focus:shadow-[0_0_15px_rgba(254,191,13,0.15)] placeholder:text-white/30 transition-all ${className || ''}`}
  />
);

export const FilterToggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) => (
  <button type="button" className="w-full flex justify-between items-center group cursor-pointer text-left h-10" onClick={() => onChange(!checked)}>
    <span className={`text-base font-bold transition-all duration-300 ${checked ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>{label}</span>
    <div className={`w-12 h-6 rounded-full relative transition-all duration-300 border shrink-0 ${checked ? 'bg-secondary border-secondary shadow-sm shadow-secondary/20' : 'bg-slate-900 border-white/10 group-hover:border-white/30'}`}>
      <div className={`absolute top-[2px] w-4.5 h-4.5 rounded-full shadow-md transition-all duration-300 ${checked ? 'right-[3px] bg-slate-950 translate-x-0' : 'left-[3px] bg-white/40'}`}></div>
    </div>
  </button>
);

export const FilterRadio = ({ label, checked, onChange, name }: { label: string, checked: boolean, onChange: () => void, name: string }) => (
  <label className="flex items-center gap-4 cursor-pointer group h-10">
    <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
      <input 
        checked={checked}
        onChange={onChange}
        className="peer appearance-none w-full h-full border border-white/10 group-hover:border-white/40 group-hover:bg-white/5 rounded-full bg-slate-800/80 checked:bg-secondary checked:border-secondary checked:shadow-[0_0_15px_rgba(250,204,21,0.3)] focus:border-secondary/80 focus:shadow-[0_0_15px_rgba(254,191,13,0.15)] transition-all cursor-pointer" 
        type="radio" 
        name={name}
      />
      <div className="absolute w-2.5 h-2.5 bg-slate-950 rounded-full opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 pointer-events-none transition-all duration-300"></div>
    </div>
    <span className={`text-base transition-colors duration-300 ${checked ? 'text-white font-bold' : 'text-white/50 group-hover:text-white/90'}`}>{label}</span>
  </label>
);

export const FilterCheckbox = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) => (
  <label className="flex items-center gap-4 cursor-pointer group h-10">
    <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
      <input 
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer appearance-none w-full h-full border border-white/10 group-hover:border-white/40 group-hover:bg-white/5 rounded bg-slate-800/80 checked:bg-secondary checked:border-secondary checked:shadow-[0_0_15px_rgba(250,204,21,0.3)] focus:border-secondary/80 focus:shadow-[0_0_15px_rgba(254,191,13,0.15)] transition-all cursor-pointer" 
        type="checkbox" 
      />
      <span className="material-symbols-outlined absolute text-base !text-black opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 pointer-events-none transition-all duration-300">check</span>
    </div>
    <span className={`text-base transition-colors duration-300 ${checked ? 'text-white font-bold' : 'text-white/50 group-hover:text-white/90'}`}>{label}</span>
  </label>
);

export const MarketStatsWidget = (_props: { stats: { total: number; trend?: string; category: string } }) => null;

export const ViewToggle = ({ viewMode, setViewMode }: { viewMode: 'list' | 'grid'; setViewMode: (mode: 'list' | 'grid') => void }) => (
  <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-xl p-0.5 gap-0.5">
    <button
      onClick={() => setViewMode('list')}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
        viewMode === 'list'
          ? 'bg-white/10 text-secondary shadow-sm shadow-white/5'
          : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
      }`}
      title="Prikaz kao lista"
    >
      <span className="material-symbols-outlined text-lg">view_list</span>
    </button>
    <button
      onClick={() => setViewMode('grid')}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ${
        viewMode === 'grid'
          ? 'bg-white/10 text-secondary shadow-sm shadow-white/5'
          : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
      }`}
      title="Mrežni prikaz"
    >
      <span className="material-symbols-outlined text-lg">grid_view</span>
    </button>
  </div>
);

export const ActiveFilterChips = ({ filters, onRemove, onClearAll }: { 
  filters: { id: string; label: string; value: any }[], 
  onRemove: (id: string) => void,
  onClearAll: () => void 
}) => {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mr-2">Aktivni Filteri:</span>
      {filters.map((filter) => (
        <div 
          key={filter.id}
          className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-sm hover:border-secondary/30 transition-all group"
        >
          <span className="text-[10px] font-black text-white/80 uppercase tracking-tight italic">{filter.label}:</span>
          <span className="text-[10px] font-bold text-secondary uppercase tracking-tight">{String(filter.value)}</span>
          <button 
            onClick={() => onRemove(filter.id)}
            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-white/10 text-white/30 hover:text-red-400 transition-all ml-1"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      ))}
      <button 
        onClick={onClearAll}
        className="text-[9px] font-black text-secondary hover:text-white uppercase tracking-widest underline underline-offset-4 ml-2 transition-colors"
      >
        Očisti sve
      </button>
    </div>
  );
};

export const SortingBar = ({ currentSort, options, onChange }: { 
  currentSort: string, 
  options: { value: string; label: string }[],
  onChange: (value: string) => void 
}) => (
  <div className="bg-slate-950 border border-white/5 rounded-[10px] p-2 hidden md:flex md:flex-row items-center justify-between mb-8 shadow-2xl gap-2">
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-2 w-full">
      <span className="material-symbols-outlined text-white/20 text-lg mr-2 shrink-0">sort</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 sm:flex-initial px-3 py-2 sm:px-4 sm:py-2 rounded-sm text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
            currentSort === opt.value 
            ? 'bg-secondary !text-black shadow-sm shadow-secondary/20' 
            : 'text-white/40 hover:bg-white/5 hover:text-white/60'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

export const FilterCTA = ({ 
  title = "PREDAJ OGLAS", 
  description = "Promoviši svoju ponudu na vrhu platforme.", 
  buttonText = "DODAJ OGLAS", 
  onClick, 
  icon = "sell" 
}: { 
  title?: string, 
  description?: string, 
  buttonText?: string, 
  onClick?: () => void,
  icon?: string
}) => (
  <div className="bg-gradient-to-br from-secondary to-yellow-600 p-8 rounded-[10px] shadow-2xl relative overflow-hidden group mt-6 border border-white/5">
    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
      <span className="material-symbols-outlined text-9xl !text-black">{icon}</span>
    </div>
    <h3 className="!text-black font-black text-xl uppercase leading-tight mb-3 relative z-10 italic tracking-tight">{title}</h3>
    <p className="!text-black/70 text-[10px] font-bold mb-6 relative z-10 leading-relaxed uppercase tracking-wide">{description}</p>
    <button
      onClick={onClick}
      className="w-full bg-slate-950 text-secondary font-black py-4 rounded-[10px] text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg block text-center relative z-10"
    >
      {buttonText}
    </button>
  </div>
);
