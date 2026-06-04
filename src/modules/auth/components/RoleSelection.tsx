import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { COMPANY_TYPES } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';

export default function RoleSelection({ onSkip }: { onSkip?: () => void }) {
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = async (roleSlug: string) => {
    // We removed skip_standard role selection here since we don't skip anymore
    // Mapping taxonomy slugs to our internal UserRole types if they differ
    let targetRole = roleSlug;
    if (roleSlug === 'izvodjaci-radova') targetRole = 'poslodavac';
    if (roleSlug === 'smestaj-za-radnike') targetRole = 'smestaj';
    if (roleSlug === 'iznajmljivanje-masina') targetRole = 'masine';
    if (roleSlug === 'ketering') targetRole = 'ketering';
    if (roleSlug === 'inzenjering') targetRole = 'poslodavac'; // For now group with poslodavac
    if (roleSlug === 'placevi') targetRole = 'placevi';
    if (roleSlug === 'partner') targetRole = 'partner';

    try {
      await updateUser({ role: targetRole as any });
      navigate('/moj-profil'); // Refresh view automatically via routing
    } catch (error) {
      console.error("Failed to set role:", error);
    }
  };

  const rolesWithIcons = [
    { slug: 'izvodjaci-radova', icon: 'business', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { slug: 'smestaj-za-radnike', icon: 'home_pin', color: 'text-secondary', bg: 'bg-secondary/10' },
    { slug: 'ketering', icon: 'restaurant', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { slug: 'iznajmljivanje-masina', icon: 'construction', color: 'text-yellow-600', bg: 'bg-yellow-600/10' },
    { slug: 'placevi', icon: 'landscape', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">
          IZABERITE VAŠU <span className="text-secondary">ULOGU</span> NA PORTALU
        </h2>
        <p className="text-white/40 font-bold text-xs uppercase tracking-widest leading-relaxed">
          DA BISTE AKTIVIRALI VAŠ SPECIFIČNI DASHBOARD I POČELI SA OGLAŠAVANJEM, MOLIMO IZABERITE JEDNU OD PONUĐENIH OPCIJA KOJA NAJBOLJE OPISUJE VAŠU DELATNOST.
        </p>
      </div>

      {/* TOP BANNER: Skip Selection */}
      <motion.button
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => {
          if (onSkip) onSkip();
        }}
        className="bg-white/5 border border-white/10 p-6 rounded-[10px] text-center hover:border-white/20 transition-all group w-full relative overflow-hidden"
      >
         <div className="relative z-10 flex flex-col items-center">
           <h3 className="text-sm font-black text-white/60 uppercase tracking-[0.2em] group-hover:text-white transition-colors">ŽELIM DA OSTANEM STANDARDNI KORISNIK ZA SADA</h3>
           <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mt-2">OVO MOŽETE UVEK PROMENITI U SVAKOM TRENUTKU U MENIJU LEVO</p>
         </div>
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
      </motion.button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {rolesWithIcons.map((roleInfo, index) => {
          const taxonomyData = COMPANY_TYPES.find(t => t.slug === roleInfo.slug);
          if (!taxonomyData) return null;

          return (
            <motion.button
              key={roleInfo.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelectRole(roleInfo.slug)}
              className="bg-[#0A0F14] border border-white/5 p-8 rounded-[10px] text-left hover:border-secondary transition-all group flex flex-col h-full shadow-2xl hover:shadow-secondary/5 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 ${roleInfo.bg} opacity-20 blur-[40px] -mr-12 -mt-12 group-hover:opacity-40 transition-opacity`}></div>
              
              <div className={`w-14 h-14 ${roleInfo.bg} ${roleInfo.color} rounded-[10px] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10`}>
                <span className="material-symbols-outlined text-3xl font-light">{roleInfo.icon}</span>
              </div>

              <div className="relative z-10 space-y-2 mt-auto">
                <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-secondary transition-colors line-clamp-2">
                  {taxonomyData.name}
                </h3>
                <div className="flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-secondary"></div>
                   <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">AKTIVIRAJ DASHBOARD</span>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between relative z-10 border-t border-white/5 pt-6">
                 <span className="text-[9px] font-black text-white/20 uppercase tracking-widest group-hover:text-white/40">ZAPOČNI</span>
                 <span className="material-symbols-outlined text-white/10 group-hover:text-secondary transition-all group-hover:translate-x-1">arrow_forward</span>
              </div>
            </motion.button>
          );
        })}

        {/* Specialized "Majstor" Option (Standard User default) */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={() => handleSelectRole('majstor')}
          className="bg-[#0A0F14] border border-white/5 p-8 rounded-[10px] text-left hover:border-blue-500 transition-all group flex flex-col h-full shadow-2xl hover:shadow-blue-500/5 relative overflow-hidden col-span-1 md:col-span-2 lg:col-span-4 lg:py-12"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] -mr-32 -mt-32"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-[10px] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10 group-hover:rotate-6 transition-transform">
              <span className="material-symbols-outlined text-5xl">engineering</span>
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">JA SAM MAJSTOR / RADNIK</h3>
              <p className="text-white/40 font-bold text-sm uppercase tracking-widest leading-relaxed max-w-2xl">
                KREIRAJTE SVOJ DIGITALNI PROFIL, POSTAVITE VAŠ CV I PORFOLIO RADOVA. PRIDRUŽITE SE NAJVEĆOJ BAZI STRUČNIH RADNIKA I PRONAĐITE IDEALAN POSAO.
              </p>
            </div>
            <div className="px-8 py-4 bg-blue-500 text-white font-black rounded-[10px] text-xs tracking-widest uppercase hover:bg-blue-400 transition-all shadow-xl shadow-blue-500/20">
              KREIRAJ RADNI PROFIL
            </div>
          </div>
        </motion.button>

        {/* BOTTOM OPTION: Affiliate Partner (Red Border) */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => handleSelectRole('partner')}
          className="bg-[#100505] border border-red-500/30 p-8 rounded-[10px] text-left hover:border-red-500 transition-all group flex flex-col h-full shadow-2xl hover:shadow-red-500/10 relative overflow-hidden col-span-1 md:col-span-2 lg:col-span-4 lg:py-12"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] -mr-32 -mt-32"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10 text-center md:text-left">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[10px] flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10 group-hover:rotate-6 transition-transform">
              <span className="material-symbols-outlined text-5xl">handshake</span>
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">PARTNER AFFILIATE</h3>
              <p className="text-white/40 font-bold text-sm uppercase tracking-widest leading-relaxed max-w-2xl">
                ZARADITE PROMOVIŠUĆI NAJVEĆI GRAĐEVINSKI PORTAL. DOBIJATE PROVIZIJU OD SVAKE UPLATE VAŠIH PREPORUČENIH KORISNIKA. POSTANITE DEO NAŠEG TIMA.
              </p>
            </div>
            <div className="px-8 py-4 bg-red-500 text-white font-black rounded-[10px] text-[10px] tracking-[0.2em] uppercase hover:bg-red-400 transition-all shadow-xl shadow-red-500/20 whitespace-nowrap">
              POSTANI PARTNER
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
