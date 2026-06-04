import { AnimatePresence, motion } from 'motion/react';

export interface DashboardAlertDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function DashboardAlertDialog({
  isOpen,
  title,
  description,
  type,
  onClose
}: DashboardAlertDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#05070a]/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-sm bg-[#0d121a] border border-white/10 rounded-[12px] p-6 shadow-2xl z-10 text-center overflow-hidden"
          >
            <div className="flex flex-col items-center gap-4 py-2">
              <div className={`p-4 rounded-full flex items-center justify-center ${type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                <span className="material-symbols-outlined text-3xl">
                  {type === 'success' ? 'check_circle' : 'error'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2 font-headline">
                  {title}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed max-w-xs mx-auto font-sans">
                  {description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3 rounded-[8px] bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all font-sans"
              >
                ZATVORI
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
