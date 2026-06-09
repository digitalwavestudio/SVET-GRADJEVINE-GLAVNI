import React from 'react';
import { motion } from 'motion/react';
import { usePremiumPartners } from '@/src/modules/core/hooks/usePremiumPartners';

export default function TrustSection() {
  const { data: partners = [], isLoading: loading } = usePremiumPartners();

  const displayPartners = partners;

  return (
    <section className="bg-transparent py-16 border-t border-white/5 overflow-hidden min-h-[300px] flex flex-col justify-center">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 w-full">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-slate-500 text-center font-bold text-[10px] uppercase tracking-[0.4em] mb-12"
        >
          Poverenje su nam ukazali lideri industrije
        </motion.p>
        
        <div className="relative group">
          {/* Fading Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-[#0F1923] to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-[#0F1923] to-transparent z-10"></div>

          <div className="flex overflow-hidden">
            <motion.div 
              animate={displayPartners.length > 0 ? { x: ["0%", "-50%"] } : {}}
              transition={{ 
                duration: 40, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="flex items-center gap-16 px-8 flex-nowrap w-fit"
            >
              {/* Double mapping for infinite scroll effect */}
              {[...displayPartners, ...displayPartners].map((partner, idx) => (
                <div 
                  key={`${partner.id}-${idx}`}
                  className="flex items-center gap-4 group/item grayscale hover:grayscale-0 transition-all duration-500 opacity-30 hover:opacity-100 cursor-pointer flex-shrink-0"
                >
                  {partner.logo ? (
                    <img 
                      src={partner.logo} 
                      alt={partner.name} 
                      className="h-8 md:h-10 w-auto object-contain filter brightness-200"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-white text-3xl opacity-50 group-hover/item:text-secondary">business</span>
                      <span className="text-white font-headline font-black text-xl md:text-3xl tracking-tighter italic uppercase whitespace-nowrap">
                        {partner.name}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Placeholder static fallback if no partners but loading (visual consistency) */}
              {loading && [1,2,3,4,5].map(i => (
                <div key={i} className="h-8 w-32 bg-white/5 rounded-[10px] animate-pulse"></div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
