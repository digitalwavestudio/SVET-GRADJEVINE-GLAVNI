import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { Link } from 'react-router-dom';

interface JobsFeaturedCompaniesProps {
  companies: any[];
  getInitials: (name: string) => string;
}

export const JobsFeaturedCompanies: React.FC<JobsFeaturedCompaniesProps> = ({ companies, getInitials }) => {
  return (
    <section className="py-20 relative overflow-hidden bg-[#0a0f14]">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-secondary/10 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/[0.03] via-transparent to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-8 relative z-10 mb-16">
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 md:w-24 bg-gradient-to-r from-transparent via-secondary/50 to-secondary"></div>
            <div className="w-3 h-3 bg-secondary rotate-45 shadow-[0_0_15px_rgba(254,191,13,0.5)]"></div>
            <div className="h-[1px] w-12 md:w-24 bg-gradient-to-l from-transparent via-secondary/50 to-secondary"></div>
          </div>
          <h2 className="text-center text-4xl md:text-5xl font-headline font-black uppercase tracking-tighter text-white">
            Istaknuti <span className="text-secondary drop-shadow-[0_0_10px_rgba(254,191,13,0.3)]">poslodavci</span>
          </h2>
        </div>
      </div>
      
      <div className="overflow-hidden relative w-full z-10">
        {/* Fade edges */}
        <div className="absolute top-0 bottom-0 left-0 w-24 md:w-64 bg-gradient-to-r from-[#0a0f14] via-[#0a0f14]/90 to-transparent z-20 pointer-events-none"></div>
        <div className="absolute top-0 bottom-0 right-0 w-24 md:w-64 bg-gradient-to-l from-[#0a0f14] via-[#0a0f14]/90 to-transparent z-20 pointer-events-none"></div>
        
        <div className="flex gap-8 md:gap-10 animate-[scroll_90s_linear_infinite] hover:[animation-play-state:paused] w-max px-12 py-12 group">
          {companies.map((company, idx) => (
            <Link to={company.id ? `/firma/${company.id}` : `/firme`} key={idx} className="relative w-[280px] md:w-[340px] shrink-0 group/employer block">
              <div className="bg-[#111a22] rounded-[10px] border border-secondary/30 transition-all duration-500 overflow-hidden flex flex-col h-full shadow-[0_0_30px_rgba(254,191,13,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.1)] hover:border-white/40 group-hover/employer:-translate-y-3">
                {/* Cover Image */}
                <div className="relative h-32 w-full overflow-hidden bg-slate-900 border-b border-white/10">
                  <OptimizedImage 
                    src={company.logo || company.images?.[0]} 
                    fallbackType="company" 
                    alt={company.name || "Kompanija"} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 mix-blend-overlay" 
                    containerClassName="w-full h-full"
                  /> 
                    
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111a22] via-[#111a22]/50 to-transparent"></div>
                </div>
                
                {/* Content */}
                <div className="relative px-6 pb-6 flex flex-col flex-grow -mt-10 z-10">
                  {/* Logo & Rating */}
                  <div className="flex items-end justify-between mb-4">
                    <div className="w-20 h-20 bg-[#0a0f14] rounded-[10px] flex items-center justify-center p-2.5 border-4 border-secondary/20 shadow-xl overflow-hidden shrink-0 group-hover/employer:border-white/40 transition-all duration-500">
                      {company.logo ? (
                         <img width="800" height="600" decoding="async" src={company.logo} alt="Logo" className="w-full h-full object-contain" loading="lazy" />
                      ) : (
                         <div className="w-full h-full bg-slate-950/20 rounded flex items-center justify-center text-slate-400 font-black text-2xl">{getInitials(company.name)}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Name */}
                  <div className="mb-10">
                    <h3 className="text-xl font-black font-headline text-secondary uppercase tracking-tight group-hover/employer:text-white transition-colors line-clamp-1">{company.name}</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 group-hover/employer:text-secondary transition-colors">{company.website}</p>
                  </div>
                  
                  {/* Button */}
                  <button className="w-full py-3 rounded-[10px] bg-gradient-to-br from-secondary to-yellow-600 text-slate-950 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:from-white hover:to-slate-300 transition-all duration-500 group/btn">
                    Pogledaj profil
                    <span className="material-symbols-outlined text-[16px] group-hover/btn:translate-x-1 transition-transform duration-500">arrow_forward</span>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
