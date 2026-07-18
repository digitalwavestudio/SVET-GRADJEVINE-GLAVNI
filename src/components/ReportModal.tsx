import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useToast } from '@/src/context/ToastContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'JOB' | 'USER' | 'COMPANY' | 'ACCOMMODATION';
  targetName: string;
}

export default function ReportModal({ isOpen, onClose, targetId, targetType, targetName }: ReportModalProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      addToast('Molimo odaberite razlog prijave.', 'error');
      return;
    }
    
    if (!user) {
      addToast('Morate biti prijavljeni da biste poslali prijavu.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = (await import('firebase/auth')).getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Unauthorized");

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetId,
          targetType,
          targetName,
          reason,
          details,
          reporterName: user.name || user.email || 'Nepoznato'
        })
      });

      if (!response.ok) throw new Error('Failed to submit');
      
      addToast('Prijava uspešno poslata. Administratori će je pregledati.', 'success');
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      addToast('Greška pri slanju prijave.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F1923]/90 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface-container border border-white/10 rounded-[10px] p-6 shadow-2xl z-[101]"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Prijava Zloupotrebe</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Prijavljujete: <span className="font-semibold text-white">{targetName}</span>
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-[10px] bg-white/5 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Razlog Prijave</label>
                <select 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#0F1923] border border-white/10 rounded-[10px] p-4 text-white focus:border-red-500 focus:outline-none appearance-none"
                  required
                >
                  <option value="">Odaberite razlog...</option>
                  <option value="SPAM">Neželjeni sadržaj (Spam)</option>
                  <option value="SCAM">Prevara ili lažan oglas</option>
                  <option value="HARASSMENT">Uznemiravanje ili uvrede</option>
                  <option value="INAPPROPRIATE">Neprikladan sadržaj</option>
                  <option value="OTHER">Drugo</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest block">Dodatni Detalji</label>
                <textarea 
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full bg-[#0F1923] border border-white/10 rounded-[10px] p-4 text-white focus:border-red-500 focus:outline-none resize-none h-32"
                  placeholder="Opišite problem detaljnije..."
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-500 text-white font-black py-4 rounded-[10px] hover:bg-red-600 transition-colors disabled:opacity-50 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Slanje...' : 'Pošalji Prijavu'}
                <span className="material-symbols-outlined text-sm">warning</span>
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
