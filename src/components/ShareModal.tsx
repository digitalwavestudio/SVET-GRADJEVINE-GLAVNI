import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useEscToClose } from '@/src/hooks/useEscToClose';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileUrl: string;
}

export default function ShareModal({ isOpen, onClose, profileUrl }: ShareModalProps) {
  useEscToClose(isOpen, onClose);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-[#0A0F14] border border-white/10 rounded-[10px] shadow-2xl overflow-hidden relative z-10 p-8"
          >
            <div className="w-16 h-16 bg-blue-500/10 rounded-[10px] flex items-center justify-center mb-6 mx-auto">
              <span className="material-symbols-outlined text-blue-400 text-3xl">share</span>
            </div>
            
            <h2 className="text-2xl font-black text-center uppercase tracking-tighter mb-2">PODELI PROFIL</h2>
            <p className="text-white/40 text-center font-bold text-[10px] uppercase tracking-widest mb-8">
              KOPIRAJ LINK I PODELI GA SA POTENCIJALNIM PARTNERIMA
            </p>

            <div className="bg-white/5 border border-white/10 p-4 rounded-[10px] flex items-center gap-4 mb-8">
              <input 
                readOnly 
                value={profileUrl} 
                className="bg-transparent border-none outline-none text-white font-bold text-xs w-full truncate"
              />
              <button 
                onClick={handleCopy}
                className={`px-4 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all ${
                  copied ? 'bg-green-500 text-white' : 'bg-secondary !text-black hover:bg-yellow-400'
                }`}
              >
                {copied ? 'KOPIRANO' : 'KOPIRAJ'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { icon: 'facebook', color: 'bg-[#1877F2]' },
                { icon: 'linkedin', color: 'bg-[#0A66C2]' },
                { icon: 'whatsapp', color: 'bg-[#25D366]' },
                { icon: 'mail', color: 'bg-white/10' },
              ].map((social, i) => (
                <button key={i} className={`aspect-square rounded-[10px] ${social.color} flex items-center justify-center hover:scale-110 transition-all`}>
                  <span className="material-symbols-outlined text-white">{social.icon === 'mail' ? 'mail' : 'share'}</span>
                </button>
              ))}
            </div>

            <button 
              onClick={onClose}
              className="w-full py-4 bg-white/5 border border-white/10 text-white font-black rounded-[10px] text-[10px] tracking-widest uppercase hover:bg-white/10 transition-all"
            >
              ZATVORI
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
