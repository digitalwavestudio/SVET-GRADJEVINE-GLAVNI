import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';

interface OfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (offerData: any) => void;
  recipientName: string;
}

export default function OfferModal({ isOpen, onClose, onSend, recipientName }: OfferModalProps) {
  const [formData, setFormData] = useState({
    position: 'ŠEF GRADILIŠTA',
    salary: '',
    startDate: '',
    location: 'BEOGRAD',

    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg bg-[#0A0F14] border border-white/10 rounded-[10px] p-8 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-3xl -mr-16 -mt-16"></div>
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase">POŠALJI PONUDU</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">ZA KORISNIKA: {recipientName}</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-[10px] bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 transition-all">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-2">POZICIJA</label>
                <input 
                  type="text"
                  value={formData.position}
                  onChange={e => setFormData({...formData, position: e.target.value})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[10px] py-4 px-5 text-xs font-black text-white uppercase outline-none focus:border-secondary transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-2">PLATA (€)</label>
                <input 
                  type="number"
                  placeholder="npr. 1500"
                  value={formData.salary}
                  onChange={e => setFormData({...formData, salary: e.target.value})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-[10px] py-4 px-5 text-xs font-black text-white uppercase outline-none focus:border-secondary transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-2">DATUM POČETKA</label>
              <input 
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full bg-white/[0.03] border border-white/10 rounded-[10px] py-4 px-5 text-xs font-black text-white uppercase outline-none focus:border-secondary transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-2">DODATNE NAPOMENE</label>
              <textarea 
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="OPIS POSLA, USLOVI..."
                className="w-full bg-white/[0.03] border border-white/10 rounded-[10px] py-4 px-5 text-xs font-black text-white uppercase outline-none focus:border-secondary transition-all resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-secondary !text-black font-black rounded-[10px] text-[10px] tracking-[0.2em] uppercase hover:bg-yellow-400 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-3"
            >
              <span className="material-symbols-outlined">send</span>
              POŠALJI ZVANIČNU PONUDU
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
