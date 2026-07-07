import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';
import { useBrandLogo } from '@/src/context/BrandContext';
import logoImage from '@/src/assets/images/logo.webp';

export default function RoleSelection({ onSkip }: { onSkip?: () => void }) {
  const { switchRole } = useAuth();
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
      slug: 'majstor',
      title: 'MAJSTOR / RADNIK',
      subtitle: 'PRONAĐI POSAO & KLIJENTE',
      description: 'Napravite profesionalni profil, predstavite svoje iskustvo i pronađite nove poslovne prilike u građevinskoj industriji.',
      icon: 'engineering',
      color: 'text-amber-400 border-amber-500/20 hover:border-amber-400 hover:shadow-amber-500/10',
      bgGlow: 'bg-amber-500/10',
      tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      btnBg: 'bg-amber-400 !text-black hover:bg-amber-300',
      benefits: ['Profesionalni profil sa CV-jem', 'Portfolio radova i preporuke', 'Prijavljivanje na oglase za posao']
    },
    {
      slug: 'poslodavac',
      title: 'GRAĐEVINSKA FIRMA',
      subtitle: 'ZAPOSLI EKIPU ILI MAJSTORE',
      description: 'Predstavite svoju firmu, objavljujte oglase za posao i pronađite majstore, radnike i saradnike.',
      icon: 'business',
      color: 'text-emerald-400 border-emerald-500/20 hover:border-emerald-400 hover:shadow-emerald-500/10',
      bgGlow: 'bg-emerald-500/10',
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      btnBg: 'bg-emerald-400 !text-black hover:bg-emerald-300',
      benefits: ['Profil građevinske firme', 'Objavljivanje oglasa za posao', 'Pretraga kandidata i prijava']
    },
    {
      slug: 'smestaj',
      title: 'SMEŠTAJ ZA RADNIKE',
      subtitle: 'IZNAJMI SMEŠTAJNE KAPACITETE',
      description: 'Oglašavajte smeštajne kapacitete namenjene građevinskim firmama i radnicima na terenu.',
      icon: 'home_pin',
      color: 'text-sky-400 border-sky-500/20 hover:border-sky-400 hover:shadow-sky-500/10',
      bgGlow: 'bg-sky-500/10',
      tagColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      btnBg: 'bg-sky-400 !text-black hover:bg-sky-300',
      benefits: ['Objavljivanje smeštajnih kapaciteta', 'Fotografije, cene i raspoloživost', 'Direktan kontakt sa zainteresovanima']
    },
    {
      slug: 'ketering',
      title: 'KETERING I ISHRANA RADNIKA',
      subtitle: 'DOSTAVA HRANE NA GRADILIŠTA',
      description: 'Predstavite svoju ponudu i povežite se sa građevinskim firmama koje organizuju ishranu zaposlenih.',
      icon: 'restaurant',
      color: 'text-amber-500 border-amber-600/20 hover:border-amber-500 hover:shadow-amber-500/10',
      bgGlow: 'bg-amber-600/10',
      tagColor: 'bg-amber-600/10 text-amber-500 border-amber-600/20',
      btnBg: 'bg-amber-500 !text-black hover:bg-amber-400',
      benefits: ['Predstavljanje ponude i menija', 'Definisanje uslova isporuke', 'Direktni upiti i dogovor saradnje']
    },
    {
      slug: 'masine',
      title: 'MAŠINE I OPREMA (uskoro)',
      subtitle: 'NAJAM ILI PRODAJA MEHANIZACIJE',
      description: 'Objavljujte oglase za prodaju ili iznajmljivanje građevinskih mašina, alata i opreme.',
      icon: 'construction',
      color: 'text-orange-400 border-orange-500/20 hover:border-orange-400 hover:shadow-orange-500/10',
      bgGlow: 'bg-orange-500/10',
      tagColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      btnBg: 'bg-orange-400 !text-black hover:bg-orange-300',
      benefits: ['Oglasi za prodaju i najam', 'Detaljne specifikacije opreme', 'Direktna komunikacija sa kupcima'],
      isComingSoon: true
    },
    {
      slug: 'placevi',
      title: 'PLACEVI I ZONE (uskoro)',
      subtitle: 'INDUSTRIJSKO ZEMLJIŠTE I PROSTORI',
      description: 'Oglašavajte građevinska zemljišta, hale, skladišta i druge poslovne nekretnine.',
      icon: 'landscape',
      color: 'text-emerald-400 border-emerald-500/20 hover:border-emerald-400 hover:shadow-emerald-500/10',
      bgGlow: 'bg-emerald-500/10',
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      btnBg: 'bg-emerald-400 !text-black hover:bg-emerald-300',
      benefits: ['Oglasi za zemljišta i objekte', 'Prikaz lokacije i karakteristika', 'Kontakt sa investitorima i izvođačima'],
      isComingSoon: true
    },
    {
      slug: 'partner',
      title: 'PARTNER AFFILIATE (uskoro)',
      subtitle: 'PREPORUČI I ZARADI PROVIZIJU',
      description: 'Preporučite platformu drugim korisnicima i ostvarite proviziju za svaku uspešnu preporuku.',
      icon: 'handshake',
      color: 'text-orange-500/50 border-orange-500/10 hover:border-orange-500/30 hover:shadow-orange-500/5',
      bgGlow: 'bg-orange-500/5',
      tagColor: 'bg-orange-500/5 text-orange-500/50 border-orange-500/10',
      btnBg: 'bg-orange-600/30 text-white/50 cursor-not-allowed',
      benefits: ['Lični affiliate link', 'Praćenje preporuka i zarade', 'Pregled provizija i isplata'],
      isComingSoon: true
    }
  ];

  return (
    <div className="space-y-16 pt-4 pb-8 md:py-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="hidden md:inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
          <span className="text-[10px] md:text-xs font-black text-secondary uppercase tracking-[0.25em]">AKTIVACIJA PREMIUM PROFILA</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[1.15] mt-2.5 md:mt-0">
          IZABERITE VAŠU <span className="text-secondary">ULOGU</span> NA PORTALU
        </h2>
        <p className="text-white/40 font-bold text-sm uppercase tracking-widest leading-relaxed">
          Svaka uloga donosi poseban skup funkcija, alata i kontrolnu tablu prilagođenu vašoj delatnosti.
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
            className={`relative flex flex-col bg-gradient-to-br from-[#0C1017] to-[#040609] border-2 ${role.color} rounded-[20px] p-8 md:p-10 overflow-hidden group transition-all duration-500 hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)]`}
          >
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-36 h-36 ${role.bgGlow} opacity-20 blur-[50px] -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700`}></div>

            {/* Tooltip za Coming Soon ulogu na hover (staro uklonjeno, ovo je glassmorphism ispod) */}

            <div className="relative z-10 flex-1 flex flex-col justify-between space-y-10">
              
              {/* Top Section */}
              <div className="space-y-6">
                <div className="hidden md:flex items-center justify-between">
                  <div className={`w-16 h-16 rounded-[12px] ${role.bgGlow} ${role.color.split(' ')[0]} border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <span className="material-symbols-outlined text-4xl font-light">{role.icon}</span>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${role.tagColor}`}>
                    {role.isComingSoon ? 'USKORO DOSTUPNO' : role.subtitle}
                  </span>
                </div>

                <div className="space-y-5 md:space-y-3">
                  <h3 className="text-2xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight">
                    {role.title}
                  </h3>
                  <p className="text-sm md:text-sm text-white/40 font-bold uppercase tracking-wider leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </div>

              {/* Benefits Checklist */}
              <div className="border-t border-white/5 pt-6 space-y-3">
                {role.benefits.map((benefit, bIndex) => (
                  <div key={bIndex} className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-base shrink-0 ${role.color.split(' ')[0]}`}>check_circle</span>
                    <span className="text-xs md:text-xs font-black text-white/70 uppercase tracking-wider leading-none">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {role.isComingSoon ? (
                <div className="relative w-full group/btn" tabIndex={0}>
                  <div className="md:hidden">
                    <button
                      disabled
                      className="w-full py-4 bg-white/5 text-white/20 border border-white/5 font-black text-xs tracking-[0.2em] uppercase rounded-[12px] cursor-not-allowed block text-center pointer-events-none"
                    >
                      USKORO
                    </button>
                  </div>
                  <div className="hidden md:block">
                    <button
                      disabled
                      className="w-full py-5 bg-white/5 text-white/20 border border-white/5 font-black text-sm tracking-[0.2em] uppercase rounded-[12px] cursor-not-allowed flex items-center justify-center gap-2 pointer-events-none"
                    >
                      USKORO
                      <span className="material-symbols-outlined text-lg">hourglass_empty</span>
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
                <div className="relative w-full">
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
                </div>
              )}

            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
