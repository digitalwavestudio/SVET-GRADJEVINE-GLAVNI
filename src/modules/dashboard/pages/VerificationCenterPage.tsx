import { motion } from 'motion/react';
import { useState } from 'react';
import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import axios from 'axios';

export default function VerificationCenterPage() {
  const [pib, setPib] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!pib.trim()) {
      setError('Molimo unesite PIB.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await axios.post('/api/verification/submit', { pib: pib.trim() });
      setSuccess(true);
    } catch (err: unknown) {
      setError(((err as { response?: { data?: { message?: string; error?: string } } })?.response)?.data?.error || 'Greška pri slanju zahteva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto py-20 text-center">
          <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6 border border-green-500/30">
            <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-4">ZAHTEV POSLAT!</h2>
          <p className="text-white/40 font-bold text-sm uppercase tracking-widest leading-relaxed">
            VAŠ ZAHTEV JE USPEŠNO PRIMLJEN. NAŠ TIM ĆE PREGLEDATI U ROKU OD 24-48h.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">VERIFIKACIONI CENTAR</h1>
          <p className="text-white/40 font-bold text-xs tracking-[0.2em] uppercase">DOBIJTE "PROVEREN" BEDŽ NA PROFILU</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-[10px] text-red-500 text-xs font-black uppercase tracking-widest">
            {error}
          </div>
        )}

        <div className="bg-[#0A0F14] border border-white/5 rounded-[10px] overflow-hidden shadow-2xl p-8 md:p-12">
          <div className="max-w-lg mx-auto space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">NAZIV FIRME</label>
              <input
                readOnly
                className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-4 text-white/60 text-sm font-bold outline-none cursor-not-allowed"
                value={user?.name || user?.company || ''}
              />
              <p className="text-[9px] text-white/20 tracking-wider">Automatski popunjeno iz profila</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">PIB</label>
              <input
                value={pib}
                onChange={e => setPib(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-4 text-white text-sm font-bold outline-none focus:border-secondary transition-colors"
                placeholder="Unesite PIB"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-secondary text-slate-950 font-black py-4 rounded-[10px] hover:bg-yellow-400 transition-all text-[10px] tracking-widest uppercase shadow-2xl shadow-secondary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'SLANJE...' : 'POŠALJI ZAHTEV ZA VERIFIKACIJU'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
