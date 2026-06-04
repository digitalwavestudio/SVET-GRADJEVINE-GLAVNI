import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { walletService } from '@/src/modules/checkout/services/walletService';
import { useAuth } from '@/src/context/AuthContext';
import { toast } from 'react-hot-toast';

interface PromoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityId: string;
  collection: string;
  isUrgentCheck?: boolean; // If true, we are promoting as 'Urgent' (could map to different UI, but same API updates isPremium/isUrgent if we update the API. Oh wait, my API only sets isPremium. I should update API to support promoteType = premium | urgent)
  onSuccess: () => void;
}

export default function PromoteModal({ isOpen, onClose, entityId, collection, isUrgentCheck, onSuccess }: PromoteModalProps) {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const currentBalance = user?.partnerBalance || 0;

  const packages = [
    { days: 7, cost: 500, title: 'Brzi rezultat' },
    { days: 15, cost: 900, title: 'Optimalno' },
    { days: 30, cost: 1500, title: 'Maksimalna vidljivost' }
  ];

  const handlePromote = async (days: number, cost: number) => {
    if (currentBalance < cost) {
      toast.error('Nemate dovoljno sredstava u novčaniku.');
      return;
    }

    try {
      setLoading(true);
      await walletService.promoteEntity({
        entityId,
        collection,
        durationDays: days,
        cost,
        promoteType: isUrgentCheck ? 'urgent' : 'premium' 
      });
      await updateUser({ partnerBalance: currentBalance - cost });
      toast.success('Oglas je uspešno promovisan!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Greška pri promociji');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          className="relative bg-[#0A0F14] border border-white/10 rounded-[10px] p-8 w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
              {isUrgentCheck ? 'Označi kao Hitno' : 'Izdvoj kao Premium'}
            </h2>
            <p className="text-white/60 text-sm font-medium">
              Istaknite vaš oglas i dođite do većeg broja klijenata. Sredstva se skidaju sa vašeg novčanika.
            </p>
          </div>

          <div className="mb-6 bg-white/5 border border-white/10 rounded-[10px] p-4 flex justify-between items-center text-sm font-black uppercase tracking-widest">
            <span className="text-white/60">Stanje u novčaniku:</span>
            <span className={currentBalance > 0 ? "text-secondary" : "text-white"}>{currentBalance} SG Kredita</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {packages.map((pkg) => {
              const cantAfford = currentBalance < pkg.cost;
              return (
                <div key={pkg.days} className="bg-white/5 border border-white/10 rounded-[10px] p-6 text-center hover:bg-white/10 transition-all flex flex-col justify-between">
                  <div>
                    <h3 className="text-secondary font-black uppercase tracking-widest text-[10px] mb-2">{pkg.title}</h3>
                    <div className="text-3xl font-black text-white tracking-tighter mb-1">{pkg.days}</div>
                    <div className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Dana</div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <div className="text-xl font-black text-white mb-4">{pkg.cost} SG Kredita</div>
                    <button 
                      onClick={() => handlePromote(pkg.days, pkg.cost)}
                      disabled={cantAfford || loading}
                      className={`w-full py-3 rounded-[10px] font-black uppercase tracking-widest text-[10px] transition-all ${
                        loading ? 'bg-white/5 text-white/40 cursor-not-allowed' :
                        cantAfford ? 'bg-error/10 text-error cursor-not-allowed border border-error/20' : 
                        'bg-secondary text-slate-950 hover:bg-yellow-400'
                      }`}
                    >
                      {loading ? 'PRIČEKAJTE' : cantAfford ? 'NEMA SREDSTAVA' : 'KUPI'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 text-white/40 font-black uppercase tracking-widest text-xs hover:text-white transition-all"
          >
            Odustani
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
