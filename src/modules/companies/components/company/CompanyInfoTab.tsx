import { OptimizedImage } from '@/src/components/OptimizedImage';
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
      className="space-y-16"
    >
      {/* O NAMA */}
      <section>
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-headline">O Kompaniji</h2>
           <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
        </div>
        <div className="bg-gradient-to-br from-[#111A22]/90 to-[#050B10]/90 border border-white/5 rounded-2xl p-10 md:p-14 relative overflow-hidden backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-secondary/10 rounded-full blur-[100px] pointer-events-none"></div>
          <p className="text-white text-xl md:text-2xl leading-relaxed font-black tracking-tight mb-12 whitespace-pre-wrap relative z-10 italic drop-shadow-md">
            "{company.description}"
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mt-12 pt-12 border-t border-white/5">

            {company.workingHours && (
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white/40"><span className="material-symbols-outlined">schedule</span></div>
                <div><p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Radno Vreme</p><p className="text-white font-black">{company.workingHours}</p></div>
              </div>
            )}
            {company.facebook && (
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400"><span className="material-symbols-outlined">thumb_up</span></div>
                <div><p className="text-[10px] font-black uppercase tracking-widest text-blue-400/60 mb-1">Facebook</p><a href={company.facebook} target="_blank" rel="noreferrer" className="text-white font-black hover:text-blue-400 transition-colors line-clamp-1">{company.facebook}</a></div>
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

       <section className="space-y-12 mt-16">
           <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-headline">Vizuelni Arhiv</h2>
              <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
           </div>
           
           {company.companyPortfolioImages && company.companyPortfolioImages.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {company.companyPortfolioImages?.map((img: string, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="group relative aspect-square rounded-[10px] overflow-hidden border border-white/10 shadow-2xl"
                  >
                    <OptimizedImage 
                      src={img} 
                      fallbackType="company" 
                      alt={`Portfolio slika ${idx + 1}`} 
                      className="w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-110" 
                      containerClassName="w-full h-full"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black via-black/60 to-transparent z-20">
                       <p className="text-[10px] font-black text-white uppercase tracking-[0.3em]">B2B Dokumentacija</p>
                    </div>
                  </motion.div>
                ))}
             </div>
           ) : (
             <div className="bg-white/[0.02] border border-white/5 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-white/20 mb-4 block">hide_image</span>
                <p className="text-white/40 font-black tracking-widest uppercase text-xs">Ova firma još uvek nije dodala slike u svoj portfolio.</p>
             </div>
           )}
        </section>
    </motion.div>
  );
}
