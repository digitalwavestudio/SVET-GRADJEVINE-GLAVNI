import React from 'react';
import { Link } from 'react-router-dom';
import { LOCATIONS } from '@/src/constants/taxonomy';

interface RelatedSEOProps {
  locationSlug?: string;
  currentType: 'jobs' | 'masters' | 'companies' | 'accommodation' | 'machines' | 'catering' | 'plots';
}

export const RelatedSEO: React.FC<RelatedSEOProps> = ({ locationSlug, currentType }) => {
  if (!locationSlug) return null;
  
  const cityName = LOCATIONS.find(l => l.slug === locationSlug)?.name || 'Srbija';
  
  const links = [
    { type: 'jobs', label: `Poslovi u mestu ${cityName}`, path: `/poslovi/${locationSlug}`, icon: 'work' },
    { type: 'masters', label: `Majstori u mestu ${cityName}`, path: `/majstori/${locationSlug}`, icon: 'engineering' },
    { type: 'companies', label: `Firme u mestu ${cityName}`, path: `/firme/${locationSlug}`, icon: 'business' },
    { type: 'accommodation', label: `Smeštaj u mestu ${cityName}`, path: `/smestaj/${locationSlug}`, icon: 'home_work' },
    { type: 'machines', label: `Mašine u mestu ${cityName}`, path: `/masine/${locationSlug}`, icon: 'construction' },
    { type: 'catering', label: `Ketering u mestu ${cityName}`, path: `/ketering/${locationSlug}`, icon: 'restaurant' },
    { type: 'plots', label: `Placevi u mestu ${cityName}`, path: `/placevi/${locationSlug}`, icon: 'landscape' },
  ].filter(link => link.type !== currentType);

  return (
    <section className="mt-20 pt-20 border-t border-white/5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Povezano sa ovom lokacijom</h3>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Istražite ostale resurse u mestu {cityName}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link, idx) => (
          <Link 
            key={idx}
            to={link.path}
            className="group flex items-center gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-[10px] hover:bg-white/[0.05] hover:border-secondary/30 transition-all"
          >
            <div className="w-12 h-12 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 group-hover:text-secondary group-hover:bg-secondary/10 transition-all">
              <span className="material-symbols-outlined">{link.icon}</span>
            </div>
            <div>
              <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Pretraga</div>
              <div className="text-[11px] font-black text-white uppercase tracking-tight group-hover:text-secondary transition-colors">{link.label}</div>
            </div>
            <span className="material-symbols-outlined ml-auto text-white/10 group-hover:text-secondary transition-all group-hover:translate-x-1">chevron_right</span>
          </Link>
        ))}
      </div>
    </section>
  );
};
