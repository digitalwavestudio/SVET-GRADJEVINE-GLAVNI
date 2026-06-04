import React from 'react';

export function JobStatsBar() {
  return (
    <div className="bg-secondary py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between gap-8 text-on-secondary">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <span className="text-2xl font-black font-headline">500+</span>
          <span className="text-sm font-bold uppercase tracking-wide">Aktivnih Oglasa</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <span className="text-2xl font-black font-headline">10k+</span>
          <span className="text-sm font-bold uppercase tracking-wide">Mesečnih Poseta</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <span className="text-2xl font-black font-headline">2k+</span>
          <span className="text-sm font-bold uppercase tracking-wide">Registrovanih Firmi</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3">
          <span className="text-2xl font-black font-headline">100%</span>
          <span className="text-sm font-bold uppercase tracking-wide">Građevinski Sektor</span>
        </div>
      </div>
    </div>
  );
}
