import React from 'react';
import { Link } from 'react-router-dom';
import { LOCATIONS } from '@/src/constants/taxonomy';
import { getUserLink } from '@/src/lib/routeFilters';
import ThemeToggle from '@/src/components/ThemeToggle';
import { RelatedSEO } from '@/src/components/RelatedSEO';

interface CompanySidebarProps {
  company: any;
}

export function CompanySidebar({ company }: CompanySidebarProps) {
  return (
    <aside className="lg:col-span-4 relative" aria-label="Informacije o firmi">
       <div className="sticky top-32 space-y-8">
          
          {/* KONTAKT KARTICA */}
          <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-10 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-3xl group-hover:bg-secondary/10 transition-all"></div>
             <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-10">POSLOVNI KONTAKT</h3>
             
             <div className="space-y-10">
                <div className="space-y-4">
                   <div className="text-[10px] font-black text-secondary uppercase tracking-widest">TELEFON</div>
                   <a href={`tel:${company.phone}`} className="text-2xl font-black text-white tracking-tighter block hover:text-secondary transition-colors">{company.phone}</a>
                </div>

                <div className="space-y-4 border-t border-white/5 pt-8">
                   <div className="text-[10px] font-black text-secondary uppercase tracking-widest">ADRESA I SEDIŠTE</div>
                   <address className="text-sm font-bold text-white/80 uppercase tracking-tight not-italic">
                      {company.address}<br/>
                      {LOCATIONS.find(l => l.slug === company.locationSlug)?.name}, Srbija
                   </address>
                </div>

                <div className="space-y-4 border-t border-white/5 pt-8">
                   <div className="text-[10px] font-black text-secondary uppercase tracking-widest">DIREKTNO PRISUSTVO</div>
                   <div className="space-y-4">
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm font-bold text-white/60 hover:text-secondary transition-colors uppercase">
                           <span className="material-symbols-outlined text-lg">language</span>
                           WEB PREZENTACIJA
                        </a>
                      )}
                      <div className="flex gap-4">
                         {company.facebook && (
                           <a href={company.facebook} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white/5 rounded-[10px] flex items-center justify-center text-white/40 hover:text-white hover:bg-blue-600 transition-all border border-white/5">
                              <i className="fab fa-facebook-f"></i>
                           </a>
                         )}
                         {company.instagram && (
                           <a href={company.instagram} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white/5 rounded-[10px] flex items-center justify-center text-white/40 hover:text-white hover:bg-gradient-to-tr from-yellow-500 to-purple-600 transition-all border border-white/5">
                              <i className="fab fa-instagram"></i>
                           </a>
                         )}
                      </div>
                   </div>
                </div>

                <div className="pt-8 w-full">
                   <a 
                     href={`tel:${company.phone}`}
                     className="flex w-full h-18 items-center justify-center gap-4 bg-secondary text-slate-950 rounded-[10px] font-black text-xs tracking-widest uppercase hover:bg-yellow-400 transition-all shadow-2xl shadow-secondary/10"
                   >
                     <span className="material-symbols-outlined">chat</span>
                     UPUTI UPIT FIRMI
                   </a>
                </div>
             </div>
          </div>

          {/* TRUST BADGE */}
          <div className="bg-white/5 border-2 border-white/5 rounded-[10px] p-8 flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-secondary/10 rounded-[10px] flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
             </div>
             <h4 className="text-xs font-black text-white uppercase tracking-widest mb-3">SVET GRAĐEVINE VERIFIKACIJA</h4>
             <p className="text-[10px] text-white/40 font-bold uppercase tracking-wide leading-relaxed">
                Ova firma je prošla internu proveru podataka i poseduje validan PIB: {company.pib}
             </p>
          </div>

          {/* VLASNIK PROFIL */}
          <div className="flex justify-center pt-4">
            <Link
              to={getUserLink(company.authorId)}
              className="bg-[#132123] border border-white/5 px-6 py-4 rounded-[10px] hover:bg-white/5 hover:border-secondary transition-all w-full text-center group flex flex-col items-center"
            >
               <span className="material-symbols-outlined text-white/30 text-3xl mb-2 group-hover:text-secondary transition-colors">account_circle</span>
               <span className="text-[10px] font-black uppercase text-white/60 tracking-widest group-hover:text-white mb-1">PROFIL ZASTUPNIKA</span>
               <span className="text-[9px] font-bold text-white/40">Pogledajte profil zastupnika firme</span>
            </Link>
          </div>

          <div className="flex justify-center pt-4">
             <ThemeToggle />
          </div>

          <RelatedSEO locationSlug={company.locationSlug} currentType="companies" />
       </div>
    </aside>
  );
}
