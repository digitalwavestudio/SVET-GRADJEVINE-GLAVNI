import { OptimizedImage } from '@/src/components/OptimizedImage';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { MACHINE_CATEGORIES } from '@/src/constants/machineTaxonomy';
import { KITCHEN_TYPES, LOCATIONS } from '@/src/constants/taxonomy';
import {
  getAccommodationLink,
  getCateringLink,
  getJobLink,
  getMachineLink,
  getPlotLink,
} from '@/src/lib/routeFilters';

interface CompanyAdsTabsContentProps {
  activeTab: 'jobs' | 'machines' | 'accommodations' | 'catering' | 'realestate' | 'info';
  activeJobs: any[];
  activeMachines: any[];
  activeAccommodations: any[];
  activeCaterings: any[];
  activePlots: any[];
  isLoadingCurrentTab: boolean;
}

export function CompanyAdsTabsContent({
  activeTab,
  activeJobs,
  activeMachines,
  activeAccommodations,
  activeCaterings,
  activePlots,
  isLoadingCurrentTab
}: CompanyAdsTabsContentProps) {
  return (
    <AnimatePresence mode="wait">
      {activeTab === 'jobs' && (
        <motion.div
          key="jobs-tab"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-headline">Aktivni Poslovi</h2>
             <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
          </div>
          {isLoadingCurrentTab ? (
             <div className="text-center py-12"><span className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin inline-block"></span></div>
          ) : activeJobs.length === 0 ? (
            <div className="bg-[#132123]/30 border border-white/5 rounded-[10px] p-12 text-center">
               <span className="material-symbols-outlined text-white/5 text-6xl mb-4 italic font-black">work_off</span>
               <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Firma trenutno nema aktivnih konkrusa</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeJobs.map((job) => (
                 <Link 
                  key={job.id}
                  to={getJobLink(job.id)}
                  className="group block bg-[#132123] hover:bg-[#1a2c2e] border border-white/5 p-8 rounded-[10px] transition-all hover:scale-[1.01] hover:border-[#ffad3a]/30 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffad3a]/5 rounded-full blur-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                       <h3 className="text-2xl font-black text-white group-hover:text-[#ffad3a] transition-colors uppercase tracking-tight mb-2">{job.title}</h3>
                       <div className="flex items-center gap-4 text-white/40 text-[10px] font-black uppercase tracking-widest leading-none">
                         <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-[#ffad3a]">location_on</span> {job.location || job.loc}</span>
                         <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-[#ffad3a]">schedule</span> {job.type}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <div className="text-[#ffad3a] text-xl font-black whitespace-nowrap">€{job.salary || job.sal}</div>
                       <div className="text-white/20 text-[9px] font-black uppercase tracking-widest leading-none">Neto mesečno</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 relative z-10">
                     {job.tags?.slice(0, 4).map((tag: any) => (
                       <span key={tag} className="bg-white/5 text-white/60 px-3 py-1.5 rounded-[10px] text-[9px] font-black uppercase tracking-widest border border-white/5">{tag}</span>
                     ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'machines' && (
        <motion.div
          key="machines-tab"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
             <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-headline">Mehanizacija</h2>
             <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
          </div>
          {isLoadingCurrentTab ? (
             <div className="text-center py-12"><span className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin inline-block"></span></div>
          ) : activeMachines.length === 0 ? (
            <div className="bg-[#132123]/30 border border-white/5 rounded-[10px] p-12 text-center">
               <span className="material-symbols-outlined text-white/5 text-6xl mb-4 italic">construction</span>
               <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Nema aktivnih oglasa za mašine</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeMachines.map(machine => (
                <Link 
                  key={machine.id}
                  to={getMachineLink(machine.id)}
                  className="group block bg-[#132123] rounded-[10px] overflow-hidden border border-white/5 hover:border-[#ffad3a]/30 transition-all shadow-2xl"
                >
                  <div className="h-44 relative overflow-hidden">
                    <OptimizedImage 
                      src={machine.images?.[0]} 
                      fallbackType="machine" 
                      alt={machine.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      containerClassName="w-full h-full"
                      isProcessing={machine.imageStatus === 'processing'}
                    />
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-[10px] text-[10px] font-black uppercase text-white tracking-widest border border-white/10">
                      {machine.adType === 'prodaja' ? 'Prodaja' : 'Najam'}
                    </div>
                  </div>
                  <div className="p-8">
                    <h4 className="text-xl font-black text-white group-hover:text-[#ffad3a] transition-colors line-clamp-1 uppercase tracking-tight mb-2 leading-none">{machine.adTitle}</h4>
                    <p className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-6">
                      {MACHINE_CATEGORIES.find(c => c.id === machine.categoryId)?.name} • {machine.year}
                    </p>
                    <div className="flex justify-between items-center bg-white/5 px-4 py-3 rounded-[10px] border border-white/5">
                      <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Cena na upit / fiksna</span>
                      <span className="text-[#ffad3a] font-black text-lg tracking-tighter">€{machine.price || machine.pricePerDay || '???'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'accommodations' && (
        <motion.div
          key="accomm-tab"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
             <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-headline">Smeštajni Kapaciteti</h2>
             <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
          </div>
          {isLoadingCurrentTab ? (
             <div className="text-center py-12"><span className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin inline-block"></span></div>
          ) : activeAccommodations.length === 0 ? (
            <div className="bg-[#132123]/30 border border-white/5 rounded-[10px] p-12 text-center">
               <span className="material-symbols-outlined text-white/5 text-6xl mb-4 italic">home_work</span>
               <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Firma trenutno ne nudi smeštajne kapacitete</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeAccommodations.map(acc => (
                 <Link 
                  key={acc.id}
                  to={getAccommodationLink(acc.id)}
                  className="group block bg-[#132123] rounded-[10px] overflow-hidden border border-white/5 hover:border-[#ffad3a]/30 transition-all shadow-2xl"
                >
                  <div className="h-44 relative">
                    <OptimizedImage 
                      src={acc.images?.[0]} 
                      fallbackType="accommodation" 
                      alt={acc.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      containerClassName="w-full h-full"
                      isProcessing={acc.imageStatus === 'processing'}
                    />
                    <div className="absolute top-4 left-4 bg-secondary px-4 py-1.5 rounded-[10px] text-[10px] font-black uppercase text-slate-950 tracking-widest shadow-xl">
                      €{acc.price} / {acc.priceType === 'perPerson' ? 'OSOBI' : 'OBJ'}
                    </div>
                  </div>
                  <div className="p-8">
                    <h4 className="text-xl font-black text-white group-hover:text-[#ffad3a] transition-colors line-clamp-1 uppercase tracking-tighter mb-4 leading-none">{acc.title}</h4>
                    <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-[#ffad3a]">bed</span> {acc.totalBeds} KREVETA</span>
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-[#ffad3a]">location_on</span> {LOCATIONS.find(l => l.slug === acc.locationSlug)?.name}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'catering' && (
        <motion.div
          key="catering-tab"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
             <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-headline">Hrana i Ketering</h2>
             <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
          </div>
          {isLoadingCurrentTab ? (
             <div className="text-center py-12"><span className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin inline-block"></span></div>
          ) : activeCaterings.length === 0 ? (
            <div className="bg-[#132123]/30 border border-white/5 rounded-[10px] p-12 text-center">
               <span className="material-symbols-outlined text-white/5 text-6xl mb-4 italic">restaurant</span>
               <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Nema aktivnih menija za radnike</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeCaterings.map(cat => (
                 <Link 
                  key={cat.id}
                  to={getCateringLink(cat.id)}
                  className="group block bg-[#132123] rounded-[10px] overflow-hidden border border-white/5 hover:border-[#ffad3a]/30 transition-all shadow-2xl"
                >
                  <div className="h-44 relative">
                    <OptimizedImage 
                      src={cat.images?.[0]} 
                      fallbackType="catering" 
                      alt={cat.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      containerClassName="w-full h-full"
                      isProcessing={cat.imageStatus === 'processing'}
                    />
                    <div className="absolute top-4 left-4 bg-emerald-500 px-4 py-1.5 rounded-[10px] text-[10px] font-black uppercase text-black tracking-widest shadow-xl">
                      {cat.pricePerMeal} RSD / OBROK
                    </div>
                  </div>
                  <div className="p-8">
                    <h4 className="text-xl font-black text-white group-hover:text-[#ffad3a] transition-colors line-clamp-1 uppercase tracking-tighter mb-2 leading-none">{cat.title}</h4>
                    <p className="text-white/30 text-[10px] uppercase font-black tracking-[0.2em] mb-4">DOSTAVA: {cat.deliveryZone}</p>
                    <div className="flex gap-2">
                      <span className="bg-white/5 px-3 py-1 rounded-[10px] text-[9px] font-black text-white/60 uppercase tracking-widest">{KITCHEN_TYPES.find(k => k.id === cat.kitchenType)?.name || 'Ketering'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'realestate' && (
        <motion.div
          key="realestate-tab"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-8"
        >
          <div className="flex items-center justify-between">
             <h2 className="text-3xl font-black uppercase tracking-tighter text-white font-headline">Nekretnine i Placevi</h2>
             <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
          </div>
          {isLoadingCurrentTab ? (
             <div className="text-center py-12"><span className="w-8 h-8 rounded-full border-2 border-secondary border-t-transparent animate-spin inline-block"></span></div>
          ) : activePlots.length === 0 ? (
            <div className="bg-[#132123]/30 border border-white/5 rounded-[10px] p-12 text-center">
               <span className="material-symbols-outlined text-white/5 text-6xl mb-4 italic">landscape</span>
               <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">Firma trenutno nema oglašene nekretnine</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activePlots.map(plot => (
                 <Link 
                  key={plot.id}
                  to={getPlotLink(plot.id)}
                  className="group block bg-[#132123] rounded-[10px] overflow-hidden border border-white/5 hover:border-[#ffad3a]/30 transition-all shadow-2xl"
                >
                  <div className="h-44 relative">
                    <OptimizedImage 
                      src={plot.images?.[0]} 
                      fallbackType="real_estate" 
                      alt={plot.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      containerClassName="w-full h-full"
                      isProcessing={plot.imageStatus === 'processing'}
                    />
                    <div className="absolute top-4 left-4 bg-[#ffad3a] px-4 py-1.5 rounded-[10px] text-[10px] font-black uppercase text-black tracking-widest shadow-xl">
                      €{plot.price}
                    </div>
                  </div>
                  <div className="p-8">
                    <h4 className="text-xl font-black text-white group-hover:text-[#ffad3a] transition-colors line-clamp-1 uppercase tracking-tighter mb-4 leading-none">{plot.title}</h4>
                    <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-white/40">
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-[#ffad3a]">aspect_ratio</span> {plot.area} {plot.areaUnit}</span>
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm text-[#ffad3a]">location_on</span> {LOCATIONS.find(l => l.slug === plot.locationSlug)?.name || plot.locationSlug}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
