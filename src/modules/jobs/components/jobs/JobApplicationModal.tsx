import React from 'react';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  applicationMessage: string;
  setApplicationMessage: (msg: string) => void;
  applicationPhone: string;
  setApplicationPhone: (phone: string) => void;
  isApplying: boolean;
}

export function JobApplicationModal({
  isOpen,
  onClose,
  onSubmit,
  applicationMessage,
  setApplicationMessage,
  applicationPhone,
  setApplicationPhone,
  isApplying
}: JobApplicationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-surface-container-high rounded-[10px] w-full max-w-md border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Prijava na oglas</h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-on-surface-variant mb-2 uppercase tracking-wider">Vaša poruka poslodavcu</label>
            <textarea 
              value={applicationMessage}
              onChange={(e) => setApplicationMessage(e.target.value)}
              placeholder="Navedite vaše radno iskustvo i zašto ste pravi kandidat za ovaj posao..."
              className="w-full bg-surface border border-white/10 rounded-[10px] p-3 text-white focus:border-secondary transition-colors outline-none h-32 resize-none"
              required
            />
          </div>
          <div>
             <label className="block text-xs font-black text-on-surface-variant mb-2 uppercase tracking-wider">Kontakt telefon</label>
             <input 
               type="tel"
               value={applicationPhone}
               onChange={(e) => setApplicationPhone(e.target.value)}
               placeholder="+381 6..."
               className="w-full bg-surface border border-white/10 rounded-[10px] p-3 text-white focus:border-secondary transition-colors outline-none"
               required
             />
          </div>
          <button 
            type="submit" 
            disabled={isApplying}
            className={`w-full py-4 rounded-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${isApplying ? 'bg-secondary/50 text-slate-800 cursor-not-allowed' : 'bg-secondary text-slate-950 hover:bg-yellow-400'}`}
          >
            {isApplying ? 'Šaljem prijavu...' : 'Pošalji prijavu'}
            {!isApplying && <span className="material-symbols-outlined">send</span>}
          </button>
        </form>
      </div>
    </div>
  );
}
