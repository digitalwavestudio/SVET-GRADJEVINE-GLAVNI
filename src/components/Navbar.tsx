import { useEffect } from "react";
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
    <nav className="bg-surface/40 backdrop-blur-2xl fixed top-0 left-0 w-full z-[100] border-b border-white/5 h-24 transition-all">
      <div className="flex justify-between items-center px-8 h-full max-w-7xl mx-auto w-full">
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
      </div>
    </nav>
  );
}
