import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function CopyLinkButton({ url, className }: { url: string, className?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Greška pri kopiranju');
      setCopied(false);
    }
  };

  return (
    <motion.button
      onClick={copyToClipboard}
      initial={false}
      animate={{ 
        backgroundColor: copied ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        borderColor: copied ? 'rgba(34, 197, 94, 0.5)' : 'transparent'
      }}
      className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors border ${className}`}
      aria-label="Kopiraj link"
    >
      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-on-surface-variant" />}
      <AnimatePresence>
        {copied && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="text-xs font-bold text-green-500 overflow-hidden whitespace-nowrap"
          >
            Kopirano!
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
