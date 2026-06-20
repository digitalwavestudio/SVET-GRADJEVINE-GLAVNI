import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShow(false);
  };

  return (
    <>
      {show && (
        <div
          className="fixed bottom-0 left-0 w-full z-[9999] p-4 md:p-6 animate-slide-up"
        >
          <div className="max-w-7xl mx-auto bg-slate-900 border border-white/10 shadow-2xl rounded-[10px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-orange-500/10 mix-blend-overlay pointer-events-none"></div>
            
            <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
              <div className="hidden md:flex w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-gray-300">cookie</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Vaša privatnost nam je važna</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                  Koristimo kolačiće za poboljšanje korisničkog iskustva, analizu saobraćaja i personalizaciju sadržaja. Nastavkom korišćenja sajta saglasni ste sa našom upotrebom kolačića.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto relative z-10 shrink-0">
              <Link 
                to="/politika-privatnosti" 
                className="w-full sm:w-auto px-6 py-3 rounded-[10px] border border-white/20 text-gray-300 font-bold text-sm tracking-wider hover:bg-white/5 hover:text-white transition-all text-center"
              >
                Saznaj više
              </Link>
              <button 
                onClick={handleAccept}
                className="w-full sm:w-auto px-8 py-3 rounded-[10px] bg-orange-500 text-slate-950 font-black text-sm tracking-widest hover:bg-orange-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] uppercase"
              >
                Prihvatam
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
