import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/src/context/AuthContext';

import { auth } from '@/src/firebase';
import { walletService } from '@/src/modules/checkout/services/walletService';

interface AdminAddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName?: string;
}

export function AdminAddFundsModal({ isOpen, onClose, targetUserId, targetUserName }: AdminAddFundsModalProps) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(1000);
  const [description, setDescription] = useState<string>('Manuelna dopuna (Uplata na račun)');

  const handleFund = async () => {
    if (amount <= 0) {
      toast.error('Iznos mora biti veći od 0.');
      return;
    }
    if (!description.trim()) {
      toast.error('Opis je obavezan.');
      return;
    }

    try {
      setLoading(true);
      await walletService.adminAddFunds(targetUserId, amount, description);
      toast.success(`Uspešno dodato ${amount} SG Kredita.`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Greška pri dodavanju sredstava');
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
          className="relative bg-[#0A0F14] border border-white/10 rounded-[10px] p-8 w-full max-w-md overflow-hidden"
        >
          <div className="mb-6">
            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1">
              Manuelna Dopuna
            </h2>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
              Korisnik: {targetUserName || targetUserId}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest pl-2 mb-2">Iznos (RSD)</label>
              <input
                type="number"
                min="100"
                step="100"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-white font-black text-xl placeholder-white/20 focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-white/40 uppercase tracking-widest pl-2 mb-2">Opis Transakcije</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[10px] p-4 text-sm text-white font-medium placeholder-white/20 focus:outline-none focus:border-secondary transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-4 text-white/40 font-black uppercase tracking-widest text-[10px] bg-white/5 hover:bg-white/10 rounded-[10px] transition-all"
            >
              Odustani
            </button>
            <button 
              onClick={handleFund}
              disabled={loading || amount <= 0}
              className="flex-1 py-4 bg-secondary text-slate-950 hover:bg-yellow-400 font-black uppercase tracking-widest text-[10px] rounded-[10px] transition-all disabled:opacity-50"
            >
              {loading ? 'PRIČEKAJTE...' : `DODAJ`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
