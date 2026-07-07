import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { Link } from 'react-router-dom';

interface JobsFeaturedCompaniesProps {
  companies: any[];
  getInitials: (name: string) => string;
}

export const JobsFeaturedCompanies: React.FC<JobsFeaturedCompaniesProps> = ({ companies, getInitials }) => {
  return (
    <section className="py-20 relative overflow-hidden bg-transparent">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-secondary/10 to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-secondary/[0.03] via-transparent to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-8 relative z-10 mb-16">
  
      </div>
      
      <div className="overflow-hidden relative w-full z-10">
        
        <div className="flex gap-8 md:gap-10 animate-[scroll_90s_linear_infinite] hover:[animation-play-state:paused] w-max px-12 py-12 group">
          {companies.map((company, idx) => (
            <Link to={company.id ? `/firma/${company.id}` : `/firme`} key={idx} className="relative w-[280px] md:w-[340px] shrink-0 group/employer block">
              <div className="bg-surface rounded-2xl border border-white/5 transition-all duration-500 overflow-hidden flex flex-col h-full hover:bg-surface-variant hover:border-white/10 group-hover/employer:-translate-y-2 group-hover/employer:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
                {/* Cover Image */}
                <div className="relative h-32 w-full overflow-hidden bg-background border-b border-white/5">
                  <OptimizedImage 
                    src={company.logo || company.images?.[0]} 
                    fallbackType="company" 
                    alt={company.name || "Kompanija"} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 mix-blend-overlay" 
                    containerClassName="w-full h-full"
                  /> 
                    
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/50 to-transparent"></div>
                </div>
                
                {/* Content */}
                <div className="relative px-6 pb-6 flex flex-col flex-grow -mt-10 z-10">
                  {/* Logo & Rating */}
                  <div className="flex items-end justify-between mb-4">
                    <div className="w-20 h-20 bg-background rounded-xl flex items-center justify-center p-2 border border-white/10 shadow-xl overflow-hidden shrink-0 group-hover/employer:border-white/20 transition-all duration-500">
                      {company.logo ? (
                         <img width="800" height="600" decoding="async" src={company.logo} alt="Logo" className="w-full h-full object-contain" loading="lazy" />
                      ) : (
                         <div className="w-full h-full bg-slate-950/20 rounded flex items-center justify-center text-slate-400 font-black text-2xl">{getInitials(company.name)}</div>
                      )}
                    </div>
                  </div>
                  
                  {/* Name */}
                  <div className="mb-8">
                    <h3 className="text-lg font-black font-headline text-white uppercase tracking-tight group-hover/employer:text-secondary transition-colors line-clamp-1">{company.name}</h3>
                    <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-[0.2em] mt-1 group-hover/employer:text-white/60 transition-colors">{company.website || 'PROFIL KOMPANIJE'}</p>
                  </div>
                  
                  {/* Button */}
                  <button className="w-full py-2.5 rounded-lg bg-white/5 border border-white/5 text-white flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all duration-300 group/btn mt-auto">
                    Pogledaj profil
                    <span className="material-symbols-outlined text-[16px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
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
