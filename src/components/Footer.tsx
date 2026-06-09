import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/src/constants/config';
import { useAuth } from '@/src/context/AuthContext';
import { useBrandLogo } from '@/src/context/BrandContext';
import ThemeToggle from '@/src/components/ThemeToggle';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const { user } = useAuth();
  const { logoUrl } = useBrandLogo();

  return (
    <footer className="bg-[#0a1016] w-full pt-16 md:pt-24 pb-8 md:pb-12 px-4 sm:px-8 border-t border-white/5 relative overflow-hidden">
      {/* Background glow for luxury feel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[1px] bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-[1920px] mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 md:gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 pr-0 lg:pr-8">
            <Link to="/" className="flex items-center gap-3 group mb-8">
              {logoUrl ? (
                <img width="800" height="600" decoding="async" src={logoUrl} alt="Svet Građevine Logo" loading="lazy" className="w-[180px] md:w-[220px] h-auto max-h-[100px] object-contain drop-shadow-md" />
              ) : (
                <>
                  <div className="relative flex items-center justify-center w-12 h-12">
                    <div className="absolute inset-0 bg-secondary rounded-[10px] rotate-6 group-hover:rotate-12 transition-transform duration-500 opacity-20"></div>
                    <div className="absolute inset-0 bg-secondary rounded-[10px] -rotate-3 group-hover:-rotate-6 transition-transform duration-500"></div>
                    <span className="material-symbols-outlined text-on-secondary text-3xl relative z-10" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-xl font-black font-headline tracking-tighter text-white group-hover:text-secondary transition-colors uppercase">
                      SVET <span className="text-secondary group-hover:text-white transition-colors">GRAĐEVINE</span>
                    </span>
                    <span className="text-[10px] font-bold tracking-[0.3em] text-on-surface-variant uppercase mt-1 inline-block">Regionalni Lider</span>
                  </div>
                </>
              )}
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
              Najveća regionalna platforma za građevinsku industriju. Pronađite <strong className="font-bold text-slate-200">najbolje građevinske poslove</strong>, pouzdane <strong className="font-bold text-slate-200">majstore i radnike</strong>, iznajmite mehanizaciju ili pronađite adekvatan smeštaj i placeve. Vaša prva tačka za sigurne građevinske projekte.
            </p>
            <div className="flex items-center gap-4">
              <a href={APP_CONFIG.SOCIAL.FACEBOOK} target="_blank" rel="noopener noreferrer" aria-label="Posetite našu Facebook grupu" className="w-10 h-10 rounded-[10px] bg-white/10 border border-white/20 flex items-center justify-center text-slate-400 hover:bg-secondary hover:border-secondary hover:text-on-secondary hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,193,7,0.2)] transition-all duration-300">
                <Facebook size={20} />
              </a>
              <a href={APP_CONFIG.SOCIAL.INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Pratite nas na Instagramu" className="w-10 h-10 rounded-[10px] bg-white/10 border border-white/20 flex items-center justify-center text-slate-400 hover:bg-secondary hover:border-secondary hover:text-on-secondary hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,193,7,0.2)] transition-all duration-300">
                <Instagram size={20} />
              </a>
              <a href={APP_CONFIG.SOCIAL.LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="Posetite našu LinkedIn stranicu" className="w-10 h-10 rounded-[10px] bg-white/10 border border-white/20 flex items-center justify-center text-slate-400 hover:bg-secondary hover:border-secondary hover:text-on-secondary hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,193,7,0.2)] transition-all duration-300">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-2">
            <h4 className="text-secondary font-black text-xs tracking-widest uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary/70"></span> Kategorije
            </h4>
            <ul className="grid grid-cols-2 gap-y-4 gap-x-4">
              {[
                { path: 'poslovi', label: 'Poslovi' },
                { path: 'majstori', label: 'Majstori' },
                { path: 'firme', label: 'Firme' },
                { path: 'smestaj', label: 'Smeštaj' },
                { path: 'ketering', label: 'Ketering' },
                { path: 'alat-i-oprema', label: 'Alat i oprema' },
                { path: 'gradjevinske-masine', label: 'Građevinske mašine' },
                { path: 'placevi', label: 'Placevi' },
                { path: 'cene-i-statistika', label: 'Cene i Statistika' },
                { path: 'kalkulator', label: 'AI Kalkulator' }
              ].map((item) => (
                <li key={item.path}>
                  <Link to={item.path === 'cene-i-statistika' ? '/cene-i-statistika' : `/${item.path}`} className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium cursor-pointer">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-secondary font-black text-xs tracking-widest uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary/70"></span> Kompanija
            </h4>
            <ul className="space-y-4">
              <li><Link to="/o-nama" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium">O nama</Link></li>
              <li><Link to="/kontakt" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium">Kontakt</Link></li>
              <li><Link to="/korisni-linkovi" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium">Korisni linkovi</Link></li>
              <li>
                <div className="text-sm font-black tracking-widest flex items-center gap-1 uppercase relative group/magazine cursor-default">
                  <span className="!text-transparent bg-clip-text bg-[linear-gradient(110deg,#0061a5_40%,#60a5fa_100%)]">Magazin</span>
                  
                  {/* Tooltip Popup */}
                  <div className="absolute bottom-full left-0 mb-3 pointer-events-none opacity-0 group-hover/magazine:opacity-100 transition-all duration-300 scale-90 group-hover/magazine:scale-100 z-50 transform-gpu">
                    <div className="bg-[#0F1923] border border-secondary/50 p-3 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] whitespace-nowrap">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-secondary text-sm">construction</span>
                        <span className="text-secondary font-black text-[10px] uppercase tracking-widest">Uskoro</span>
                      </div>
                      <p className="text-white text-[11px] font-medium">Magazin stiže uskoro!</p>
                      {/* Arrow */}
                      <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-[#0F1923]"></div>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <div className="text-[#b35b10]/50 text-[16px] leading-[20px] font-black tracking-widest flex items-center gap-1 uppercase relative group/partner cursor-default">
                  Partner (Affiliate)
                  
                  {/* Tooltip Popup */}
                  <div className="absolute bottom-full left-0 mb-3 pointer-events-none opacity-0 group-hover/partner:opacity-100 transition-all duration-300 scale-90 group-hover/partner:scale-100 z-50 transform-gpu">
                    <div className="bg-[#0F1923] border border-secondary/50 p-3 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.5)] whitespace-nowrap">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-secondary text-sm">construction</span>
                        <span className="text-secondary font-black text-[10px] uppercase tracking-widest">Uskoro</span>
                      </div>
                      <p className="text-white text-[11px] font-medium">Affiliate program stiže uskoro!</p>
                      {/* Arrow */}
                      <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-[#0F1923]"></div>
                    </div>
                  </div>
                </div>
              </li>
              <li><Link to="/postavi-oglas" className="text-secondary hover:text-yellow-400 font-bold transition-colors text-sm flex items-center gap-1 hover:translate-x-1 duration-300"><span className="material-symbols-outlined text-[16px]">add_circle</span> Predaj oglas</Link></li>
              {user && (user.email === 'mancoresolution@gmail.com' || user.email === 'sandbox@svetgradjevine.com' || user.role === 'admin' || user.isAdmin) && (
                <li><Link to="/admin" className="text-red-400 hover:text-red-300 font-black transition-colors text-sm flex items-center gap-1 mt-2 hover:translate-x-1 duration-300"><span className="material-symbols-outlined text-[16px]">terminal</span> Admin Hub</Link></li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-secondary font-black text-xs tracking-widest uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary/70"></span> Pravne Info
            </h4>
            <ul className="space-y-4">
              <li><Link to="/privatnost" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium">Privatnost</Link></li>
              <li><Link to="/uslovi-koriscenja" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium">Uslovi korišćenja</Link></li>
              <li><Link to="/pravila-oglasavanja" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium">Pravila oglašavanja</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col justify-between items-center gap-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          
          <div className="flex items-center gap-6 md:gap-8 flex-wrap justify-center">
            <ThemeToggle className="mt-0" />
            <div className="flex items-center gap-2 text-on-surface-variant text-xs font-black uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-secondary/50 hover:text-white transition-colors cursor-default">
              <span className="material-symbols-outlined text-[16px]">public</span> Srbija (SRB)
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant text-xs font-black uppercase tracking-wider bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-secondary/50 hover:text-white transition-colors cursor-default">
              <span className="material-symbols-outlined text-[16px] text-green-500">verified_user</span> Sigurna Platforma
            </div>
          </div>
          
          <div className="text-on-surface-variant text-xs font-medium uppercase tracking-widest text-center mt-2">
            © {new Date().getFullYear()} Svet Građevine. Sva prava zadržana.
          </div>
        </div>
      </div>
    </footer>
  );
}
