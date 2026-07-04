import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { useBrandLogo } from "@/src/context/BrandContext";
import { useBotDetector } from "@/src/hooks/useBotDetector";
import { Button } from "@/src/components/ui/Button";
import { useDashboardNavigation } from "@/src/modules/dashboard/hooks/useDashboardNavigation";
import logoImage from "@/src/assets/images/logo.webp";

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { logoUrl } = useBrandLogo();
  const isBot = useBotDetector();
  const { getNavItems } = useDashboardNavigation();
  const navItems = getNavItems((user as any)?.role || (user as any)?.userType || 'standard');

  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const [imgError, setImgError] = useState(false);
  const profileSrc = user?.businessProfile?.logo || user?.photoURL || "";
  const userInitial = ((user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") || "UP").toUpperCase();

  // Ime za prikaz: za firme (poslodavce) prioritet na ime firme, inače ime i prezime
  const displayName = (user as any)?.role === 'poslodavac'
    ? (user?.company || (user as any)?.businessProfile?.companyName || user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Korisnik')
    : (user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Korisnik');

  // Reset imgError when URL changes
  useEffect(() => {
    setImgError(false);
  }, [profileSrc]);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinkClass = (path: string, disabled: boolean = false) => `
    relative px-3 py-2 rounded-[10px] text-sm font-bold transition-all duration-300 flex items-center gap-2 group ${disabled ? 'group/tooltip cursor-not-allowed opacity-70' : ''}
    ${
      isActive(path) && !disabled
        ? "text-secondary bg-secondary/10 shadow-[inset_0_0_0_1px_rgba(254,191,13,0.2)]"
        : "text-on-surface-variant hover:-translate-y-2 hover:shadow-lg hover:shadow-black/20"
    }
  `;

  const renderDisabledTooltip = (isMobile = false) => {
    if (isMobile) {
      return (
        <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 group-focus/tooltip:opacity-100 group-active/tooltip:opacity-100 transition-all duration-300 scale-95 group-hover/tooltip:scale-100 group-focus/tooltip:scale-100 group-active/tooltip:scale-100 z-50 w-max">
          <div className="bg-[#0b131a]/95 backdrop-blur-md border border-white/10 py-1.5 px-3 rounded-[8px] shadow-lg flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[14px]">hourglass_empty</span>
            <span className="text-white/90 text-[11px] font-bold tracking-wide">Stiže uskoro!</span>
          </div>
        </div>
      );
    }

    return (
      <div className="absolute top-full mt-2 w-max left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 group-focus/tooltip:opacity-100 group-active/tooltip:opacity-100 transition-all duration-300 scale-90 group-hover/tooltip:scale-100 group-focus/tooltip:scale-100 group-active/tooltip:scale-100 z-50">
        <div className="bg-[#0b131a]/95 backdrop-blur-md border border-white/10 p-4 md:p-5 rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.5)] whitespace-nowrap md:min-w-[260px] flex flex-col items-start text-left">
          <div className="flex items-center gap-2.5 mb-2">
            <img src={logoImage} alt="Svet Građevine Logo" className="h-5 md:h-6 w-auto object-contain drop-shadow-md flex-shrink-0" />
            <span className="text-secondary font-black text-[11px] md:text-[12px] uppercase tracking-widest">USKORO!</span>
          </div>
          <p className="text-white/90 text-[12px] md:text-[13px] font-medium tracking-wide">Ova sekcija stiže uskoro!</p>
        </div>
      </div>
    );
  };

  const hoverGradient =
    "group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-[linear-gradient(110deg,#F8A010_0%,#FEBF0D_100%)] transition-all duration-300";

  return (
    <>
<nav className={`bg-surface/40 backdrop-blur-2xl fixed top-0 left-0 w-full z-[200] border-b border-white/5 h-24 transition-all`}>
      <div className="flex justify-between items-center px-4 sm:px-8 h-full max-w-7xl mx-auto w-full">

          <div className="flex items-center gap-2 -ml-5 sm:ml-0">
            <Link to="/" className="flex items-center group">
              <img
                src={logoImage}
                alt="Svet Građevine Logo"
                className="h-8 sm:h-10 md:h-14 w-auto object-contain"
              />
            </Link>
          </div>
          
          {isDesktop && (
            <div className="flex items-center gap-1 bg-surface-container-lowest/30 backdrop-blur-md p-1.5 px-3 rounded-[10px] border border-white/5">
              <Link to="/" className={navLinkClass("/")}>
                <span className={isActive("/") ? "" : hoverGradient}>Naslovna</span>
              </Link>
              <Link to="/poslovi" className={navLinkClass("/poslovi")}>
                <span className={isActive("/poslovi") ? "" : hoverGradient}>
                  Poslovi
                </span>
              </Link>
              <Link to="/majstori" className={navLinkClass("/majstori")}>
                <span className={isActive("/majstori") ? "" : hoverGradient}>
                  Majstori
                </span>
              </Link>
              <Link to="/firme" className={navLinkClass("/firme")}>
                <span className={isActive("/firme") ? "" : hoverGradient}>
                  Firme
                </span>
              </Link>
              <Link to="/smestaj" className={navLinkClass("/smestaj")}>
                <span className={isActive("/smestaj") ? "" : hoverGradient}>
                  Smeštaj
                </span>
              </Link>
              <Link to="/ketering" className={navLinkClass("/ketering")}>
                <span className={isActive("/ketering") ? "" : hoverGradient}>
                  Ketering
                </span>
              </Link>
              <Link to="/alat-i-oprema" className={navLinkClass("/alat-i-oprema", true)} onClick={(e) => e.preventDefault()} tabIndex={0}>
                <span className={hoverGradient}>
                  Alat i oprema
                </span>
                {renderDisabledTooltip(false)}
              </Link>
              <Link
                to="/gradjevinske-masine"
                className={navLinkClass("/gradjevinske-masine", true)}
                onClick={(e) => e.preventDefault()}
                tabIndex={0}
              >
                <span
                  className={hoverGradient}
                >
                  Građevinske mašine
                </span>
                {renderDisabledTooltip(false)}
              </Link>
              <Link to="/placevi" className={navLinkClass("/placevi", true)} onClick={(e) => e.preventDefault()} tabIndex={0}>
                <span className={hoverGradient}>
                  Placevi
                </span>
                {renderDisabledTooltip(false)}
              </Link>
            </div>
          )}

          {!isBot && isDesktop && user && (
            <div className="relative flex items-center justify-center min-w-[60px] mx-4 group/avatar">
              <Link
                to="/kontrolna-tabla"
                className="w-10 h-10 p-0 shrink-0 flex-none rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-black hover:bg-primary hover:text-on-primary shadow-lg overflow-hidden transition-all"
                title="Kontrolna Tabla"
              >
                {profileSrc && !imgError ? (
                  <img
                    src={profileSrc}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-sm font-black !text-black">{userInitial}</span>
                )}
              </Link>

              {/* Avatar Dropdown — moderan redizajn */}
              <div className="absolute top-[calc(100%+12px)] right-0 w-[288px] opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all duration-300 translate-y-2 group-hover/avatar:translate-y-0 z-50">
                <div className="relative bg-[#0d141b] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col">
                  {/* Glow linija na vrhu */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent" />

                  {/* User Header sa gradient pozadinom */}
                  <div className="relative pl-0 pr-4 py-4 bg-gradient-to-br from-secondary/10 via-transparent to-primary/5 overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-secondary/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                        {profileSrc && !imgError ? (
                          <img
                            src={profileSrc}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                          />
                        ) : (
                          <span className="text-sm font-black !text-black">{userInitial}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        {(user as any)?.role && (
                          <span className="block text-[9px] text-secondary font-black uppercase tracking-[0.2em] mb-0.5">
                            {(user as any).role}
                          </span>
                        )}
                        <span className="block text-sm text-white font-black truncate leading-tight">{displayName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Nav Items */}
                  <div className="py-2 max-h-[340px] overflow-y-auto no-scrollbar">
                    <div className="px-2 space-y-0.5">
                      {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`group/item relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-[250px] mx-auto ${
                              active
                                ? "bg-secondary/10 text-white"
                                : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 ${active ? "h-6 bg-secondary" : "h-0 bg-secondary group-hover/item:h-5"}`} />
                            <span className={`material-symbols-outlined text-[20px] transition-all duration-200 group-hover/item:scale-110 ${active ? "text-secondary opacity-100" : "opacity-60 group-hover/item:opacity-100 group-hover/item:text-secondary"}`}>{item.icon}</span>
                            <span className="text-[11px] font-black tracking-wider uppercase flex-1">{item.label}</span>
                            {item.badge && (
                              <span className="bg-secondary text-black text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[20px] text-center leading-none flex items-center justify-center">{item.badge}</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>

                  {/* Suptilan tanki divider između opcija i footer akcija */}
                  <div className="mx-4 h-px bg-white/10" />

                  {/* Footer: Podešavanja & Odjava (bez pozadine) */}
                  <div className="pb-2 pt-1 w-full text-center">
                    <div className="px-2 space-y-0.5 w-full">
                      <Link
                        to="/podesavanja"
                        className="group/item relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5 w-[250px] mx-auto"
                      >
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0 group-hover/item:w-1 group-hover/item:h-5 bg-secondary rounded-r-full transition-all duration-300" />
                        <span className="material-symbols-outlined text-[20px] opacity-60 group-hover/item:opacity-100 group-hover/item:text-secondary transition-all duration-200 group-hover/item:scale-110 shrink-0">settings</span>
                        <span className="text-[11px] font-black tracking-wider uppercase flex-1 text-left">Podešavanja</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => logout()}
                        className="group/item relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 w-[250px] mx-auto text-left"
                      >
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0 group-hover/item:w-1 group-hover/item:h-5 bg-red-500 rounded-r-full transition-all duration-300" />
                        <span className="material-symbols-outlined text-[20px] opacity-60 group-hover/item:opacity-100 group-hover/item:scale-110 transition-all duration-200 shrink-0">logout</span>
                        <span className="text-[11px] font-black tracking-wider uppercase flex-1 text-left">Odjava</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 lg:gap-4 lg:ml-2">
            {isDesktop && (
              <div className="flex items-center gap-3">
                <Button
                  to="/postavi-oglas"
                  variant="nav-premium"
                  icon="add_circle"
                >
                  Postavi
                  <br />
                  Oglas
                </Button>

                {!isBot && !user && (
                  <Button
                    to="/prijava"
                    variant="blue"
                    icon="login"
                  >
                    Prijavi se
                  </Button>
                )}
              </div>
            )}

            {!isDesktop && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 z-[200] focus:outline-none active:scale-95 touch-target ${
                  isOpen 
                    ? 'text-yellow-500 bg-yellow-500/10' 
                    : 'text-white hover:bg-white/5'
                }`}
                aria-label="Meni"
                aria-controls="mobile-drawer"
                aria-expanded={isOpen}
              >
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <span className={`material-symbols-outlined absolute transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'} text-[44px] font-normal leading-none`}>
                    menu
                  </span>
                  <span className={`material-symbols-outlined absolute transition-all duration-300 ${isOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'} text-[36px] font-light leading-none`}>
                    close
                  </span>
                </div>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay — moderan redizajn */}
      {!isDesktop && (
        <div 
          role="dialog"
          aria-modal="true"
          className={`fixed inset-0 z-[150] transition-all duration-500 ease-[0.16, 1, 0.3, 1] ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" onClick={() => setIsOpen(false)} />

          {/* Drawer Content */}
          <div className={`absolute inset-0 flex flex-col px-4 pt-24 pb-8 transition-transform duration-500 ease-[0.16, 1, 0.3, 1] ${isOpen ? 'translate-x-0' : 'translate-x-8'}`}>

            {/* User / Greeting Header kartica */}
            {user ? (
              <div className="relative mb-4 p-4 rounded-2xl bg-gradient-to-br from-secondary/10 via-white/[0.03] to-primary/5 border border-white/10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-secondary/20 to-transparent blur-xl pointer-events-none" />
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                    {profileSrc && !imgError ? (
                      <img
                        src={profileSrc}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <span className="text-base font-black !text-black">{userInitial}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[9px] text-secondary font-black uppercase tracking-[0.2em] mb-0.5">Prijavljeni ste kao</span>
                    <span className="block text-sm text-white font-black truncate leading-tight">{displayName}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative mb-4 p-4 rounded-2xl bg-gradient-to-br from-secondary/10 via-white/[0.03] to-primary/5 border border-white/10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-secondary/20 to-transparent blur-xl pointer-events-none" />
                <div className="relative flex items-center gap-3">
                  <img
                    src={logoImage}
                    alt="SG"
                    className="shrink-0"
                    style={{ width: '60px', height: '12px', objectFit: 'contain', objectPosition: 'left' }}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm text-white font-black leading-tight">Dobrodošli na <span className="text-secondary">Svet Građevine</span></span>
                    <span className="block text-[10px] text-white/50 font-bold uppercase tracking-widest mt-0.5">Prijavite se ili se registrujte</span>
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable Nav Links */}
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1 mb-4 scrollbar-hide no-scrollbar">
              <nav role="menu" className="flex flex-col gap-1">
                {[ 
                  { path: "/", label: "Naslovna", icon: "home" },
                  { path: "/poslovi", label: "Poslovi", icon: "work" },
                  { path: "/majstori", label: "Majstori", icon: "engineering" },
                  { path: "/firme", label: "Firme", icon: "domain" },
                  { path: "/smestaj", label: "Smeštaj", icon: "bed" },
                  { path: "/ketering", label: "Ketering", icon: "restaurant" },
                  { path: "/alat-i-oprema", label: "Alat i oprema", icon: "build", disabled: true },
                  { path: "/gradjevinske-masine", label: "Građevinske mašine", icon: "precision_manufacturing", disabled: true },
                  { path: "/placevi", label: "Placevi", icon: "location_on", disabled: true }
                ].map((link) => {
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      tabIndex={link.disabled ? 0 : undefined}
                      onClick={(e) => {
                        if (link.disabled) {
                          e.preventDefault();
                          return;
                        }
                        setIsOpen(false);
                      }}
                      className={`group/item relative flex items-center gap-3 py-3 px-4 min-h-12 rounded-xl text-sm font-bold transition-all duration-200 justify-start ${link.disabled ? 'group/tooltip cursor-not-allowed opacity-70' : ''} ${
                        active && !link.disabled
                          ? "bg-secondary/10 text-white"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 ${active && !link.disabled ? "h-7 bg-secondary" : "h-0 bg-secondary group-hover/item:h-6"}`} />
                      <span className={`material-symbols-outlined text-[22px] transition-all duration-200 ${active && !link.disabled ? "text-secondary opacity-100" : "opacity-50 group-hover/item:opacity-100 group-hover/item:text-secondary group-hover/item:scale-110"}`}>{link.icon}</span>
                      <span className="uppercase tracking-wider flex-1">{link.label}</span>
                      {link.disabled && renderDisabledTooltip(true)}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Fixed Footer actions */}
            <div className="flex flex-col gap-3 shrink-0 relative z-20">
              {!isBot && (
                <>
                  {user ? (
                    <a
                      href="/kontrolna-tabla"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-4 bg-white/[0.06] hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-2xl text-center font-black text-sm flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <span className="material-symbols-outlined text-lg">dashboard</span>
                      KONTROLNA TABLA
                    </a>
                  ) : (
                    <a
                      href="/prijava"
                      onClick={() => setIsOpen(false)}
                      className="w-full py-4 bg-white/[0.06] hover:bg-white/10 text-white border border-white/10 hover:border-white/20 rounded-2xl text-center font-black text-sm flex items-center justify-center gap-2 transition-all duration-200"
                    >
                      <span className="material-symbols-outlined text-lg">login</span>
                      PRIJAVI SE
                    </a>
                  )}
                </>
              )}

              <a
                href="/postavi-oglas"
                onClick={() => setIsOpen(false)}
                className="w-full py-4 bg-gradient-to-br from-[#FEBF0D] to-[#F8A010] !text-black rounded-2xl text-center font-black uppercase tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:-translate-y-0.5 transition-all duration-200 mt-1 mb-safe-bottom"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                Postavi Oglas
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
