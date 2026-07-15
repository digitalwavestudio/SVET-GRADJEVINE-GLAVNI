import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/src/constants/config';
import { useAuth } from '@/src/context/AuthContext';
import { useBrandLogo } from '@/src/context/BrandContext';
import ThemeToggle from '@/src/components/ThemeToggle';

import logoImage from '@/src/assets/images/logo.webp';

export default function Footer() {
  const { user } = useAuth();
  const { logoUrl } = useBrandLogo();

  return (
    <footer role="contentinfo" className="bg-[#070b14] w-full pt-4 md:pt-14 pb-4 md:pb-10 px-4 sm:px-8 border-t border-white/5 relative overflow-hidden">
      <div className="max-w-[1920px] mx-auto w-full relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-10 gap-x-2 gap-y-8 lg:gap-x-2 mb-4 lg:mb-6">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-4 pr-0 lg:pr-8 flex flex-col items-center sm:items-start text-center sm:text-left lg:-mt-6">
            <Link to="/" className="flex items-center gap-3 group mb-4 lg:mb-8 touch-target focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg md:-ml-8" aria-label="Svet Građevine home">
              <img width="800" height="600" decoding="async" src={logoUrl || logoImage} alt="Svet Građevine Logo" loading="lazy" className="w-[160px] md:w-[220px] h-auto max-h-[100px] object-contain drop-shadow-md" />
            </Link>
            <p className="hidden sm:block text-white/70 text-base leading-relaxed tracking-wide -mt-2 lg:-mt-4 mb-6 lg:mb-8 max-w-sm">
              Najveća regionalna platforma za građevinsku industriju. Pronađite <strong className="font-bold text-white">najbolje građevinske poslove</strong>, pouzdane <strong className="font-bold text-white">majstore i radnike</strong>, iznajmite mehanizaciju ili pronađite adekvatan smeštaj i placeve.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-4">
              <a href={APP_CONFIG.SOCIAL.FACEBOOK} target="_blank" rel="noopener noreferrer" aria-label="Posetite našu Facebook grupu" className="w-10 h-10 rounded-[10px] bg-white/10 border border-white/20 flex items-center justify-center text-slate-400 hover:bg-secondary hover:border-secondary hover:text-on-secondary hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,193,7,0.2)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href={APP_CONFIG.SOCIAL.INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Pratite nas na Instagramu" className="w-10 h-10 rounded-[10px] bg-white/10 border border-white/20 flex items-center justify-center text-slate-400 hover:bg-secondary hover:border-secondary hover:text-on-secondary hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,193,7,0.2)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href={APP_CONFIG.SOCIAL.LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="Povežite se na LinkedIn-u" className="w-10 h-10 rounded-[10px] bg-white/10 border border-white/20 flex items-center justify-center text-slate-400 hover:bg-secondary hover:border-secondary hover:text-on-secondary hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(255,193,7,0.2)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>

          {/* Categories Columns */}
          <div className="col-span-2 lg:col-span-2 mt-1 sm:mt-0">
            <h4 className="text-secondary font-extrabold text-[11px] sm:text-[13px] tracking-widest uppercase mb-2.5 sm:mb-4 flex items-center justify-center sm:justify-start gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-secondary/70"></span> Kategorije
            </h4>
            <ul className="space-y-1.5 sm:space-y-3 flex flex-col items-center sm:items-start">
              {([
                { path: 'poslovi', label: 'Poslovi' },
                { path: 'firme', label: 'Firme' },
                { path: 'cene-i-statistika', label: 'Statistika' },
                { path: 'kalkulator', label: 'AI Kalkulator' }
              ] as { path: string; label: string }[]).map((item) => {
                return (
                  <li key={item.path}>
                    <Link 
                      to={`/${item.path}`}
                      className="text-white/40 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm sm:text-base font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline"
                      aria-label={item.label}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Company Column */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-center sm:items-start text-center sm:text-left mt-1 sm:mt-0">
            <h4 className="text-secondary font-extrabold text-[11px] sm:text-[13px] tracking-widest uppercase mb-2.5 sm:mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-secondary/70"></span> Kompanija
            </h4>
            <ul className="space-y-1.5 sm:space-y-3 flex flex-col items-center sm:items-start">
              <li><Link to="/o-nama" className="text-white/40 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm sm:text-base font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="O nama">O nama</Link></li>
              <li><Link to="/kontakt" className="text-white/40 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm sm:text-base font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="Kontakt">Kontakt</Link></li>
              <li><Link to="/korisni-linkovi" className="text-white/40 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm sm:text-base font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="Korisni linkovi">Korisni linkovi</Link></li>
              <li>
                <div className="text-secondary hover:text-yellow-400 font-bold transition-colors text-sm sm:text-base flex items-center gap-1 hover:translate-x-1 duration-300 relative group/partner cursor-pointer" tabIndex={0}>
                  Partner
                  <span className="lg:hidden text-[9px] text-secondary font-black ml-1 uppercase tracking-wider">(Uskoro)</span>
                  
                  {/* Tooltip Popup */}
                  <div className="hidden lg:block absolute bottom-full left-0 mb-3 pointer-events-none opacity-0 group-hover/partner:opacity-100 group-focus/partner:opacity-100 transition-all duration-300 scale-90 group-hover/partner:scale-100 group-focus/partner:scale-100 z-50 transform-gpu w-max">
                    <div className="bg-[#0b131a]/95 backdrop-blur-md border border-white/10 p-4 md:p-5 rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.5)] whitespace-nowrap md:min-w-[260px] flex flex-col items-start text-left">
                      <div className="flex items-center gap-2.5 mb-2">
                        <img src={logoUrl || logoImage} alt="Svet Građevine Logo" className="h-5 md:h-6 w-auto object-contain drop-shadow-md flex-shrink-0" />
                        <span className="text-secondary font-black text-[11px] md:text-[12px] uppercase tracking-widest">USKORO!</span>
                      </div>
                      <p className="text-white/90 text-[12px] md:text-[14px] font-medium tracking-wide">Affiliate program stiže uskoro!</p>
                    </div>
                  </div>
                </div>
              </li>
              <li><Link to="/postavi-oglas" className="text-secondary hover:text-yellow-400 font-bold transition-colors text-sm sm:text-base flex items-center gap-1 hover:translate-x-1 duration-300 touch-target focus:outline-none focus-visible:underline" aria-label="Predaj oglas"><span className="material-symbols-outlined text-[18px]">add_circle</span> Predaj oglas</Link></li>
              {user && (user.role === 'admin' || user.isAdmin) && (
                <li><Link to="/admin" className="text-red-500 hover:text-red-400 font-bold transition-colors text-sm sm:text-base flex items-center gap-1 hover:translate-x-1 duration-300 touch-target focus:outline-none focus-visible:underline" aria-label="Admin Hub"><span className="material-symbols-outlined text-[18px]">terminal</span> Admin Hub</Link></li>
              )}
            </ul>
          </div>

          {/* Legal Info Column */}
          <div className="col-span-1 lg:col-span-2 flex flex-col items-center sm:items-start text-center sm:text-left mt-1 sm:mt-0">
            <h4 className="text-secondary font-extrabold text-[11px] sm:text-[13px] tracking-widest uppercase mb-2.5 sm:mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-secondary/70"></span> Pravne Info
            </h4>
            <ul className="space-y-1.5 sm:space-y-3 flex flex-col items-center sm:items-start">
              <li><Link to="/privatnost" className="text-white/40 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm sm:text-base font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="Privatnost">Privatnost</Link></li>
              <li><Link to="/uslovi-koriscenja" className="text-white/40 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm sm:text-base font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="Uslovi korišćenja">Uslovi korišćenja</Link></li>
              <li><Link to="/pravila-oglasavanja" className="text-white/40 hover:text-secondary hover:translate-x-1 inline-flex transition-all duration-300 text-sm sm:text-base font-medium touch-target focus:outline-none focus-visible:text-secondary focus-visible:underline" aria-label="Pravila oglašavanja">Pravila oglašavanja</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-2 sm:mt-4 pt-4 sm:pt-6 border-t border-white/5 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
            {/* Left: Trust Badges */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-wrap justify-center" role="navigation" aria-label="Footer navigation">
              <ThemeToggle className="mt-0" />
              
              <div className="group flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(34,197,94,0.15)] transition-all duration-300 ml-0 lg:ml-4 cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="material-symbols-outlined text-[16px] text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)] group-hover:scale-110 transition-transform duration-300 relative z-10">security</span>
                <span className="text-white/80 group-hover:text-white text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 relative z-10 whitespace-nowrap">Sigurna Platforma</span>
              </div>
              
              <div className="group flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] transition-all duration-300 cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="material-symbols-outlined text-[16px] text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)] group-hover:scale-110 transition-transform duration-300 relative z-10">verified</span>
                <span className="text-white/80 group-hover:text-white text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 relative z-10 whitespace-nowrap">Verifikovani Korisnici</span>
              </div>

              <div className="group flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_30px_rgba(168,85,247,0.15)] transition-all duration-300 cursor-default relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="material-symbols-outlined text-[16px] text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] group-hover:scale-110 transition-transform duration-300 relative z-10">lock</span>
                <span className="text-white/80 group-hover:text-white text-[9px] font-bold uppercase tracking-widest transition-colors duration-300 relative z-10 whitespace-nowrap">Sigurno Plaćanje</span>
              </div>
            </div>
            
            {/* Center: SG Group Legal */}
            <div className="text-slate-500 text-[10px] leading-relaxed text-center space-y-0.5">
              <p className="font-bold text-white/60">SG Group</p>
              <p>PIB: 114632588 &nbsp;|&nbsp; Matični broj: 67731875</p>
              <p>Tekući račun: 265-1630310011188-16</p>
            </div>

            {/* Right: Copyright */}
            <div className="text-blue-400 text-[10px] font-bold uppercase tracking-widest text-center lg:text-right whitespace-normal lg:whitespace-nowrap mb-4 lg:mb-0 max-w-[240px] mx-auto lg:mx-0 lg:max-w-none">
              © {new Date().getFullYear()} SVET GRAĐEVINE. SVA PRAVA ZADRŽANA.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
