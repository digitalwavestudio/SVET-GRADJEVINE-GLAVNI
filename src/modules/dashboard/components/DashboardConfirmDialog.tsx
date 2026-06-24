import { AnimatePresence, motion } from 'motion/react';

export interface DashboardConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel: string;
  isDanger?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

export function DashboardConfirmDialog({
  isOpen,
  title,
  description,
  actionLabel,
  isDanger = false,
  onConfirm,
  onCancel
}: DashboardConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-[#05070a]/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-[#0d121a] border border-white/10 rounded-[12px] p-6 shadow-2xl z-10 overflow-hidden"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${isDanger ? 'from-red-500 to-rose-600' : 'from-secondary to-yellow-500'}`} />

            <div className="flex items-start gap-4 mt-2">
              <div className={`p-3 rounded-[10px] flex items-center justify-center ${isDanger ? 'bg-red-500/10 text-red-500' : 'bg-secondary/10 text-secondary'}`}>
                <span className="material-symbols-outlined text-2xl">
                  {isDanger ? 'warning' : 'info'}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-md font-bold text-white uppercase tracking-wider mb-2 font-headline">
                  {title}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed font-sans">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end mt-8">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-3 rounded-[8px] bg-white/5 border border-white/5 text-[10px] font-black text-white/60 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all"
              >
                ODUSTANI
              </button>
              <button
                type="button"
                onClick={async () => { await onConfirm(); }}
                className={`px-5 py-3 rounded-[8px] text-[10px] font-black uppercase tracking-widest transition-all ${isDanger ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/10' : 'bg-secondary hover:bg-yellow-400 !text-black shadow-lg shadow-secondary/10'}`}
              >
                {actionLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
