import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { useBrandLogo } from "@/src/context/BrandContext";
import { useBotDetector } from "@/src/hooks/useBotDetector";
import { Button } from "@/src/components/ui/Button";
import logoImage from "@/src/assets/images/logo.webp";

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();
  const { logoUrl } = useBrandLogo();
  const isBot = useBotDetector();
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

  const [imgError, setImgError] = useState(false);
  const profileSrc = user?.businessProfile?.logo || user?.photoURL || "";
  const userInitial = ((user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") || "UP").toUpperCase();

  // Reset imgError when URL changes
  useEffect(() => {
    setImgError(false);
  }, [profileSrc]);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinkClass = (path: string) => `
    relative px-3 py-2 rounded-[10px] text-sm font-bold transition-all duration-300 flex items-center gap-2 group
    ${
      isActive(path)
        ? "text-secondary bg-secondary/10 shadow-[inset_0_0_0_1px_rgba(254,191,13,0.2)]"
        : "text-on-surface-variant hover:-translate-y-2 hover:shadow-lg hover:shadow-black/20"
    }
  `;

  const hoverGradient =
    "group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-[linear-gradient(110deg,#F8A010_0%,#FEBF0D_100%)] transition-all duration-300";

  return (
    <>
<nav className="bg-surface/40 backdrop-blur-2xl fixed top-0 left-0 w-full z-[200] border-b border-white/5 h-24 transition-all">
      <div className="flex justify-between items-center px-4 sm:px-8 h-full max-w-7xl mx-auto w-full">

          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center group">
              <img
                src={logoUrl || logoImage}
                alt="Svet Građevine Logo"
                className="w-[120px] md:w-[160px] h-auto max-h-[80px] object-contain drop-shadow-md transition-transform group-hover:scale-105"
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
              <Link to="/alat-i-oprema" className={navLinkClass("/alat-i-oprema")}>
                <span className={isActive("/alat-i-oprema") ? "" : hoverGradient}>
                  Alat i oprema
                </span>
              </Link>
              <Link
                to="/gradjevinske-masine"
                className={navLinkClass("/gradjevinske-masine")}
              >
                <span
                  className={isActive("/gradjevinske-masine") ? "" : hoverGradient}
                >
                  Građevinske mašine
                </span>
              </Link>
              <Link to="/placevi" className={navLinkClass("/placevi")}>
                <span className={isActive("/placevi") ? "" : hoverGradient}>
                  Placevi
                </span>
              </Link>
            </div>
          )}

          {!isBot && isDesktop && (
            <div className="flex items-center justify-center min-w-[60px] mx-4">
              {user ? (
                <Link
                  to="/kontrolna-tabla"
                  className="group w-10 h-10 p-0 shrink-0 flex-none rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-black hover:bg-primary hover:text-on-primary shadow-lg overflow-hidden"
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
                    <span className="text-sm font-black text-slate-950">{userInitial}</span>
                  )}
                </Link>
              ) : (
                <Button
                  to="/prijava"
                  variant="ghost"
                  className="group w-10 h-10 p-0 shrink-0 flex-none rounded-full bg-surface-container-low border border-white/5 flex items-center justify-center text-on-surface-variant hover:text-secondary hover:bg-secondary/10 shadow-lg"
                  title="Prijavi se"
                  icon="person"
                />
              )}
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

      {/* Mobile Drawer Overlay */}
      {!isDesktop && (
        <div 
          role="dialog"
          aria-modal="true"
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-2xl flex flex-col p-8 pt-24 transition-all duration-500 ease-[0.16, 1, 0.3, 1] ${
            isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
          }`}
        >
          <div className="flex-1 min-h-[350px] flex flex-col gap-2 overflow-y-auto pr-2 mb-6" onClick={(e) => e.stopPropagation()}>
            {/* Nav links */}
                <nav role="menu" className="flex flex-col gap-2">
                  {[ 
                    { path: "/", label: "Naslovna", icon: "home" },
                    { path: "/poslovi", label: "Poslovi", icon: "work" },
                    { path: "/majstori", label: "Majstori", icon: "construction" },
                    { path: "/firme", label: "Firme", icon: "business" },
                    { path: "/smestaj", label: "Smeštaj", icon: "hotel" },
                    { path: "/ketering", label: "Ketering", icon: "restaurant" },
                    { path: "/alat-i-oprema", label: "Alat i oprema", icon: "storefront" },
                    { path: "/gradjevinske-masine", label: "Građevinske mašine", icon: "precision_manufacturing" },
                    { path: "/placevi", label: "Placevi", icon: "terrain" }
                  ].map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      role="menuitem"
                      className={`flex items-center gap-4 py-3 px-4 min-h-12 rounded-[12px] text-sm font-bold transition-all touch-target justify-start ${
                        isActive(link.path)
                          ? "text-secondary bg-secondary/10 border border-secondary/20"
                          : "text-slate-300 hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg" aria-hidden="true">{link.icon}</span>
                      <span className="sr-only">{link.label}</span>
                      {link.label}
                    </Link>
                  ))}
                </nav>
          </div>

          {/* Footer actions inside drawer */}
          <div className="flex flex-col gap-4 pt-6 border-t border-white/5">
            {!isBot && (
              <>
                {user ? (
                  <Link
                    to="/kontrolna-tabla"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[12px] text-center font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                    Dashboard ({user.firstName || 'Korisnik'})
                  </Link>
                ) : (
                  <Link
                    to="/prijava"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[12px] text-center font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">login</span>
                    Prijavi se
                  </Link>
                )}
              </>
            )}

            <Link
              to="/postavi-oglas"
              onClick={() => setIsOpen(false)}
              className="w-full py-4 bg-gradient-to-br from-[#FEBF0D] to-[#F8A010] text-slate-950 rounded-[12px] text-center font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Postavi Oglas
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
