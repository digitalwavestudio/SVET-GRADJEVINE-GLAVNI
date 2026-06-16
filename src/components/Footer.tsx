import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/src/constants/config';
import { useAuth } from '@/src/context/AuthContext';
import { useBrandLogo } from '@/src/context/BrandContext';
import ThemeToggle from '@/src/components/ThemeToggle';
import { Facebook, Instagram, Linkedin } from 'lucide-react';
import logoImage from '@/src/assets/images/logo.png';

export default function Footer() {
  const { user } = useAuth();
  const { logoUrl } = useBrandLogo();

  return (
    <footer role="contentinfo" className="bg-[#0a1016] w-full pt-16 md:pt-24 pb-8 md:pb-12 px-4 sm:px-8 border-t border-white/5 relative overflow-hidden">
      {/* Background glow for luxury feel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[1px] bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-secondary/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-[1920px] mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12 lg:mb-16">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-4 pr-0 lg:pr-8 flex flex-col items-center sm:items-start text-center sm:text-left">
            <Link to="/" className="flex items-center gap-3 group mb-6 lg:mb-8 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg" aria-label="Svet Građevine home">
              <img width="800" height="600" decoding="async" src={logoUrl || logoImage} alt="Svet Građevine Logo" loading="lazy" className="w-[180px] md:w-[220px] h-auto max-h-[100px] object-contain drop-shadow-md" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 lg:mb-8 max-w-sm">
              Najveća regionalna platforma za građevinsku industriju. Pronađite <strong className="font-bold text-slate-200">najbolje građevinske poslove</strong>, pouzdane <strong className="font-bold text-slate-200">majstore i radnike</strong>, iznajmite mehanizaciju ili pronađite adekvatan smeštaj i placeve.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-4">
              <a href={APP_CONFIG.SOCIAL.FACEBOOK} target="_blank" rel="noopener noreferrer" aria-label="Posetite našu Facebook grupu" className="w-10 h-10 rounded-[10px] bg-white/10 border border-white/20 flex items-center justify-center text-slate-400 hover:bg-secondary hover:border-secondary hover:text-on-secondary hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,193,7,0.2)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <Facebook size={20} />
              </a>
              <a href={APP_CONFIG.SOCIAL.INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Pratite nas na Instagramu" className="w-10 h-10 rounded-[10px] bg-white/10 border border-white/20 flex items-center justify-center text-slate-400 hover:bg-secondary hover:border-secondary hover:text-on-secondary hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,193,7,0.2)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <Instagram size={20} />
              </a>
              <a href={APP_CONFIG.SOCIAL.LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="Posetite našu LinkedIn stranicu" className="w-10 h-10 rounded-[10px] bg-white/10 border border-white/20 flex items-center justify-center text-slate-400 hover:bg-secondary hover:border-secondary hover:text-on-secondary hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,193,7,0.2)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Categories Columns */}
          <div className="sm:col-span-2 lg:col-span-4 mt-4 sm:mt-0">
            <h4 className="text-secondary font-black text-xs tracking-widest uppercase mb-5 flex items-center justify-center sm:justify-start gap-2">
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
                { path: 'gradjevinske-masine', label: 'Mašine' },
                { path: 'placevi', label: 'Placevi' },
                { path: 'cene-i-statistika', label: 'Statistika' },
                { path: 'kalkulator', label: 'AI Kalkulator' }
              ].map((item) => (
                <li key={item.path} className="flex items-center justify-center sm:justify-start text-center sm:text-left">
                  <Link to={`/${item.path}`} className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium cursor-pointer touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label={item.label}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-center sm:items-start">
            <h4 className="text-secondary font-black text-xs tracking-widest uppercase mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary/70"></span> Kompanija
            </h4>
            <ul className="space-y-4 text-center sm:text-left flex flex-col items-center sm:items-start">
              <li><Link to="/o-nama" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="O nama">O nama</Link></li>
              <li><Link to="/kontakt" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="Kontakt">Kontakt</Link></li>
              <li><Link to="/korisni-linkovi" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="Korisni linkovi">Korisni linkovi</Link></li>
              <li>
                <div className="text-[#b35b10]/50 text-[16px] leading-[20px] font-black tracking-widest flex flex-wrap items-center justify-center sm:justify-start gap-1 uppercase relative group/partner cursor-default">
                  Partner
                  <span className="lg:hidden text-[9px] text-[#b35b10] font-black ml-1 uppercase tracking-wider">(Uskoro)</span>
                  
                  {/* Tooltip Popup */}
                  <div className="hidden lg:block absolute bottom-full left-0 mb-3 pointer-events-none opacity-0 group-hover/partner:opacity-100 transition-all duration-300 scale-90 group-hover/partner:scale-100 z-50 transform-gpu">
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
              <li><Link to="/postavi-oglas" className="text-secondary hover:text-yellow-400 font-bold transition-colors text-sm flex items-center gap-1 hover:translate-x-1 duration-300 touch-target focus:outline-none focus-visible:underline" aria-label="Predaj oglas"><span className="material-symbols-outlined text-[16px]">add_circle</span> Predaj oglas</Link></li>
              {user && (user.role === 'admin' || user.isAdmin) && (
                <li><Link to="/admin" className="text-red-400 hover:text-red-300 font-black transition-colors text-sm flex items-center gap-1 mt-2 hover:translate-x-1 duration-300 touch-target focus:outline-none focus-visible:underline" aria-label="Admin Hub"><span className="material-symbols-outlined text-[16px]">terminal</span> Admin Hub</Link></li>
              )}
            </ul>
          </div>

          {/* Legal Info Column */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-center sm:items-start">
            <h4 className="text-secondary font-black text-xs tracking-widest uppercase mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary/70"></span> Pravne Info
            </h4>
            <ul className="space-y-4 text-center sm:text-left flex flex-col items-center sm:items-start">
              <li><Link to="/privatnost" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="Privatnost">Privatnost</Link></li>
              <li><Link to="/uslovi-koriscenja" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="Uslovi korišćenja">Uslovi korišćenja</Link></li>
              <li><Link to="/pravila-oglasavanja" className="text-slate-400 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="Pravila oglašavanja">Pravila oglašavanja</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col lg:flex-row justify-between items-center gap-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 flex-wrap justify-center" role="navigation" aria-label="Footer navigation">
            <ThemeToggle className="mt-0" />
            <Link to="/" className="px-5 py-3 rounded-full bg-[#0061a5] text-white font-black uppercase tracking-widest text-xs hover:bg-[#2481ff] transition-all shadow-[0_8px_30px_rgba(0,97,165,0.25)]">
              Magazin
            </Link>
          </div>
          
          <div className="text-on-surface-variant text-xs font-medium uppercase tracking-widest text-center">
            © {new Date().getFullYear()} Svet Građevine. Sva prava zadržana.
          </div>
        </div>
      </div>
    </footer>
  );
}
