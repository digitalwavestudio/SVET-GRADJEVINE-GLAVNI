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
        <div className="bg-[#132123]/30 border border-white/5 rounded-[10px] p-10 md:p-14 relative overflow-hidden backdrop-blur-3xl shadow-2xl">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#ffad3a]/5 rounded-full blur-[100px] pointer-events-none"></div>
          <p className="text-white text-xl md:text-2xl leading-relaxed font-black tracking-tight mb-12 whitespace-pre-wrap relative z-10 italic uppercase stroke-text">
            "{company.description}"
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
             <div className="bg-white/[0.03] p-10 rounded-[10px] border border-white/5 group hover:bg-white/[0.05] transition-all">
               <div className="text-[10px] text-[#ffad3a] font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                 <span className="material-symbols-outlined text-lg">engineering</span> Specijalnosti Tima
               </div>
               <div className="flex flex-wrap gap-2">
                 {company.teamSpecialties?.length ? company.teamSpecialties.map((s: string) => (
                   <span key={s} className="bg-[#0f1923] text-white/70 px-4 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest border border-white/10 group-hover:border-[#ffad3a]/30 transition-all">{s}</span>
                 )) : <span className="text-white/20 text-[10px] uppercase font-black italic tracking-widest">Nije specificirano</span>}
               </div>
             </div>
             <div className="bg-white/[0.03] p-10 rounded-[10px] border border-white/5 group hover:bg-white/[0.05] transition-all">
               <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.4em] mb-8 flex items-center gap-2">
                 <span className="material-symbols-outlined text-lg">precision_manufacturing</span> Mehanizacija
               </div>
               <p className="text-xs font-black text-white/50 uppercase leading-relaxed tracking-widest">
                 {company.equipmentSummary || 'Nema upisanih podataka o dostupnoj mehanizaciji kompanije.'}
               </p>
             </div>
          </div>
        </div>
      </section>

      {/* REFERENCE & PORTFOLIO */}
      {((company.portfolioImages && company.portfolioImages.length > 0) || (company.references && company.references.length > 0)) && (
        <section className="space-y-12">
           <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-headline">Vizuelni Arhiv</h2>
              <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {company.portfolioImages?.map((img: string, idx: number) => (
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

           {company.references && company.references.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {company.references.map((ref: string, idx: number) => (
                   <div key={idx} className="bg-white/5 p-8 rounded-[10px] border border-white/5 group hover:bg-white/[0.08] transition-all flex items-center gap-6">
                      <div className="w-16 h-16 bg-[#ffad3a]/10 rounded-[10px] flex items-center justify-center text-[#ffad3a] shrink-0">
                         <span className="material-symbols-outlined text-3xl">done_all</span>
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none mb-2">{ref}</h4>
                         <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Verifikovana referenca klijenta</p>
                      </div>
                   </div>
                 ))}
              </div>
           )}

           {/* LICENCE */}
           {((company.licenses && company.licenses.length > 0) || (company.certifications && company.certifications.length > 0)) && (
              <div className="bg-[#0A0F14] p-12 rounded-[10px] border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                     <h3 className="text-[9px] font-black text-[#ffad3a] tracking-[0.4em] uppercase">Sertifikati i Akreditacije</h3>
                     <div className="space-y-3">
                        {company.certifications?.map((c: string) => (
                          <div key={c} className="bg-white/5 px-4 py-3 rounded-[10px] border border-white/5 text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-3">
                            <span className="material-symbols-outlined text-sm text-blue-400">verified</span> {c}
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-[9px] font-black text-blue-400 tracking-[0.4em] uppercase">Pravne Licence</h3>
                     <div className="space-y-3">
                        {company.licenses?.map((l: string) => (
                          <div key={l} className="bg-white/5 px-4 py-3 rounded-[10px] border border-white/5 text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-3">
                            <span className="material-symbols-outlined text-sm text-[#ffad3a]">approval_delegation</span> {l}
                          </div>
                        ))}
                     </div>
                  </div>
              </div>
           )}
        </section>
      )}
    </motion.div>
  );
}
