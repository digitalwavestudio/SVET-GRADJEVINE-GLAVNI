import React from 'react';
import { motion } from 'motion/react';

interface CompanyInfoTabProps {
  company: any;
}

export function CompanyInfoTab({ company }: CompanyInfoTabProps) {
  return (
    <motion.div
      key="info-tab"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-10 md:space-y-16"
    >
      {/* O NAMA */}
      <section>
        <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-600 font-headline">O Kompaniji</h2>
           <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
        </div>
        <div className="bg-gradient-to-br from-[#111A22]/90 to-[#050B10]/90 border border-white/5 rounded-2xl p-6 md:p-14 relative overflow-hidden backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
          <p className="text-white/90 text-base md:text-xl leading-relaxed font-medium mb-8 md:mb-12 whitespace-pre-wrap relative z-10">
            {company.description}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10 mt-8 md:mt-12 pt-8 md:pt-12 border-t border-white/5">

            {company.workingHours && (
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40"><span className="material-symbols-outlined">schedule</span></div>
                <div><p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Radno Vreme</p><p className="text-white font-black">{company.workingHours}</p></div>
              </div>
            )}
            {company.instagram && (
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400"><span className="material-symbols-outlined">photo_camera</span></div>
                <div><p className="text-[10px] font-black uppercase tracking-widest text-pink-400/60 mb-1">Instagram</p><a href={company.instagram} target="_blank" rel="noreferrer" className="text-white font-black hover:text-pink-400 transition-colors line-clamp-1">{company.instagram}</a></div>
              </div>
            )}
          </div>
        </div>
        </section>
    </motion.div>
  );
}
