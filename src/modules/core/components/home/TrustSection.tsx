import React from 'react';
import { usePremiumPartners } from '@/src/modules/core/hooks/usePremiumPartners';

export default function TrustSection() {
  const { data: partners = [], isLoading: loading } = usePremiumPartners();

  const displayPartners = partners;

  return (
    <section className="bg-transparent py-16 border-t border-white/5 overflow-hidden min-h-[300px] flex flex-col justify-center">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 w-full">
        <div className="flex items-center gap-4 sm:gap-6 justify-center mb-16 relative z-20">
          <div className="h-[1px] w-8 sm:w-16 md:w-24 bg-gradient-to-r from-transparent to-white/20"></div>
          <p className="text-white/40 font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.5em] leading-none text-center">
            Poverenje su nam ukazali lideri industrije
          </p>
          <div className="h-[1px] w-8 sm:w-16 md:w-24 bg-gradient-to-l from-transparent to-white/20"></div>
        </div>
        
        <div className="relative group">
          {/* Fading Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-[#0F1923] to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-[#0F1923] to-transparent z-10"></div>

          <div className="flex overflow-hidden">
            <div 
              className="flex items-center gap-16 px-8 flex-nowrap w-fit animate-marquee"
            >
              {/* Double mapping for infinite scroll effect */}
              {[...displayPartners, ...displayPartners].map((partner, idx) => (
                <div 
                  key={`${partner.id}-${idx}`}
                  className="flex items-center gap-4 group/item grayscale hover:grayscale-0 transition-all duration-500 opacity-40 hover:opacity-100 cursor-pointer flex-shrink-0 hover:drop-shadow-[0_0_15px_rgba(254,191,13,0.3)]"
                >
                  {partner.logo ? (
                    <img 
                      src={partner.logo} 
                      alt={partner.name} 
                      width="160" height="40"
                      loading="lazy"
                      decoding="async"
                      className="h-8 md:h-10 w-auto object-contain filter brightness-200"
                    />
                  ) : (
                    <span className="text-white/60 font-headline font-black text-2xl md:text-3xl tracking-tighter uppercase whitespace-nowrap group-hover/item:text-white transition-colors duration-500">
                      {partner.name}
                    </span>
                  )}
                </div>
              ))}

              {/* Placeholder static fallback if no partners but loading (visual consistency) */}
              {loading && [1,2,3,4,5].map(i => (
                <div key={i} className="h-8 w-32 bg-white/5 rounded-[10px] animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
