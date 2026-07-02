import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useMessages } from '@/src/context/MessagesContext';
import { LOCATIONS } from '@/src/constants/taxonomy';

interface CompanySidebarProps {
  company: any;
}

export function CompanySidebar({ company }: CompanySidebarProps) {
  const { user } = useAuth();
  const { startConversation } = useMessages();
  const navigate = useNavigate();
  const locationName = LOCATIONS.find(l => l.slug === company.locationSlug)?.name || company.location;

  const handleContact = async () => {
    if (!user) { navigate('/prijava'); return; }
    try {
      const convId = await startConversation(company.authorId, undefined, `Zdravo, interesuje me saradnja sa vašom firmom ${company.name}.`);
      if (convId) navigate(`/poruke?id=${convId}`);
    } catch (e) {
      console.error('[KONTAKT]', e);
      alert('Greška pri pokretanju prepiske.');
    }
  };
  return (
    <aside className="lg:col-span-4 relative" aria-label="Informacije o firmi">
       <div className="sticky top-32 space-y-6">
          
          {/* KONTAKT KARTICA */}
          <div className="bg-gradient-to-b from-[#111A22] to-[#0A1118] border border-white/5 rounded-2xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/10 blur-[80px] group-hover:bg-secondary/20 transition-all duration-700"></div>

             {/* Logo + Ime Firme - samo na desktopu, na mobilnom je u heroju */}
             <div className="hidden lg:flex items-center gap-4 mb-6">
                {company.logo ? (
                  <img src={company.logo} alt={company.name} className="w-14 h-14 rounded-xl object-contain bg-white p-1" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-white/40 text-2xl font-black">{company.name?.charAt(0) || 'C'}</div>
                )}
                <div>
                   <h3 className="text-lg font-black text-white tracking-tight uppercase">{company.name}</h3>
                   {company.isVerified && (
                     <div className="flex items-center gap-1.5 mt-1">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                       <span className="text-[8px] font-black tracking-widest uppercase text-green-400">Aktivan</span>
                     </div>
                   )}
                </div>
             </div>

              <div className="space-y-6 relative z-10">
                 {/* Telefon */}
                 <div>
                    <div className="text-[9px] font-black text-secondary/70 uppercase tracking-widest mb-1">Telefon</div>
                    <a href={`tel:${company.phone}`} className="text-3xl font-black text-white tracking-tighter block hover:text-secondary transition-colors mb-3">
                      {company.phone}
                    </a>
                    <a href={`tel:${company.phone}`} className="bg-gradient-to-br from-[#ffeb3b] to-[#fb8c00] hover:from-[#fb8c00] hover:to-[#ffeb3b] px-6 py-3 min-h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_5px_15px_rgba(254,191,13,0.2)] hover:shadow-[0_5px_25px_rgba(254,191,13,0.4)] hover:scale-105 transition-all flex items-center justify-center gap-3 w-full mb-3" style={{color: '#0F1923'}}>
                      <span className="material-symbols-outlined text-lg" style={{color: '#0F1923'}}>call</span>
                      Pozovi
                    </a>
                    <button onClick={handleContact} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-3 min-h-12 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 w-full text-center cursor-pointer">
                      <span className="material-symbols-outlined text-lg">chat</span>
                      Kontaktiraj preko SG
                    </button>
                </div>

                {/* Adresa */}
                <div>
                   <div className="text-[9px] font-black text-secondary/70 uppercase tracking-widest mb-1">Adresa</div>
                   <p className="text-white font-bold">{locationName}, Srbija</p>
                </div>

                {/* PIB */}
                {company.pib && (
                   <div className="pt-4 border-t border-white/5">
                     <div className="text-[9px] font-black text-secondary/70 uppercase tracking-widest mb-1">PIB Kompanije</div>
                     <div className="text-white font-bold">{company.pib}</div>
                   </div>
                )}

                {/* Email */}
                {company.email && (
                   <div className="pt-4 border-t border-white/5">
                      <div className="text-[9px] font-black text-secondary/70 uppercase tracking-widest mb-1">Email Adresa</div>
                      <a href={`mailto:${company.email}`} className="text-white font-bold hover:text-secondary transition-colors truncate block">
                        {company.email}
                      </a>
                   </div>
                )}

                {/* Na mrežama */}
                <div className="pt-6 border-t border-white/5 space-y-4">
                   <div className="text-[9px] font-black text-secondary/70 uppercase tracking-widest">Na mrežama</div>
                   {company.website && (
                     <div>
                       <div className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Sajt</div>
                       <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 font-bold text-sm transition-colors block truncate">
                         {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                       </a>
                     </div>
                   )}
                   {company.facebook && (
                     <div>
                       <div className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Facebook</div>
                       <a href={company.facebook} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 font-bold text-sm transition-colors block truncate">
                         {company.facebook.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                       </a>
                     </div>
                   )}
                   {company.instagram && (
                     <div>
                       <div className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Instagram</div>
                       <a href={company.instagram} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 font-bold text-sm transition-colors block truncate">
                         {company.instagram.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                       </a>
                     </div>
                   )}
                </div>

             </div>
          </div>

          {/* TRUST BADGE */}
           <div className="bg-gradient-to-br from-[#0A1A0F] to-[#050D08] border border-green-500/20 rounded-2xl p-5 md:p-6 flex flex-col items-center text-center shadow-[0_0_30px_rgba(34,197,94,0.05)] relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[50px] pointer-events-none"></div>
             <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <span className="material-symbols-outlined text-green-400 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
             </div>
             <h4 className="text-[11px] font-black text-green-400 uppercase tracking-widest mb-2">Verifikovana Kompanija</h4>
             <p className="text-[10px] text-white/50 font-medium leading-relaxed">
                Ova firma je uspešno prošla našu internu proveru autentičnosti i poseduje validan PIB: <strong className="text-white font-bold">{company.pib}</strong>
             </p>
          </div>

       </div>
    </aside>
  );
}
