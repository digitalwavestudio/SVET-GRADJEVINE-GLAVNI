import { motion } from 'motion/react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';
import { PACKAGE_DEFINITIONS, PackageLevel } from '@/src/services/packageService';
import { checkoutService } from '@/src/modules/checkout/services/checkoutService';

export default function PricingPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<PackageLevel | null>(null);

  const handlePurchase = async (level: PackageLevel) => {
    if (!user) {
      addToast('Morate biti prijavljeni da biste kupili paket.', 'error');
      return;
    }

    setLoading(level);
    
    try {
      const pkg = PACKAGE_DEFINITIONS[level];
      if (!user?.id) return;
      
      const amount = level === 'starter' ? 29 : level === 'pro' ? 79 : 199;
      
      // Use checkoutService (which will be updated to use API)
      await checkoutService.createCheckout({
        packageId: level,
        amount: amount,
        paymentMethod: 'simulated'
      });

      // Also update user package (this should ideally be triggered by checkout success on server,
      // but for "simulated" immediate flow, we can call user package update API)
      const auth = (await import('firebase/auth')).getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (token) {
        await fetch('/api/users/packages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ packageId: level, duration: 30 })
        });
      }

      addToast(`Uspešno ste aktivirali ${level.toUpperCase()} paket! Dodato ${pkg.maxJobs} kredita.`, 'success');
      setTimeout(() => navigate('/moji-oglasi'), 1500);
    } catch (error) {
      console.error('Purchase error:', error);
      addToast('Greška prilikom kupovine. Pokušajte ponovo.', 'error');
    } finally {
      setLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black tracking-tighter uppercase"
          >
            Izaberi svoj <span className="text-secondary">paket moći</span>
          </motion.h1>
          <p className="text-white/40 font-bold text-xs tracking-[0.3em] uppercase">
            Poverenje se gradi kvalitetom, a vidljivost pravim paketom.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {(['starter', 'pro', 'enterprise'] as PackageLevel[]).map((level, i) => {
            const pkg = PACKAGE_DEFINITIONS[level];
            const isPro = level === 'pro';

            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col p-8 rounded-[10px] border transition-all duration-500 overflow-hidden group ${
                  isPro 
                    ? 'bg-secondary/5 border-secondary shadow-[0_0_50px_rgba(255,215,0,0.1)]' 
                    : 'bg-[#0A0F14] border-white/5 hover:border-white/20'
                }`}
              >
                {isPro && (
                  <div className="absolute top-6 right-8 bg-secondary text-slate-950 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xl">
                    Popularno
                  </div>
                )}

                <div className="space-y-6 mb-12 flex-1">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 mb-2">{level}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black tracking-tighter">€{level === 'starter' ? '29' : level === 'pro' ? '79' : '199'}</span>
                      <span className="text-xs font-bold text-white/20 uppercase">/ paket</span>
                    </div>
                  </div>

                  <div className="h-px bg-white/5"></div>

                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wide">{pkg.maxJobs} Oglasa za posao</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wide">{pkg.premiumAds} Izdvojenih oglasa</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-lg">check_circle</span>
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wide">{pkg.urgentAds} Hitnih oglasa</span>
                    </li>
                    <li className="flex items-center gap-3 opacity-50">
                      <span className={`material-symbols-outlined text-lg ${pkg.verifiedBadge ? 'text-secondary' : 'text-white/20'}`}>
                        {pkg.verifiedBadge ? 'verified' : 'cancel'}
                      </span>
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wide">Verified Badge</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-lg">speed</span>
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wide">Boost vidljivosti x{pkg.visibilityScore}</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => handlePurchase(level)}
                  disabled={loading !== null}
                  className={`w-full py-5 rounded-[10px] font-black uppercase tracking-widest text-[10px] transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                    isPro 
                      ? 'bg-secondary text-slate-950 hover:bg-yellow-400 shadow-2xl shadow-secondary/20' 
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {loading === level ? (
                    <span className="animate-spin material-symbols-outlined text-sm">refresh</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">shopping_cart</span>
                      Aktiviraj paket
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] p-12 text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-4">
             <h2 className="text-2xl font-black uppercase tracking-tight">Potreban vam je poseban dogovor?</h2>
             <p className="text-white/40 text-sm font-medium leading-relaxed">
               Ukoliko ste velika kompanija sa više od 50 oglasa mesečno, kontaktirajte naš prodajni tim za Enterprise rešenja prilagođena vašim potrebama.
             </p>
             <div className="pt-4">
               <button className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-[10px] text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all">
                 Kontaktiraj podršku
               </button>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
