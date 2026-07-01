import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { COMPANY_EMPLOYEE_RANGES } from '@/src/constants/companyTaxonomy';
import { LOCATIONS } from '@/src/constants/taxonomy';
import { motion } from 'motion/react';

interface CompanyHeroSectionProps {
  company: any;
  isTrackedInSession?: boolean;
}

export function CompanyHeroSection({ company, isTrackedInSession }: CompanyHeroSectionProps) {
  return (
    <section className="relative w-full h-[45vh] md:h-[55vh] min-h-[450px] overflow-hidden">
      {/* Cover slika */}
      <motion.div 
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0"
      >
        {company.coverImage ? (
          <OptimizedImage 
            src={company.coverImage} 
            fallbackType="default" 
            alt={company.name || "Cover slika"} 
            className="w-full h-full object-cover" 
            containerClassName="w-full h-full"
          /> 
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0a111a] via-[#111a24] to-[#1a2533]"></div>
        )}
      </motion.div>
      
      {/* Preko sloj sa gradientom */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a111a] via-[#0a111a]/70 to-transparent"></div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-12 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end gap-6 md:gap-10">
          
          {/* Logo Area */}
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            className="relative shrink-0 mb-2 md:mb-0"
          >
            <div className="w-36 h-36 md:w-52 md:h-52 bg-white p-4 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 border-[#0a111a] flex items-center justify-center overflow-hidden group">
              {company.logo ? (
                <img width="800" height="600" decoding="async" src={company.logo} alt="Logo" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" loading="lazy" />
              ) : (
                <span className="text-5xl md:text-7xl font-black text-gray-200">{company.name?.charAt(0) || 'C'}</span>
              )}
            </div>
            {company.isPremiumPartner && (
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-secondary to-yellow-500 rounded-full border-4 border-[#0a111a] flex items-center justify-center shadow-[0_0_20px_rgba(254,191,13,0.4)]" title="Premium Partner">
                <span className="material-symbols-outlined !text-black font-black text-lg">stars</span>
              </div>
            )}
          </motion.div>

          {/* Title Area */}
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
            className="flex-1 pb-4"
          >
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {company.isVerified ? (
                <span className="px-3.5 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.1)] backdrop-blur-md">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                  Verifikovan Partner
                </span>
              ) : (
                <span className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-2 backdrop-blur-md">
                  <span className="material-symbols-outlined text-[14px]">pending</span>
                  Profil u obradi
                </span>
              )}
              <span className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-white/50 text-[10px] font-black uppercase tracking-widest rounded-md flex items-center gap-2 backdrop-blur-md">
                <span className="material-symbols-outlined text-[14px]">location_on</span>
                {LOCATIONS.find(l => l.slug === company.locationSlug)?.name || 'Srbija'}
              </span>
            </div>
            
            <h1 id="company-title" className="text-4xl md:text-6xl lg:text-7xl font-black font-headline tracking-tight uppercase leading-none text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
              {company.name}
            </h1>
            
            <div className="mt-6 flex items-center gap-8 text-white/40 text-[11px] font-bold uppercase tracking-[0.15em] flex-wrap">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#ffad3a]">visibility</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Pregleda: <span className="text-white">{(company.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}</span></span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
