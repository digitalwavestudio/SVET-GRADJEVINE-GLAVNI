import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { motion } from 'motion/react';
import { useCheckoutVerification } from '../hooks/useCheckoutVerification';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const { isProvisioned, isLoading, error, status } = useCheckoutVerification(sessionId);

  return (
    <div className="bg-[#070B0F] min-h-screen text-white font-sans flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 mt-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#0A0F14] border border-secondary/20 rounded-[20px] p-10 text-center shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-secondary/10 blur-[60px] rounded-full"></div>
          
          {isLoading && (
            <div className="space-y-6">
              <div className="w-16 h-16 border-4 border-white/10 border-t-secondary rounded-full animate-spin mx-auto"></div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-white">Obrada u toku...</h1>
              <p className="text-white/60 text-sm font-medium">Završavamo vašu transakciju... Molimo sačekajte.</p>
              <button disabled className="w-full bg-white/5 text-white/30 font-black py-4 rounded-[10px] uppercase tracking-widest text-xs cursor-not-allowed">
                Molimo sačekajte
              </button>
            </div>
          )}

          {isProvisioned && (
             <div className="space-y-6">
                <div className="w-20 h-20 bg-secondary/20 rounded-full flex items-center justify-center mx-auto relative">
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="material-symbols-outlined text-secondary text-5xl"
                  >
                    check_circle
                  </motion.span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-green-400">Uspešno!</h1>
                <p className="text-white/60 text-sm leading-relaxed mb-8 font-medium">
                  Vaši krediti/paketi/oglas su sada dostupni. Hvala Vam na ukazanom poverenju!
                </p>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-secondary text-slate-950 font-black py-4 rounded-[10px] uppercase tracking-widest text-xs hover:bg-yellow-400 transition-all"
                >
                  Nazad na Dashboard
                </button>
             </div>
          )}

          {!isLoading && !isProvisioned && error === 'timeout' && (
             <div className="space-y-6">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto relative">
                  <span className="material-symbols-outlined text-yellow-500 text-5xl">pending_actions</span>
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-yellow-400">Status Na Čekanju</h1>
                <p className="text-white/60 text-sm font-medium">
                  Transakcija se obrađuje. Proverite vaš Dashboard za ažuriranja ili kontaktirajte podršku.
                </p>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full border border-yellow-500/30 text-yellow-500 font-black py-4 rounded-[10px] uppercase tracking-widest text-xs hover:bg-yellow-500/10 transition-all"
                >
                  Otvorite Dashboard
                </button>
             </div>
          )}

          {!isLoading && !isProvisioned && error === 'network_error' && (
             <div className="space-y-6">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto relative">
                  <span className="material-symbols-outlined text-red-500 text-5xl">warning</span>
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-red-400">Greška u Komunikaciji</h1>
                <p className="text-white/60 text-sm font-medium">
                  Došlo je do greške prilikom provere statusa. Pokušajte ponovno kasnije.
                </p>
                <button 
                  onClick={() => navigate(-1)}
                  className="w-full border border-red-500/30 text-red-500 font-black py-4 rounded-[10px] uppercase tracking-widest text-xs hover:bg-red-500/10 transition-all"
                >
                  Nazad
                </button>
             </div>
          )}

          {!isLoading && !isProvisioned && error === 'session_not_found' && (
             <div className="space-y-6">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto relative">
                  <span className="material-symbols-outlined text-red-500 text-5xl">error</span>
                </div>
                <h1 className="text-2xl font-black uppercase tracking-tighter text-red-400">Sesija Nije Pronađena</h1>
                <p className="text-white/60 text-sm font-medium">
                  Ne možemo pronaći podatke o vašoj sesiji plaćanja.
                </p>
                <button 
                  onClick={() => navigate(-1)}
                  className="w-full border border-red-500/30 text-red-500 font-black py-4 rounded-[10px] uppercase tracking-widest text-xs hover:bg-red-500/10 transition-all"
                >
                  Nazad na Checkout
                </button>
             </div>
          )}

          {sessionId && (
             <div className="mt-10 pt-6 border-t border-white/5">
                <p className="text-[9px] font-mono text-white/20 uppercase">Transaction Ref: {sessionId}</p>
                {status && <p className="text-[9px] font-mono text-white/40 uppercase mt-1">Status: {status}</p>}
             </div>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
