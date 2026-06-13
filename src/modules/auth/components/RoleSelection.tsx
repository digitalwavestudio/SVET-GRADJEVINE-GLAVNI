import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';

export default function RoleSelection({ onSkip }: { onSkip?: () => void }) {
  const { switchRole } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = async (targetRole: string) => {
    try {
      console.log("Attempting to switch role to:", targetRole);
      await switchRole(targetRole as any);
      console.log("Successfully switched role to:", targetRole);
    } catch (error) {
      console.error("Failed to set role:", error);
      alert("Došlo je do greške pri izmeni uloge. Molimo pokušajte ponovo.");
    }
  };

  const proRoles = [
    {
      slug: 'majstor',
      title: 'JA SAM MAJSTOR / RADNIK',
      subtitle: 'PRONAĐI POSAO & KLIJENTE',
      description: 'Napravite digitalni profil, istaknite svoje veštine, CV i portfolio radova. Budite vidljivi poslodavcima u najvećoj bazi građevinskih radnika na Balkanu.',
      icon: 'engineering',
      color: 'text-amber-400 border-amber-500/20 hover:border-amber-400 hover:shadow-amber-500/10',
      bgGlow: 'bg-amber-500/10',
      tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      btnBg: 'bg-amber-400 text-slate-950 hover:bg-amber-300',
      benefits: ['Lični online portfolio radova', 'Direktan kontakt sa firmama', 'Bez posrednika i provizija']
    },
    {
      slug: 'poslodavac',
      title: 'GRAĐEVINSKA FIRMA',
      subtitle: 'ZAPOSLI EKIPU ILI MAJSTORE',
      description: 'Objavite oglase za posao i građevinske projekte. Pretražite bazu slobodnih majstora i radnika, te direktno ugovorite saradnju i kooperaciju.',
      icon: 'business',
      color: 'text-emerald-400 border-emerald-500/20 hover:border-emerald-400 hover:shadow-emerald-500/10',
      bgGlow: 'bg-emerald-500/10',
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      btnBg: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300',
      benefits: ['Neograničeno postavljanje oglasa', 'Pristup bazi aktivnih radnika', 'Statistika pregleda i prijava']
    },
    {
      slug: 'smestaj',
      title: 'SMEŠTAJ ZA RADNIKE',
      subtitle: 'IZNAJMI SMEŠTAJNE KAPACITETE',
      description: 'Prikažite svoje stanove, pansione, hostele ili radničke kontejnere. Povežite se sa građevinskim firmama koje traže smeštaj za svoje terenske radnike.',
      icon: 'home_pin',
      color: 'text-sky-400 border-sky-500/20 hover:border-sky-400 hover:shadow-sky-500/10',
      bgGlow: 'bg-sky-500/10',
      tagColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      btnBg: 'bg-sky-400 text-slate-950 hover:bg-sky-300',
      benefits: ['Direktan kontakt sa firmama', 'Isticanje lokacije i kapaciteta', 'Popunjenost tokom cele godine']
    },
    {
      slug: 'masine',
      title: 'MAŠINE I OPREMA',
      subtitle: 'NAJAM ILI PRODAJA MEHANIZACIJE',
      description: 'Iznajmite ili prodajte bagere, dizalice, skele, oplate i prateću građevinsku opremu. Budite prvi izbor izvođačima radova u potrazi za opremom.',
      icon: 'construction',
      color: 'text-orange-400 border-orange-500/20 hover:border-orange-400 hover:shadow-orange-500/10',
      bgGlow: 'bg-orange-500/10',
      tagColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      btnBg: 'bg-orange-400 text-slate-950 hover:bg-orange-300',
      benefits: ['Pregledan katalog mašina', 'Cenovnik najma po danu/satu', 'Direktni upiti od izvođača']
    },
    {
      slug: 'ketering',
      title: 'KETERING & ISHRANA RADNIKA',
      subtitle: 'DOSTAVA HRANE NA GRADILIŠTA',
      description: 'Ponudite kuvana jela i organizovanu ishranu za radnike na gradilištima. Povežite se sa firmama koje brinu o ishrani svojih zaposlenih na terenu.',
      icon: 'restaurant',
      color: 'text-amber-500 border-amber-600/20 hover:border-amber-500 hover:shadow-amber-500/10',
      bgGlow: 'bg-amber-600/10',
      tagColor: 'bg-amber-600/10 text-amber-500 border-amber-600/20',
      btnBg: 'bg-amber-500 text-slate-950 hover:bg-amber-400',
      benefits: ['Kreiranje dnevnih menija', 'Dugoročni ugovori sa firmama', 'Povećanje obima porudžbina']
    },
    {
      slug: 'placevi',
      title: 'PLACEVI I ZONE',
      subtitle: 'INDUSTRIJSKO ZEMLJIŠTE I PROSTORI',
      description: 'Prodajte ili iznajmite građevinska zemljišta, skladišta, hale ili placeve u industrijskim zonama. Privucite investitore i izvođače radova.',
      icon: 'landscape',
      color: 'text-emerald-400 border-emerald-500/20 hover:border-emerald-400 hover:shadow-emerald-500/10',
      bgGlow: 'bg-emerald-500/10',
      tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      btnBg: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300',
      benefits: ['Detaljne specifikacije zemljišta', 'Lokacijski prikaz i plan zone', 'Direktan kontakt sa investitorima']
    },
    {
      slug: 'partner',
      title: 'PARTNER AFFILIATE',
      subtitle: 'PREPORUČI I ZARADI PROVIZIJU',
      description: 'Promovišite našu platformu i ostvarite procenat od svake uplate Vaših preporučenih korisnika. Dobijate lični affiliate kod i detaljnu statistiku zarade.',
      icon: 'handshake',
      color: 'text-orange-500/50 border-orange-500/10 hover:border-orange-500/30 hover:shadow-orange-500/5',
      bgGlow: 'bg-orange-500/5',
      tagColor: 'bg-orange-500/5 text-orange-500/50 border-orange-500/10',
      btnBg: 'bg-orange-600/30 text-white/50 cursor-not-allowed',
      benefits: ['Automatsko praćenje preporuka', 'Isplate na tekući račun', 'Marketing materijali i podrška'],
      isComingSoon: true
    }
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full">
          <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
          <span className="text-[10px] md:text-xs font-black text-secondary uppercase tracking-[0.25em]">AKTIVACIJA PREMIUM PROFILA</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
          IZABERITE VAŠU <span className="text-secondary">ULOGU</span> NA PORTALU
        </h2>
        <p className="text-white/40 font-bold text-sm uppercase tracking-widest leading-relaxed">
          Aktivacijom specifične uloge otvarate potpuno novi set alata, kontrolnu tablu i mogućnosti prilagođene Vašoj delatnosti.
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

            {/* Tooltip za Coming Soon ulogu na hover */}
            {role.isComingSoon && (
              <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-md shadow-lg border border-amber-400">
                  STIŽE USKORO
                </div>
              </div>
            )}

            <div className="relative z-10 flex-1 flex flex-col justify-between space-y-10">
              
              {/* Top Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className={`w-16 h-16 rounded-[12px] ${role.bgGlow} ${role.color.split(' ')[0]} border border-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <span className="material-symbols-outlined text-4xl font-light">{role.icon}</span>
                  </div>
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${role.tagColor}`}>
                    {role.isComingSoon ? 'USKORO DOSTUPNO' : role.subtitle}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-none">
                    {role.title}
                  </h3>
                  <p className="text-xs md:text-sm text-white/40 font-bold uppercase tracking-wider leading-relaxed">
                    {role.description}
                  </p>
                </div>
              </div>

              {/* Benefits Checklist */}
              <div className="border-t border-white/5 pt-6 space-y-3">
                {role.benefits.map((benefit, bIndex) => (
                  <div key={bIndex} className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-base shrink-0 ${role.color.split(' ')[0]}`}>check_circle</span>
                    <span className="text-[10px] md:text-xs font-black text-white/70 uppercase tracking-wider leading-none">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {role.isComingSoon ? (
                <div className="relative w-full group/btn">
                  <button
                    disabled
                    className="w-full py-4 md:py-5 bg-white/5 text-white/20 border border-white/5 font-black text-xs md:text-sm tracking-[0.2em] uppercase rounded-[12px] cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    USKORO
                    <span className="material-symbols-outlined text-lg">hourglass_empty</span>
                  </button>
                  {/* Hover popup stilizovan kao na footeru svetlog moda */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-amber-500 border border-amber-400 text-slate-950 rounded-lg shadow-2xl opacity-0 invisible group-hover/btn:opacity-100 group-hover/btn:visible transition-all duration-300 z-50 text-center pointer-events-none">
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-1">OBAVEŠTENJE</div>
                    <p className="text-[10px] font-black uppercase tracking-wider leading-tight">
                      Partner / Affiliate opcija stiže uskoro na platformu!
                    </p>
                    <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-500 border-r border-b border-amber-400 rotate-45"></div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleSelectRole(role.slug)}
                  className={`w-full py-4 md:py-5 rounded-[12px] font-black text-xs md:text-sm tracking-[0.2em] uppercase transition-all duration-300 shadow-md ${role.btnBg} flex items-center justify-center gap-2`}
                >
                  AKTIVIRAJ PROFIL
                  <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:translate-x-1.5">arrow_forward</span>
                </button>
              )}

            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer Skip Selection */}
      <div className="text-center pt-8">
        <button
          onClick={() => {
            if (onSkip) onSkip();
            else navigate('/moj-profil');
          }}
          className="px-8 py-4 bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all rounded-[10px] text-[10px] md:text-xs font-black uppercase tracking-[0.2em]"
        >
          ŽELIM DA OSTANEM STANDARDNI KORISNIK ZA SADA
        </button>
      </div>
    </div>
  );
}
