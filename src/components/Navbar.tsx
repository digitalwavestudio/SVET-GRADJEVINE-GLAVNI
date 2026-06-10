import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { useBrandLogo } from "@/src/context/BrandContext";
import { useBotDetector } from "@/src/hooks/useBotDetector";
import { Button } from "@/src/components/ui/Button";
import logoImage from "@/src/assets/images/logo.png";

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();
  const { logoUrl } = useBrandLogo();
  const isBot = useBotDetector();
  const [isOpen, setIsOpen] = useState(false);

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
<nav className="bg-surface/40 backdrop-blur-2xl fixed top-0 left-0 w-full z-[100] border-b border-white/5 h-24 transition-all">
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
          <div className="hidden lg:flex items-center gap-1 bg-surface-container-lowest/30 backdrop-blur-md p-1.5 px-3 rounded-[10px] border border-white/5">
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

          {!isBot && (
            <div className="hidden lg:flex items-center justify-center min-w-[60px] mx-4">
              {user ? (
                <Button
                  to="/moj-profil"
                  variant="ghost"
                  className="group w-10 h-10 p-0 shrink-0 flex-none rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-black hover:bg-primary hover:text-on-primary shadow-lg"
                  title="Moj Profil"
                >
                  {(user.firstName?.[0] || "") + (user.lastName?.[0] || "") ||
                    "UP"}
                </Button>
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
            {/* Mobile Postavi Oglas Shortcut */}
            <Button
              to="/postavi-oglas"
              variant="nav-premium"
              icon="add_circle"
              className="sm:hidden !min-h-0 !min-w-0 !h-10 !py-1 !px-2.5 mr-14 text-[10px] uppercase font-black tracking-wider shadow-md"
            >
              Postavi
            </Button>

            <div className="hidden sm:flex items-center gap-3">
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

            <button
  onClick={() => setIsOpen(!isOpen)}
  className="lg:hidden absolute right-4 top-4 w-[48px] h-12 flex flex-col justify-center items-center rounded-[10px] border border-white/10 bg-primary/10 text-white focus:outline-none hover:bg-primary/20 active:scale-95 transition-all duration-300 z-[200] focus-visible:ring-2 focus-visible:ring-primary/50 touch-target"
  style={{ left: 'auto', right: '16px' }}
  aria-label="Meni"
  aria-controls="mobile-drawer"
  aria-expanded={isOpen}
>
  <span className={`w-6 h-[2px] bg-white rounded-full transition-transform duration-300 ${isOpen ? 'rotate-45 translate-y-[5px]' : ''}`}>
  </span>
  <span className={`w-6 h-[2px] bg-white rounded-full transition-opacity duration-300 my-[3px] ${isOpen ? 'opacity-0' : ''}`}>
  </span>
  <span className={`w-6 h-[2px] bg-white rounded-full transition-transform duration-300 ${isOpen ? '-rotate-45 -translate-y-[5px]' : ''}`}>
  </span>
</button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div 
        role="dialog"
        aria-modal="true"
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-2xl lg:hidden flex flex-col justify-between p-8 pt-32 transition-all duration-500 ease-[0.16, 1, 0.3, 1] ${
          isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex flex-col gap-6 overflow-y-auto max-h-[60vh] pr-2" onClick={(e) => e.stopPropagation()}>
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
                  to="/moj-profil"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-[12px] text-center font-bold text-xs flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">person</span>
                  Moj Profil ({user.firstName || 'Korisnik'})
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
    </>
  );
}
