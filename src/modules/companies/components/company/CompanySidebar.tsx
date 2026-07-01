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
       <div className="sticky top-32 space-y-6">
          
          {/* KONTAKT KARTICA */}
          <div className="bg-gradient-to-b from-[#111A22] to-[#0A1118] border border-white/5 rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/10 blur-[80px] group-hover:bg-secondary/20 transition-all duration-700"></div>
             
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <span className="material-symbols-outlined text-secondary text-xl">contact_support</span>
                 <h3 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">Poslovni Kontakt</h3>
               </div>
               
               {/* Status Aktivan Pulsirajuća Tačkica */}
               {company.isVerified && (
                 <div className="flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20" title="Firma je aktivna">
                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                   <span className="text-[8px] font-black tracking-widest uppercase text-green-400">Aktivan</span>
                 </div>
               )}
             </div>
             
             <div className="space-y-8 relative z-10">
                {/* Telefon */}
                <div className="group/item">
                   <div className="text-[9px] font-black text-secondary/70 uppercase tracking-widest mb-1 group-hover/item:text-secondary transition-colors">Glavni Telefon</div>
                   <a href={`tel:${company.phone}`} className="text-3xl font-black text-white tracking-tighter block hover:text-secondary hover:translate-x-1 transition-all mb-4">
                     {company.phone}
                   </a>
                   <a href={`tel:${company.phone}`} className="bg-gradient-to-r from-secondary to-yellow-500 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_5px_15px_rgba(254,191,13,0.2)] hover:shadow-[0_5px_25px_rgba(254,191,13,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-3 w-full mb-3">
                     <span className="material-symbols-outlined text-lg">call</span>
                     Kontaktiraj
                   </a>
                   <a href="mailto:info@svet-gradevine.rs?subject=Zakazivanje%20Konsultacija" className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 w-full">
                     <span className="material-symbols-outlined text-lg">calendar_month</span>
                     Zakaži Konsultacije
                   </a>
                </div>

                {/* Adresa / Sedište */}
                <div className="group/item">
                   <div className="text-[9px] font-black text-secondary/70 uppercase tracking-widest mb-1 group-hover/item:text-secondary transition-colors">Adresa / Sedište</div>
                   <address className="not-italic text-sm text-white/80 leading-relaxed group-hover/item:text-white transition-colors">
                      <span className="font-bold text-white block">
                        {typeof company.address === 'object' ? (
                           <>
                             {company.address?.street && `${company.address.street}, `}
                             {company.address?.city && `${company.address.city}`}
                           </>
                        ) : (
                           company.address
                        )}<br/>
                        <span className="text-white/40">{LOCATIONS.find(l => l.slug === company.locationSlug)?.name || company.location}, Srbija</span>
                      </span>
                   </address>
                </div>

                {/* PIB */}
                {company.pib && (
                   <div className="group/item border-t border-white/5 pt-4">
                     <div className="text-[9px] font-black text-secondary/70 uppercase tracking-widest mb-1 group-hover/item:text-secondary transition-colors">PIB Kompanije</div>
                     <div className="text-white font-black">{company.pib}</div>
                   </div>
                )}

                {/* Prisustvo na mrezama */}
                <div className="border-t border-white/5 pt-6">
                   <div className="text-[9px] font-black text-secondary/70 uppercase tracking-widest mb-4">Digitalno Prisustvo</div>
                   <div className="space-y-3">
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-xs font-bold text-white/60 hover:text-secondary hover:bg-white/[0.02] p-2 rounded-lg -ml-2 transition-all uppercase">
                           <span className="material-symbols-outlined text-lg">language</span>
                           Zvanični Website
                        </a>
                      )}
                      <div className="flex gap-3">
                         {company.facebook && (
                           <a href={company.facebook} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white/[0.03] rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-blue-600 transition-all border border-white/5 shadow-lg group/social">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="group-hover/social:scale-110 transition-transform">
                                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                              </svg>
                           </a>
                         )}
                         {company.instagram && (
                           <a href={company.instagram} target="_blank" rel="noreferrer" className="w-12 h-12 bg-white/[0.03] rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 transition-all border border-white/5 shadow-lg group/social">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="group-hover/social:scale-110 transition-transform">
                                <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.036 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z"/>
                              </svg>
                           </a>
                         )}
                      </div>
                   </div>
                </div>

             </div>
          </div>

          {/* TRUST BADGE */}
          <div className="bg-gradient-to-br from-[#0A1A0F] to-[#050D08] border border-green-500/20 rounded-2xl p-6 flex flex-col items-center text-center shadow-[0_0_30px_rgba(34,197,94,0.05)] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] pointer-events-none"></div>
             <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <span className="material-symbols-outlined text-green-400 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
             </div>
             <h4 className="text-[11px] font-black text-green-400 uppercase tracking-widest mb-2">Verifikovana Kompanija</h4>
             <p className="text-[10px] text-white/50 font-medium leading-relaxed">
                Ova firma je uspešno prošla našu internu proveru autentičnosti i poseduje validan PIB: <strong className="text-white font-bold">{company.pib}</strong>
             </p>
          </div>



          <div className="pt-4">
             <RelatedSEO locationSlug={company.locationSlug} currentType="companies" />
          </div>
       </div>
    </aside>
  );
}
