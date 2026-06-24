import { OptimizedImage } from '@/src/components/OptimizedImage';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <main className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center industrial-grid overflow-hidden bg-surface text-on-surface">
      {/* Background Asymmetric Accents */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-secondary/5 to-transparent pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="container max-w-6xl mx-auto px-6 relative z-10 pt-40 pb-20">
        <div className="flex flex-col md:flex-row items-stretch gap-16">
          {/* Left Column: Visual Metaphor */}
          <div className="w-full md:w-1/2 flex flex-col justify-between">
            <div className="flex-1 flex items-center justify-center relative group">
              {/* 404 "Rock" Illustration Container */}
              <div className="relative z-10 w-full max-w-md aspect-square bg-surface-container-high flex items-center justify-center overflow-hidden border-l-4 border-secondary">
                <OptimizedImage 
                  src="" 
                  fallbackType="default" 
                  alt="404 Ilustracija" 
                  className="w-full h-full object-cover opacity-50" 
                  containerClassName="w-full h-full"
                /> 
                  
                {/* Overlay UI elements */}
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className="bg-secondary px-3 py-1 text-[10px] font-black uppercase tracking-widest !text-black">Danger Zone</span>
                </div>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-4">
                    <div className="h-[2px] flex-grow bg-secondary/30"></div>
                    <span className="text-[10px] font-mono text-secondary/60 tracking-[0.3em] uppercase">Structural Error Detected</span>
                  </div>
                </div>
              </div>
              {/* Floating Technical Data Deco */}
              <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-4 w-32 h-32 border border-outline-variant/20 pointer-events-none hidden lg:block"></div>
            </div>
            
            {/* Sector Coordinate - Aligned with bottom grid */}
            <div className="hidden lg:flex justify-center w-full mt-12">
            </div>
          </div>
          
          {/* Right Column: Messaging & Actions */}
          <div className="w-full md:w-1/2 flex flex-col justify-between text-center md:text-left">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 mb-6">
                <span className="w-12 h-[2px] bg-secondary"></span>
                <span className="text-secondary font-bold uppercase tracking-widest text-xs">Upozorenje: Prekid radova</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black font-headline text-on-surface tracking-tighter mb-4 leading-tight">
                Greška 404 - <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-yellow-300">Skrenuli ste sa gradilišta</span>
              </h1>
              <p className="text-xl text-on-surface-variant max-w-lg leading-relaxed font-body mx-auto md:mx-0">
                Stranica koju tražite ne postoji ili je uklonjena. Možda je preseljena na novu parcelu ili je projekat obustavljen.
              </p>
            </div>
            
            {/* Action Cluster */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 justify-center md:justify-start mt-12">
              <Link className="w-full sm:w-[220px] px-4 py-4 bg-secondary !text-black font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-yellow-400 transition-all active:scale-95 rounded" to="/">
                <span className="material-symbols-outlined text-xl">home</span>
                Početna
              </Link>
              <Link className="w-full sm:w-[220px] px-4 py-4 border border-outline text-secondary font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:bg-surface-bright hover:border-secondary transition-all active:scale-95 rounded" to="/poslovi">
                <span className="material-symbols-outlined text-xl">engineering</span>
                Pretraži poslove
              </Link>
              <button onClick={() => window.history.back()} className="w-full sm:w-[456px] px-4 py-4 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-all active:scale-95 rounded">
                <span className="material-symbols-outlined text-xl">arrow_back</span>
                Nazad
              </button>
            </div>
            
            {/* Additional Help Grid */}
            <div className="pt-12 grid grid-cols-2 gap-6 border-t border-outline-variant/10 text-left mt-12">
              <div>
                <div className="text-[10px] font-black text-outline uppercase tracking-widest mb-2">Potrebna pomoć?</div>
                <Link className="text-on-surface hover:text-secondary transition-colors text-sm flex items-center gap-2 group" to="/kontakt">
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">support_agent</span>
                  Kontaktirajte podršku
                </Link>
              </div>
              <div>
                <div className="text-[10px] font-black text-outline uppercase tracking-widest mb-2">Izveštaj</div>
                <Link className="text-on-surface hover:text-secondary transition-colors text-sm flex items-center gap-2 group" to="/prijava-problema">
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">report</span>
                  Prijavite problem
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
