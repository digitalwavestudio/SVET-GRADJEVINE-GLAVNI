interface ToastProps {
  message: string;
  type: 'success' | 'error';
}

export default function Toast({ message, type }: ToastProps) {
  const isSuccess = type === 'success';

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <div 
        className={`flex items-center gap-3 px-6 py-4 rounded-[10px] shadow-2xl border transition-all duration-300 ${
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
    </div>
  );
}
