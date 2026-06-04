import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { APP_CONFIG } from '@/src/constants/config';
import { RelatedSEO } from '@/src/components/RelatedSEO';


interface JobHeroSectionProps {
  jobData: any;
  isSaved: boolean;
  isLoggedIn: boolean;
  isTrackedInSession?: boolean;
  toggleSavedJob: (id: string) => void;
  setShowReportModal: (show: boolean) => void;
  navigate: (path: string) => void;
  handleStartChat: () => void;
}

export function JobHeroSection({
  jobData,
  isSaved,
  isLoggedIn,
  isTrackedInSession,
  toggleSavedJob,
  setShowReportModal,
  navigate,
  handleStartChat
}: JobHeroSectionProps) {
  return (
    <section className="relative bg-surface overflow-hidden border-b border-outline-variant/10">
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 grayscale pointer-events-none"
      >
        <img width="800" height="600" decoding="async" className="w-full h-full object-cover" alt="industrial construction site" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD400YDs9TyFVnmURuGN6nhOpLn6mGUXbvNBgPLdDLd0AstUDEbR1mcOzUBMcnQ4hicquqY4RAwBPtNoxCoxe9150sC2erDLFvP4TTefadonci9XTw_vh6FdqpHllkYibyPNNNsCNMl8l7q17-UB7r1U8ZJ7ATe9zHzuW30w0OhCU9PCnEoFABMzyhbXaJbj6NusJK1M_zx09Q1hj-SrHxXljhf20_SwxyQ3o1s6OOOJxmVzM9SgF2IPStMmi2ItJoUl6sAnoS2zA9p" fetchPriority="high" />
      </motion.div>
      <motion.div 
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-7xl mx-auto px-8 py-16 relative z-10 flex flex-col md:flex-row gap-12 items-start"
      >
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-6">
            {jobData.isActive && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/30">AKTIVAN OGLAS</span>}
            {jobData.isUrgent && <span className="bg-error/20 text-error text-[10px] font-black px-3 py-1 rounded-full border border-error/30">HITNO</span>}
            {jobData.isPremium && <span className="bg-secondary/20 text-secondary text-[10px] font-black px-3 py-1 rounded-full border border-secondary/30">PREMIUM</span>}
            <span className="bg-white/5 text-white/60 text-[10px] font-black px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[14px] text-secondary">visibility</span>
              {(jobData.viewsCount || 0) + (isTrackedInSession ? 1 : 0)} PREGLEDA
            </span>
            <span className="bg-white/5 text-white/60 text-[10px] font-black px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-sm">
              <span className="material-symbols-outlined text-[14px] text-blue-400">group</span>
              {jobData.applicantsCount || 0} PRIJAVA
            </span>
          </div>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-4">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl md:text-5xl font-black text-white font-headline leading-tight uppercase">
                {jobData.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[11px] font-black text-white/40 tracking-widest h-fit">
                  <span className="material-symbols-outlined text-[16px] text-secondary">visibility</span>
                  {(jobData.viewsCount || 0) + (isTrackedInSession ? 1 : 0)}
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[11px] font-black text-white/40 tracking-widest h-fit">
                  <span className="material-symbols-outlined text-[16px] text-blue-400">group</span>
                  {jobData.applicantsCount || 0}
                </div>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button 
                onClick={() => setShowReportModal(true)}
                className="w-12 h-12 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center text-red-500 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-all shadow-sm" title="Prijavi oglas" aria-label="Prijavi oglas">
                <span className="material-symbols-outlined">flag</span>
              </button>
              <button 
                onClick={() => jobData?.id && toggleSavedJob(jobData.id)}
                className="w-12 h-12 rounded-full bg-surface-container-high border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/5 hover:border-white/20 transition-all shadow-sm" title={isSaved ? "Ukloni iz sačuvanih" : "Sačuvaj oglas"} aria-label="Sačuvaj oglas">
                <span className="material-symbols-outlined" style={isSaved ? { fontVariationSettings: "'FILL' 1", color: '#ffb300' } : {}}>{isSaved ? 'bookmark' : 'bookmark_border'}</span>
              </button>
              <button className="w-12 h-12 rounded-[10px] bg-surface-container-high border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-white hover:bg-white/5 hover:border-white/20 transition-all shadow-sm" title="Podeli oglas" aria-label="Podeli oglas">
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 text-secondary font-bold text-xl">
              <span className="material-symbols-outlined">domain</span>
              {jobData.companyId ? (
                <Link to={`/firma/${jobData.companyId}`} className="hover:underline">
                  {jobData.company}
                </Link>
              ) : (
                <span>{jobData.company}</span>
              )}
            </div>
            {jobData.isCompanyVerified && (
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-[10px] text-[11px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                Verifikovan Poslodavac
              </div>
            )}
          </div>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="flex items-center gap-3 bg-secondary/10 border border-secondary/30 px-5 py-3 rounded-[10px] shadow-sm">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-2xl">payments</span>
              </div>
              <div className="flex flex-col">
                <dt className="text-[10px] text-secondary font-black uppercase tracking-tighter">Plata</dt>
                <dd className="text-lg font-black text-white line-clamp-1">{jobData.salary}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-high border border-white/5 px-5 py-3 rounded-[10px] shadow-lg">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-2xl">work</span>
              </div>
              <div className="flex flex-col">
                <dt className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Radno vreme</dt>
                <dd className="text-sm font-semibold text-white line-clamp-1">{jobData.type}</dd>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-high border border-white/5 px-5 py-3 rounded-[10px] shadow-lg">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-2xl">location_on</span>
              </div>
              <div className="flex flex-col">
                <dt className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Lokacija</dt>
                <dd className="text-sm font-semibold text-white line-clamp-1">
                  <Link to={`/poslovi?grad=${jobData.locationSlug}`} className="hover:text-secondary hover:underline transition-colors uppercase">
                    {jobData.location}
                  </Link>
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-surface-container-high border border-white/5 px-5 py-3 rounded-[10px] shadow-lg">
              <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-2xl">calendar_today</span>
              </div>
              <div className="flex flex-col">
                <dt className="text-[10px] text-on-surface-variant font-bold uppercase tracking-tighter">Početak rada</dt>
                <dd className="text-sm font-semibold text-white line-clamp-1">{jobData.start}</dd>
              </div>
            </div>
          </dl>

          {/* Key Benefits Tags */}
          <div className="flex flex-wrap gap-3">
            {jobData.conditions?.housing && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-[10px] text-emerald-400 font-bold text-sm">
                <span className="material-symbols-outlined text-[18px]">home_work</span>
                Obezbeđen smeštaj
              </div>
            )}
            {jobData.conditions?.food && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-[10px] text-emerald-400 font-bold text-sm">
                <span className="material-symbols-outlined text-[18px]">restaurant</span>
                Obezbeđena hrana
              </div>
            )}
            {jobData.conditions?.transport && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-[10px] text-emerald-400 font-bold text-sm">
                <span className="material-symbols-outlined text-[18px]">directions_bus</span>
                Plaćen prevoz
              </div>
            )}
          </div>
        </div>
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-surface-container-high p-6 rounded-[10px] border-2 border-secondary flex flex-col items-center text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl">contact_phone</span>
            </div>
            
            {isLoggedIn ? (
              <>
                <p className="text-on-surface-variant text-sm mb-4 relative z-10">Sviđa vam se ovaj oglas? Prijavite se odmah!</p>
                <div className="flex flex-col gap-3 w-full relative z-10">
                  <a href={`tel:${jobData.telefon}`} className={UI_TOKENS.BTN_PRIMARY + " w-full flex items-center justify-center gap-3"}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>phone</span>
                    Pozovite odmah
                  </a>
                  {jobData.companyId && (
                    <button 
                      onClick={handleStartChat}
                      className="w-full h-14 rounded-[10px] bg-white/5 border border-white/10 flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all"
                    >
                      <span className="material-symbols-outlined text-secondary">forum</span>
                      Pošalji Poruku
                    </button>
                  )}
                </div>
                <p className="mt-4 text-[10px] text-on-surface-variant uppercase tracking-tighter relative z-10">Referentni broj oglasa: #SG-{jobData?.id?.substring(0, 6) || 'XXXXXX'}</p>
              </>
            ) : (
              <>
                <p className="text-on-surface-variant text-sm mb-4 relative z-10 font-bold">Kontakt podaci su sakriveni</p>
                <div className="w-full bg-surface-container-highest py-4 rounded-[10px] font-black text-lg flex items-center justify-center gap-3 mb-4 blur-sm opacity-50 select-none relative z-10">
                  <span className="material-symbols-outlined">phone</span>
                  +381 6X XXX XXX
                </div>
                <button 
                  onClick={() => navigate('/prijava')}
                  className={UI_TOKENS.BTN_PRIMARY + " w-full relative z-10"}
                >
                  <span className="material-symbols-outlined text-[18px]">lock_open</span>
                  Prijavi se da vidiš
                </button>
                <p className="mt-4 text-[10px] text-on-surface-variant uppercase tracking-tighter relative z-10">Samo za registrovane korisnike</p>
              </>
            )}
          </div>
          <RelatedSEO locationSlug={jobData.locationSlug} currentType="jobs" />
        </div>
      </motion.div>
    </section>
  );
}
