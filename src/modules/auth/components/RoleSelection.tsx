import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useBrandLogo } from '@/src/context/BrandContext';
import logoImage from '@/src/assets/images/logo.webp';

export default function RoleSelection({ onSkip }: { onSkip?: () => void }) {
  const { switchRole, user } = useAuth();
  const { logoUrl } = useBrandLogo();
  const navigate = useNavigate();

  const handleSelectRole = async (targetRole: string) => {
    try {
      if (import.meta.env.DEV) console.log("Attempting to switch role to:", targetRole);
      await switchRole(targetRole as any);
      if (import.meta.env.DEV) console.log("Successfully switched role to:", targetRole);
    } catch (error) {
      console.error("Failed to set role:", error);
      alert("Došlo je do greške pri izmeni uloge. Molimo pokušajte ponovo.");
    }
  };

  const proRoles = [
    {
      slug: 'standard',
      title: 'SG ČLAN',
      subtitle: 'PREGLEDAJ, PRONAĐI...',
      description: 'Pristupite svim oglasima, prijavite se za posao, pošaljite poruke i postavljajte oglase bez ograničenja.',
      icon: 'person',
      color: 'text-blue-400 border-blue-500/20 hover:border-blue-400 hover:shadow-blue-500/10',
      bgGlow: 'bg-blue-500/10',
      tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      btnBg: 'bg-blue-400 !text-black hover:bg-blue-300',
      benefits: ['Pregled svih oglasa i kontakata', 'Postavljanje oglasa za sve kategorije', 'Čuvanje omiljenih oglasa'],
      currentBg: 'bg-blue-400/20 text-blue-400 border-blue-500/30'
    },
    {
      slug: 'poslodavac',
      title: 'GRAĐEVINSKA FIRMA',
      subtitle: 'ZAPOSLI EKIPU ILI MAJSTORE',
      description: 'Predstavite svoju firmu, objavljujte oglase za posao i pronađite majstore, radnike i saradnike.',
      icon: 'construction',
      color: 'text-emerald-400 border-emerald-500/20 hover:border-emerald-400 hover:shadow-emerald-500/10',
      bgGlow: 'bg-emerald-500/10',
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      btnBg: 'bg-emerald-400 !text-black hover:bg-emerald-300',
      benefits: ['Profil građevinske firme', 'Objavljivanje oglasa za posao', 'Pretraga kandidata i prijava'],
      currentBg: 'bg-emerald-400/20 text-emerald-400 border-emerald-500/30'
    },
    {
      slug: 'partner',
      title: 'PARTNER PROGRAM (USKORO)',
      subtitle: 'PREPORUČI I ZARADI',
      description: 'Pretvorite svoju mrežu kontakata u dodatnu zaradu.\nDelite svoj partnerski link ili jedinstvenu šifru i ostvarujte proviziju za svaku uspešnu preporuku.',
      icon: 'handshake',
      color: 'text-secondary border-secondary/20 hover:border-secondary hover:shadow-secondary/10',
      bgGlow: 'bg-secondary/10',
      tagColor: 'bg-secondary/10 text-secondary border-secondary/20',
      btnBg: 'bg-secondary/20 text-secondary border-secondary/30 cursor-not-allowed',
      benefits: ['Jedinstveni partnerski link', 'Lična preporučna šifra', 'Detaljna statistika preporuka', 'Evidencija zarade i isplata'],
      isComingSoon: true,
      colSpanFull: true
    }
  ];

  return (
    <div className="space-y-16 pt-4 pb-8 md:py-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="hidden md:inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
          <span className="text-[10px] md:text-xs font-black text-secondary uppercase tracking-[0.25em]">KREIRAJTE SVOJ NALOG</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[1.15] mt-2.5 md:mt-0">
          NAPRAVITE PROFIL NA <span className="text-secondary">SVETU GRAĐEVINE</span>
        </h2>
        <p className="text-white/40 font-bold text-sm uppercase tracking-widest leading-relaxed">
          Vaš profil, vaše objave, vaši oglasi – sve na jednom mestu!
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {proRoles.map((role, index) => (
          <motion.div
            key={role.slug}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            className={`relative flex flex-col bg-gradient-to-br from-[#0C1017] to-[#040609] border-2 ${role.color} ${role.colSpanFull ? 'lg:col-span-3' : ''} rounded-[20px] p-8 md:p-10 overflow-hidden group transition-all duration-500 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)]`}
          >
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-36 h-36 ${role.bgGlow} opacity-20 blur-[50px] -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700`}></div>

            {/* Tooltip za Coming Soon ulogu na hover (staro uklonjeno, ovo je glassmorphism ispod) */}

            <div className="relative z-10 flex-1 flex flex-col">
              
              {/* Top Section - expands to push benefits to same position */}
              <div className="flex-1 space-y-6">
                <div className="hidden md:flex items-center justify-between">
                  <div className={`w-16 h-16 rounded-[12px] ${role.bgGlow} ${role.color.split(' ')[0]} border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <span className="material-symbols-outlined text-4xl font-light">{role.icon}</span>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${role.tagColor}`}>
                    {role.isComingSoon ? 'USKORO DOSTUPNO' : role.subtitle}
                  </span>
                </div>

                <div className="space-y-5 md:space-y-3">
                  <h3 className="text-2xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight text-center md:text-left">
                    {role.title}
                  </h3>
                  <p className="text-sm md:text-sm text-white/40 font-bold uppercase tracking-wider leading-relaxed whitespace-pre-line text-center md:text-left">
                    {role.description}
                  </p>
                </div>
              </div>

              {/* Benefits Checklist */}
              <div className="border-t border-white/5 pt-6 mt-6 space-y-3">
                {role.benefits.map((benefit, bIndex) => (
                  <div key={bIndex} className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-base shrink-0 ${role.color.split(' ')[0]}`}>check_circle</span>
                    <span className="text-xs md:text-xs font-black text-white/70 uppercase tracking-wider leading-none">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {role.isComingSoon ? (
                <div className="relative w-full group/btn mt-6" tabIndex={0}>
                  <div className="md:hidden">
                    <button
                      disabled
                      className={`w-full py-4 font-black text-xs tracking-[0.2em] uppercase rounded-[12px] cursor-not-allowed block text-center pointer-events-none border ${role.tagColor}`}
                    >
                      USKORO!
                    </button>
                  </div>
                  <div className="hidden md:block">
                    <button
                      disabled
                      className={`w-full py-5 font-black text-sm tracking-[0.2em] uppercase rounded-[12px] cursor-not-allowed flex items-center justify-center gap-2 pointer-events-none border ${role.tagColor}`}
                    >
                      USKORO!
                    </button>
                  </div>
                  {/* Glassmorphism popup */}
                  <>
                    {/* Mobile Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover/btn:opacity-100 group-focus/btn:opacity-100 transition-all duration-300 scale-95 group-hover/btn:scale-100 group-focus/btn:scale-100 z-50 w-max md:hidden">
                      <div className="bg-[#0b131a]/95 backdrop-blur-md border border-white/10 py-1.5 px-3 rounded-[8px] shadow-lg flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-[14px]">hourglass_empty</span>
                        <span className="text-white/90 text-[11px] font-bold tracking-wide">Stiže uskoro!</span>
                      </div>
                    </div>
                    {/* Desktop Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none opacity-0 group-hover/btn:opacity-100 group-focus/btn:opacity-100 transition-all duration-300 scale-90 group-hover/btn:scale-100 group-focus/btn:scale-100 z-50 w-max hidden md:block">
                      <div className="bg-[#0b131a]/95 backdrop-blur-md border border-white/10 p-4 md:p-5 rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.5)] whitespace-nowrap md:min-w-[260px] flex flex-col items-start text-left">
                        <div className="flex items-center gap-2.5 mb-2">
                          <img src={logoUrl || logoImage} alt="Svet Građevine Logo" className="h-5 md:h-6 w-auto object-contain drop-shadow-md flex-shrink-0" />
                          <span className="text-secondary font-black text-[11px] md:text-[12px] uppercase tracking-widest">USKORO!</span>
                        </div>
                        <p className="text-white/90 text-[12px] md:text-[13px] font-medium tracking-wide">Ova sekcija stiže uskoro!</p>
                      </div>
                    </div>
                  </>
                </div>
              ) : (
                <div className="relative w-full mt-6">
                  {user?.role === role.slug ? (
                    <>
                      <div className="md:hidden">
                        <div className={`w-full py-4 rounded-[12px] font-black text-xs tracking-[0.2em] uppercase text-center border cursor-default ${role.currentBg}`}>
                          TRENUTNO
                        </div>
                      </div>
                      <div className="hidden md:block group/current">
                        <div className={`w-full py-5 rounded-[12px] font-black text-sm tracking-[0.2em] uppercase flex items-center justify-center gap-2 border cursor-default ${role.currentBg}`}>
                          TRENUTNO
                          <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover/current:-translate-y-0.5">check_circle</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:hidden">
                        <button
                          onClick={() => handleSelectRole(role.slug)}
                          className={`w-full py-4 rounded-[12px] font-black text-xs tracking-[0.2em] uppercase transition-all duration-300 shadow-md ${role.btnBg} block text-center`}
                        >
                          AKTIVIRAJ PROFIL
                        </button>
                      </div>
                      <div className="hidden md:block">
                        <button
                          onClick={() => handleSelectRole(role.slug)}
                          className={`w-full py-5 rounded-[12px] font-black text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-md ${role.btnBg} flex items-center justify-center gap-2`}
                        >
                          AKTIVIRAJ PROFIL
                          <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:translate-x-1.5">arrow_forward</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
