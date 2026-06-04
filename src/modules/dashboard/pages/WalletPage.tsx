import { DashboardLayout } from '@/src/modules/core';
import { useAuth } from '@/src/context/AuthContext';
import { walletService } from '@/src/modules/checkout/services/walletService';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, memo, useMemo } from 'react';
import DepositModal from '../components/DepositModal';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { queryKeys } from '@/src/lib/queryKeysFactory';
import { useFinanceSummary } from '../hooks/useFinanceStats';
import { motion, AnimatePresence } from 'framer-motion';

// Optimized Transaction Row Component
const TransactionRow = memo(({ transaction }: { transaction: any }) => {
  const isPositive = transaction.amount > 0;
  
  // Mapping statuses according to architectural instructions
  const statusConfig: Record<string, { label: string, classes: string }> = {
    'completed': { label: 'PROCESUIRANO', classes: 'bg-green-500/10 text-green-500 border border-green-500/20' },
    'processed': { label: 'PROCESUIRANO', classes: 'bg-green-500/10 text-green-500 border border-green-500/20' },
    'pending': { label: 'NA ČEKANJU', classes: 'bg-orange-500/10 text-orange-500 border border-orange-500/20' },
    'cancelled': { label: 'OTKAZANO', classes: 'bg-red-500/10 text-red-500 border border-red-500/20' },
    'failed': { label: 'OTKAZANO', classes: 'bg-red-500/10 text-red-500 border border-red-500/20' },
  };

  const status = statusConfig[transaction.status] || { label: transaction.status?.toUpperCase() || 'NEPOZNATO', classes: 'bg-white/5 text-white/40 border border-white/10' };

  return (
    <tr className="hover:bg-white/[0.02] transition-colors group border-b border-white/5">
      <td className="py-5 pr-4">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
            isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            <span className="material-symbols-outlined text-lg">
              {isPositive ? 'south_west' : 'north_east'}
            </span>
          </div>
          <div>
            <div className="text-[10px] font-black text-white tracking-widest uppercase mb-1">{transaction.type || 'PRENOS'}</div>
            <div className="text-[9px] font-bold text-white/30 tracking-widest uppercase">
              {transaction.createdAt?.seconds 
                ? new Intl.DateTimeFormat('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(transaction.createdAt.toDate()) 
                : 'Nedavno'}
            </div>
          </div>
        </div>
      </td>
      <td className="py-5 pr-4">
        <div className="text-[11px] font-medium tracking-wide text-white/70 max-w-[200px] truncate">{transaction.description || 'Sistemska transakcija / SG Krediti'}</div>
      </td>
      <td className="py-5 pr-4">
        <span className={`px-2.5 py-1 rounded-[4px] text-[8px] font-black tracking-[0.1em] ${status.classes}`}>
          {status.label}
        </span>
      </td>
      <td className="py-5 text-right font-mono">
        <div className={`text-sm font-black tabular-nums tracking-tighter ${
          isPositive ? 'text-green-500' : 'text-white'
        }`}>
          {isPositive ? '+' : ''}{transaction.amount.toLocaleString()}<span className="text-[10px] ml-1 opacity-50 uppercase">Credits</span>
        </div>
      </td>
    </tr>
  );
});

TransactionRow.displayName = 'TransactionRow';

export default function WalletPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  
  // Enterprise stats connection
  const { data: financeStats, isLoading: statsLoading } = useFinanceSummary();

  const { data: transactions = [], isLoading: txLoading, refetch } = useQuery({
    queryKey: queryKeys.wallet.transactions(user?.id || 'guest'),
    queryFn: () => walletService.fetchTransactions(user?.id as string),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
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
  }, [location.search, navigate, refetch]);

  const walletBalance = user?.walletBalance || 0;

  const financeCards = useMemo(() => [
    { label: 'UKUPNI PROMET', value: financeStats?.totalRevenue || 0, icon: 'payments', color: 'text-emerald-500', suffix: 'RSD' },
    { label: 'USPEŠNE UPLATE', value: financeStats?.confirmedCount || 0, icon: 'verified', color: 'text-blue-500', suffix: 'TX' },
    { label: 'KONVERZIJA', value: `${(financeStats?.conversionRate || 0).toFixed(1)}%`, icon: 'analytics', color: 'text-amber-500', suffix: '' },
    { label: 'PROSEČAN VAUČER', value: financeStats?.averageOrderValue || 0, icon: 'shopping_bag', color: 'text-purple-500', suffix: 'SG' },
  ], [financeStats]);

  return (
    <DashboardLayout>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12 pb-20"
      >
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">FINANSIJE</h1>
            <p className="text-white/30 font-bold text-xs tracking-[0.3em] uppercase">TRANSAKCIJE I ENTERPRISE METRIKE</p>
          </div>
          
          <div className="flex bg-white/5 border border-white/10 p-1 rounded-xl">
             <div className="px-4 py-2 bg-white/10 rounded-lg text-[10px] font-black tracking-widest uppercase">REALTIME</div>
             <div className="px-4 py-2 text-[10px] font-black tracking-widest uppercase text-white/40 opacity-50">HISTORICAL</div>
          </div>
        </header>

        {/* Financial Metrics Row - From AdminStatsService */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="wait">
            {statsLoading ? (
               Array(4).fill(0).map((_, i) => (
                 <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl border border-white/5" />
               ))
            ) : (
              financeCards.map((card, idx) => (
                <motion.div 
                  key={card.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#0A0F14] border border-white/5 p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{card.label}</span>
                    <span className={`material-symbols-outlined text-lg ${card.color}`}>{card.icon}</span>
                  </div>
                  <div className="text-xl font-black tracking-tighter text-white tabular-nums">
                    {card.value.toLocaleString()} <span className="text-[10px] opacity-30 ml-1">{card.suffix}</span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Balance Overview */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-[#0D1218] to-[#1A222B] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[90px] rounded-full -mt-20 -mr-20 group-hover:bg-green-500/20 transition-all duration-700" />
              
              <div className="flex items-center gap-3 mb-10">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-black text-sm font-black">wallet</span>
                </div>
                <span className="text-[10px] font-black text-green-500 tracking-[0.2em] uppercase">DOSTUPNA SREDSTVA</span>
              </div>

              <div className="space-y-1 mb-10">
                <div className="text-xs font-bold text-white/40 uppercase tracking-widest">TRENUTNI SALDO</div>
                <div className="text-6xl font-black text-white tracking-tight tabular-nums flex items-baseline gap-2">
                  {walletBalance.toLocaleString()}
                  <span className="text-xl text-green-500 font-bold uppercase tracking-widest">SGK</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setDepositModalOpen(true)} className="bg-white text-black font-black py-4 rounded-xl transition-all hover:bg-green-400 text-[10px] tracking-widest uppercase shadow-xl shadow-green-500/10">
                  DOPUNA
                </button>
                <button onClick={() => toast("Isplata će biti dostupna uskoro.")} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black py-4 rounded-xl transition-all text-[10px] tracking-widest uppercase">
                  ISPLATA
                </button>
              </div>
            </div>

            {/* Campaign Credits */}
            <div className="bg-[#0A0F14] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
               <div className="flex justify-between items-start mb-8">
                  <div className="bg-blue-500/10 text-blue-400 p-2 rounded-lg">
                    <span className="material-symbols-outlined text-lg">campaign</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black text-white/30 tracking-widest uppercase mb-1">PROMOCIJA</div>
                    <div className="text-2xl font-black text-white tabular-nums tracking-tighter">{user?.availableCredits ?? 0} <span className="text-xs opacity-30">Credits</span></div>
                  </div>
               </div>
               <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed mb-6">
                 Specijalizovani krediti namenjeni isključivo za "Boost" oglasa i prioritetno listiranje.
               </p>
               <button className="w-full py-4 border border-blue-500/20 hover:bg-blue-500/10 text-blue-400 text-[10px] font-black tracking-widest uppercase rounded-xl transition-all">
                 KUPI PROMOCIJU
               </button>
            </div>
          </div>

          {/* Optimized Transaction History */}
          <div className="lg:col-span-12 xl:col-span-8">
            <div className="bg-[#0A0F14] border border-white/5 rounded-3xl p-8 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[11px] font-black text-white tracking-[0.25em] uppercase">ISTORIJA AKTIVNOSTI</h3>
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
                  <div className="h-full flex items-center justify-center text-white/20">
                    <span className="material-symbols-outlined animate-spin text-4xl">slow_motion_video</span>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/20">
                    <span className="material-symbols-outlined text-5xl mb-4 opacity-20">history_edu</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Nema zabeleženih kretanja</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="pb-4 text-[9px] font-black text-white/20 tracking-[0.2em] uppercase">TRANSAKCIJA</th>
                        <th className="pb-4 text-[9px] font-black text-white/20 tracking-[0.2em] uppercase">OPSERVACIJA</th>
                        <th className="pb-4 text-[9px] font-black text-white/20 tracking-[0.2em] uppercase">STATUS</th>
                        <th className="pb-4 text-[9px] font-black text-white/20 tracking-[0.2em] uppercase text-right">IZNOS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map(t => (
                        <TransactionRow key={t.id} transaction={t} />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <DepositModal isOpen={depositModalOpen} onClose={() => setDepositModalOpen(false)} />
    </DashboardLayout>
  );
}
