import { AnimatePresence, motion } from 'motion/react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
}

export default function Toast({ message, type }: ToastProps) {
  const isSuccess = type === 'success';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-6 right-6 z-[9999]"
      >
        <div 
          className={`flex items-center gap-3 px-6 py-4 rounded-[10px] shadow-2xl border ${
            isSuccess 
              ? 'bg-[#0F1923] border-emerald-500/30 text-emerald-400' 
              : 'bg-[#0F1923] border-red-500/30 text-red-400'
          }`}
        >
          <span className="material-symbols-outlined shrink-0 text-xl">
            {isSuccess ? 'check_circle' : 'error'}
          </span>
          <p className="font-bold text-sm tracking-wide">{message}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
