import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { COMPANY_EMPLOYEE_RANGES } from '@/src/constants/companyTaxonomy';
import { LOCATIONS } from '@/src/constants/taxonomy';

interface CompanyHeroSectionProps {
  company: any;
  isTrackedInSession?: boolean;
}

export function CompanyHeroSection({ company, isTrackedInSession }: CompanyHeroSectionProps) {
  return (
    <section className="relative w-full h-[40vh] md:h-[50vh] min-h-[400px] overflow-hidden">
      {company.coverImage ? (
        <OptimizedImage 
          src={company.coverImage} 
          fallbackType="default" 
          alt={company.name || "Cover slika"} 
          className="w-full h-full object-cover" 
          containerClassName="w-full h-full"
        /> 
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#121b24] via-[#0b1218] to-[#05090d]"></div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1923] via-[#0F1923]/60 to-transparent"></div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-4 md:gap-8">
          {/* Logo Area */}
          <div className="relative z-10 shrink-0 mb-4 md:mb-0">
            <div className="w-32 h-32 md:w-48 md:h-48 bg-white p-4 rounded-[10px] shadow-2xl border-4 border-[#0F1923] flex items-center justify-center overflow-hidden">
              {company.logo ? (
                <img width="800" height="600" decoding="async" src={company.logo} alt="Logo" className="w-full h-full object-contain" loading="lazy" />
              ) : (
                <span className="text-4xl md:text-6xl font-black text-slate-950">{company.name?.charAt(0) || 'C'}</span>
              )}
            </div>
            {company.isPremiumPartner && (
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-secondary rounded-full border-4 border-[#0F1923] flex items-center justify-center shadow-lg" title="Premium Partner">
                <span className="material-symbols-outlined text-slate-950 font-black text-sm">workspace_premium</span>
              </div>
            )}
          </div>

          {/* Title Area */}
          <div className="flex-1 pb-4">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {company.isVerified ? (
                <span className="px-3 py-1.5 bg-[#0A1A0F]/90 border border-green-500/30 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-[6px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  VERIFIKOVAN
                </span>
              ) : (
                <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-[6px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">pending</span>
                  PROFIL U FAZI PROVERE
                </span>
              )}
              <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-[6px] flex items-center gap-1.5 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                {LOCATIONS.find(l => l.slug === company.locationSlug)?.name || 'Srbija'}
              </span>
            </div>
            <h1 id="company-title" className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-none text-white drop-shadow-2xl">
              {company.name}
            </h1>
            <div className="mt-4 flex items-center gap-6 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] flex-wrap">
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                OSNOVANO: {company.companyFoundedYear || 'N/A'}
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">visibility</span>
                PREGLEDA: {(company.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}
              </span>
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">group</span>
                ZAPOSLENIH: {COMPANY_EMPLOYEE_RANGES.find(r => r.id === company.employeeCount)?.name || 'N/A'}
              </span>
            </div>
          </div>

          {/* Top CTA */}
          <div className="hidden lg:block pb-5">
             <a 
               href={`tel:${company.phone}`}
               className="flex h-16 items-center gap-4 bg-secondary text-slate-950 px-8 rounded-[10px] font-black text-xs tracking-[0.2em] uppercase hover:bg-yellow-400 transition-all hover:scale-105 active:scale-95 shadow-2xl"
             >
               <span className="material-symbols-outlined font-black">call</span>
               KONTAKTIRAJ FIRMU
             </a>
          </div>
        </div>
      </div>
    </section>
  );
}
