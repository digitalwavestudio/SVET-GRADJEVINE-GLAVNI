import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { walletService } from '@/src/modules/checkout/services/walletService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, memo, useMemo } from 'react';
import DepositModal from '../components/DepositModal';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { queryKeys } from '@/src/lib/queryKeysFactory';
import { useFinanceSummary } from '../hooks/useFinanceStats';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/src/lib/apiClient';

// ─── Premium Config ─────────────────────────────────────────────────────────
const PREMIUM_PRICE = 6000; // kredita
const PREMIUM_BENEFITS = [
  { icon: 'workspace_premium', label: 'Zlatni bedž na profilu', desc: 'Verifikovan i premium status vidljiv svim korisnicima' },
  { icon: 'visibility', label: 'Veća vidljivost oglasa', desc: 'Premium oglasi prikazuju se pre standardnih' },
  { icon: 'star', label: 'Prioritetna podrška', desc: '24/7 prioritetna korisnička podrška' },
  { icon: 'verified', label: 'Verifikovana firma', desc: 'Premium verifikacija za građevinske firme' },
  { icon: 'analytics', label: 'Napredna analitika', desc: 'Detaljna statistika pregleda i prijava' },
];

// ─── Transaction Row ─────────────────────────────────────────────────────────
const TransactionRow = memo(({ transaction }: { transaction: any }) => {
  const isPositive = transaction.amount > 0;

  const statusConfig: Record<string, { label: string; classes: string }> = {
    completed: { label: 'PROCESUIRANO', classes: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' },
    processed:  { label: 'PROCESUIRANO', classes: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' },
    pending:    { label: 'NA ČEKANJU',   classes: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
    cancelled:  { label: 'OTKAZANO',     classes: 'bg-red-500/10 text-red-500 border border-red-500/20' },
    failed:     { label: 'OTKAZANO',     classes: 'bg-red-500/10 text-red-500 border border-red-500/20' },
  };

  const status = statusConfig[transaction.status] || {
    label: transaction.status?.toUpperCase() || 'NEPOZNATO',
    classes: 'bg-white/5 text-white/40 border border-white/10',
  };

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group border-b border-white/5">
      <td className="py-5 pr-4">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
            isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'
          }`}>
            <span className="material-symbols-outlined text-lg">
              {isPositive ? 'south_west' : 'north_east'}
            </span>
          </div>
          <div>
            <div className="text-[10px] font-black text-white tracking-widest uppercase mb-1">
              {transaction.type || 'PRENOS'}
            </div>
            <div className="text-[9px] font-bold text-white/30 tracking-widest uppercase">
              {transaction.createdAt?.seconds
                ? new Intl.DateTimeFormat('sr-RS', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  }).format(transaction.createdAt.toDate())
                : 'Nedavno'}
            </div>
          </div>
        </div>
      </td>
      <td className="py-5 pr-4">
        <div className="text-[11px] font-medium tracking-wide text-white/70 max-w-[200px] truncate">
          {transaction.description || 'Sistemska transakcija / SG Krediti'}
        </div>
      </td>
      <td className="py-5 pr-4">
        <span className={`px-2.5 py-1 rounded-[4px] text-[8px] font-black tracking-[0.1em] ${status.classes}`}>
          {status.label}
        </span>
      </td>
      <td className="py-5 text-right font-mono">
        <div className={`text-sm font-black tabular-nums tracking-tighter ${
          isPositive ? 'text-emerald-500' : 'text-white'
        }`}>
          {isPositive ? '+' : ''}{transaction.amount.toLocaleString()}
          <span className="text-[10px] ml-1 opacity-50 uppercase">Kredita</span>
        </div>
      </td>
    </tr>
  );
});
TransactionRow.displayName = 'TransactionRow';

// ─── Premium Package Card ────────────────────────────────────────────────────
function PremiumPackageCard({ walletBalance, isPremium, onActivate, isActivating }: {
  walletBalance: number;
  isPremium: boolean;
  onActivate: () => void;
  isActivating: boolean;
}) {
  const hasEnough = walletBalance >= PREMIUM_PRICE;

  if (isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-3xl overflow-hidden border border-amber-500/40 bg-gradient-to-br from-[#1a1200] via-[#0f0d00] to-[#1a0f00] p-8"
      >
        {/* Gold glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-600/5 pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/15 blur-[100px] rounded-full -mt-20 -mr-20 pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="material-symbols-outlined text-black text-xl font-black">workspace_premium</span>
            </div>
            <div>
              <div className="text-amber-400 font-black text-sm tracking-widest uppercase">PREMIUM AKTIVAN</div>
              <div className="text-white/40 text-[10px] font-bold tracking-wider uppercase">Zlatni bedž je aktivan na vašem profilu</div>
            </div>
            <div className="ml-auto">
              <span className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[9px] font-black tracking-widest uppercase rounded-full">
                ✓ AKTIVAN
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PREMIUM_BENEFITS.map((b) => (
              <div key={b.label} className="flex items-start gap-3 bg-white/[0.03] rounded-xl p-4 border border-white/5">
                <span className="material-symbols-outlined text-amber-500 text-xl mt-0.5">{b.icon}</span>
                <div>
                  <div className="text-xs font-black text-white tracking-wider uppercase">{b.label}</div>
                  <div className="text-[10px] text-white/40 mt-1 leading-relaxed">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0D1218] to-[#111820] p-8 group hover:border-amber-500/30 transition-all duration-500"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[90px] rounded-full -mt-20 -mr-20 group-hover:bg-amber-500/10 transition-all duration-700 pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-400 text-xl">workspace_premium</span>
            </div>
            <div>
              <h3 className="text-white font-black text-base tracking-wide uppercase">Premium Paket</h3>
              <p className="text-white/30 text-[10px] font-bold tracking-widest uppercase">Za Građevinske Firme</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-amber-400 tabular-nums tracking-tight">
              {PREMIUM_PRICE.toLocaleString()}
            </div>
            <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Kredita</div>
          </div>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {PREMIUM_BENEFITS.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-3 bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:border-amber-500/20 hover:bg-amber-500/[0.03] transition-all"
            >
              <span className="material-symbols-outlined text-amber-500/80 text-xl mt-0.5">{b.icon}</span>
              <div>
                <div className="text-xs font-black text-white tracking-wider uppercase">{b.label}</div>
                <div className="text-[10px] text-white/40 mt-1 leading-relaxed">{b.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Balance check */}
        {!hasEnough && (
          <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400 text-lg">error</span>
            <div>
              <div className="text-[10px] font-black text-red-400 uppercase tracking-wider">Nedovoljno kredita</div>
              <div className="text-[9px] text-white/40 mt-0.5">
                Potrebno još <span className="text-red-400 font-black">{(PREMIUM_PRICE - walletBalance).toLocaleString()}</span> kredita.
                Dopunite novčanik da biste aktivirali paket.
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          id="btn-activate-premium"
          onClick={onActivate}
          disabled={!hasEnough || isActivating}
          className={`w-full py-4 rounded-xl font-black text-[11px] tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
            hasEnough && !isActivating
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-xl shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          {isActivating ? (
            <>
              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              AKTIVACIJA U TOKU...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-base">workspace_premium</span>
              AKTIVIRAJ PREMIUM – {PREMIUM_PRICE.toLocaleString()} Kredita
            </>
          )}
        </button>

        <p className="text-center text-[9px] text-white/20 font-bold uppercase tracking-widest mt-4">
          Jednokratna uplata · Bez automatskog obnavljanja
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function WalletPage() {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'novcanik' | 'premium'>('novcanik');

  const { data: financeStats, isLoading: statsLoading } = useFinanceSummary();

  const { data: transactions = [], isLoading: txLoading, refetch } = useQuery({
    queryKey: queryKeys.wallet.transactions(user?.id || 'guest'),
    queryFn: () => walletService.fetchTransactions(user?.id as string),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  // Premium activation mutation
  const activatePremiumMutation = useMutation({
    mutationFn: async () => {
      return await apiClient.post('/users/activate-premium', {});
    },
    onSuccess: () => {
      toast.success('🏆 Premium paket je uspešno aktiviran! Zlatni bedž je dodat na vaš profil.', { duration: 5000 });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactions(user?.id || '') });
      // Refresh user data so badge shows immediately
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      // Update local user state
      updateUser({ isPremium: true, premiumBadge: 'gold' } as any);
    },
    onError: (err: any) => {
      const msg = err?.message || 'Greška pri aktivaciji premium paketa.';
      toast.error(msg);
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('deposit') === 'success') {
      toast.success('Uplata je uspešno procesirana!');
      refetch();
      navigate('/novcanik', { replace: true });
    } else if (params.get('deposit') === 'cancel') {
      toast.error('Uplata je prekinuta.');
      navigate('/novcanik', { replace: true });
    }
    if (params.get('tab') === 'premium') {
      setActiveTab('premium');
    }
  }, [location.search, navigate, refetch]);

  const walletBalance = user?.walletBalance || 0;
  const isPremium = (user as any)?.isPremium || false;



  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10 pb-20"
      >
        {/* ── Header ── */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">NOVČANIK</h1>
            <p className="text-white/30 font-bold text-xs tracking-[0.3em] uppercase">SG KREDITI · TRANSAKCIJE · PAKETI</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('novcanik')}
              className={`px-5 py-2.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                activeTab === 'novcanik' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              NOVČANIK
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className={`px-5 py-2.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all flex items-center gap-1.5 ${
                activeTab === 'premium'
                  ? 'bg-gradient-to-r from-amber-500/30 to-amber-600/20 text-amber-400 border border-amber-500/30'
                  : 'text-white/30 hover:text-amber-400/60'
              }`}
            >
              <span className="material-symbols-outlined text-sm">workspace_premium</span>
              PREMIUM
              {isPremium && <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />}
            </button>
          </div>
        </header>



        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'novcanik' ? (
            <motion.div
              key="novcanik-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Balance Card */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-gradient-to-br from-[#0D1218] to-[#1A222B] border border-white/5 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-500">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[90px] rounded-full -mt-20 -mr-20 group-hover:bg-emerald-500/20 transition-all duration-700 pointer-events-none" />

                  <div className="relative">
                    <div className="flex items-center gap-3 mb-10">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isPremium ? 'bg-gradient-to-br from-amber-400 to-amber-600' : 'bg-emerald-500'}`}>
                        <span className={`material-symbols-outlined text-sm font-black ${isPremium ? 'text-black' : 'text-black'}`}>
                          {isPremium ? 'workspace_premium' : 'wallet'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-emerald-400 tracking-[0.2em] uppercase">DOSTUPNA SREDSTVA</span>
                        {isPremium && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-amber-400 text-xs">workspace_premium</span>
                            <span className="text-[9px] font-black text-amber-400 uppercase tracking-wider">PREMIUM</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 mb-10">
                      <div className="text-xs font-bold text-white/40 uppercase tracking-widest">TRENUTNI SALDO</div>
                      <div className="text-6xl font-black text-white tracking-tight tabular-nums flex items-baseline gap-2">
                        {walletBalance.toLocaleString()}
                        <span className="text-xl text-emerald-500 font-bold uppercase tracking-widest">Kredita</span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button
                        id="btn-deposit-open"
                        onClick={() => setDepositModalOpen(true)}
                        className="bg-white text-black font-black py-4 px-8 rounded-xl transition-all hover:bg-emerald-400 text-[10px] tracking-widest uppercase shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        DOPUNA
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Premium CTA */}
                {!isPremium && (
                  <div
                    className="bg-[#0A0F14] border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden cursor-pointer group hover:border-amber-500/40 transition-all"
                    onClick={() => setActiveTab('premium')}
                  >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-[60px] rounded-full -mt-10 -mr-10 pointer-events-none group-hover:bg-amber-500/10 transition-all duration-500" />
                    <div className="relative flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-amber-400">workspace_premium</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-amber-400 uppercase tracking-wider">Premium Paket</div>
                        <div className="text-[10px] text-white/30 mt-1">Aktivirajte zlatni bedž za {PREMIUM_PRICE.toLocaleString()} kredita</div>
                      </div>
                      <span className="material-symbols-outlined text-white/20 group-hover:text-amber-400 transition-colors">arrow_forward</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction History */}
              <div className="lg:col-span-8">
                <div className="bg-[#0A0F14] border border-white/5 rounded-3xl p-8 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-[11px] font-black text-white tracking-[0.25em] uppercase">ISTORIJA TRANSAKCIJA</h3>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined text-sm">filter_alt</span>
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                        <span className="material-symbols-outlined text-sm">download</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto min-h-[400px]">
                    {txLoading ? (
                      <div className="h-full flex items-center justify-center text-white/20 min-h-[300px]">
                        <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-6">
                          <span className="material-symbols-outlined text-3xl text-white/20">receipt_long</span>
                        </div>
                        <div className="text-sm font-black text-white/30 uppercase tracking-widest mb-2">Još uvek nema transakcija</div>
                        <div className="text-[11px] text-white/20 font-medium max-w-xs leading-relaxed">
                          Ovde će biti prikazane sve vaše uplate, aktivacije paketa i kretanje kredita.
                        </div>
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/5">
                            <th className="pb-4 text-[9px] font-black text-white/20 tracking-[0.2em] uppercase">TRANSAKCIJA</th>
                            <th className="pb-4 text-[9px] font-black text-white/20 tracking-[0.2em] uppercase">OPIS</th>
                            <th className="pb-4 text-[9px] font-black text-white/20 tracking-[0.2em] uppercase">STATUS</th>
                            <th className="pb-4 text-[9px] font-black text-white/20 tracking-[0.2em] uppercase text-right">IZNOS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {transactions.map((t: any) => (
                            <TransactionRow key={t.id} transaction={t} />
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="premium-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <PremiumPackageCard
                walletBalance={walletBalance}
                isPremium={isPremium}
                onActivate={() => activatePremiumMutation.mutate()}
                isActivating={activatePremiumMutation.isPending}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <DepositModal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} />
    </DashboardLayout>
  );
}
