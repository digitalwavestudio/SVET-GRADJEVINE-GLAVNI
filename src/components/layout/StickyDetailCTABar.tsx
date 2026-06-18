import React from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface StickyDetailCTABarProps {
  phone: string;
  onMessage?: () => void;
  price?: string | number;
  currency?: string;
  priceLabel?: string;
  ctaText?: string;
  onCtaClick?: () => void;
}

export const StickyDetailCTABar: React.FC<StickyDetailCTABarProps> = ({
  phone,
  onMessage,
  price,
  currency = 'EUR',
  priceLabel,
  ctaText,
  onCtaClick
}) => {
  const handleCall = () => {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-white/10 px-3 py-2 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2 max-w-lg mx-auto">
        {price != null && price !== '' ? (
          <div className="flex flex-col justify-center shrink-0">
            <span className="text-[7px] font-black text-white/40 uppercase tracking-widest leading-none mb-0.5">
              {priceLabel || 'CENA'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-secondary tracking-tight font-mono">{price}</span>
              <span className="text-[8px] font-bold text-white/60 uppercase">{currency}</span>
            </div>
          </div>
        ) : onMessage ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onMessage}
            className="h-10 w-10 shrink-0 bg-white/5 border border-white/10 rounded-[8px] flex items-center justify-center text-white/80 active:bg-white/10 transition-colors"
            title="Poruka"
          >
            <MessageSquare size={18} />
          </motion.button>
        ) : null}

        <div className="flex items-center gap-1.5 flex-grow justify-end">
          {ctaText && onCtaClick && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onCtaClick}
              className="flex-grow py-2.5 px-3 bg-emerald-500 text-white font-black rounded-[8px] text-[9px] uppercase tracking-widest text-center shadow-lg shadow-emerald-500/20 whitespace-nowrap"
            >
              {ctaText}
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCall}
            className={`py-2.5 px-4 bg-secondary text-slate-950 font-black rounded-[8px] text-[9px] uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-secondary/15 shrink-0 ${!ctaText ? 'flex-grow' : ''}`}
          >
            <Phone size={12} fill="currentColor" />
            POZOVI
          </motion.button>
        </div>
      </div>
    </div>
  );
};
