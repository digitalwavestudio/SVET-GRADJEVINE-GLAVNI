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
    <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-white/10 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        {/* Left Side: Price or Secondary CTA */}
        {price != null && price !== '' ? (
          <div className="flex flex-col justify-center min-w-[80px]">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">
              {priceLabel || 'CENA'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-secondary tracking-tight font-mono">{price}</span>
              <span className="text-[10px] font-bold text-white/60 uppercase">{currency}</span>
            </div>
          </div>
        ) : onMessage ? (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onMessage}
            className="flex-1 max-w-[100px] h-12 bg-white/5 border border-white/10 rounded-[10px] flex items-center justify-center text-white/80 active:bg-white/10 transition-colors"
            title="Poruka"
          >
            <MessageSquare size={20} />
          </motion.button>
        ) : null}

        {/* Right Side: Call CTA & Action CTA */}
        <div className="flex items-center gap-2 flex-grow justify-end">
          {ctaText && onCtaClick && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onCtaClick}
              className="flex-grow py-3 px-4 bg-emerald-500 text-white font-black rounded-[10px] text-[10px] uppercase tracking-widest text-center shadow-lg shadow-emerald-500/20"
            >
              {ctaText}
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCall}
            className={`py-3 px-5 bg-secondary text-slate-950 font-black rounded-[10px] text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-secondary/15 ${!ctaText ? 'w-full' : ''}`}
          >
            <Phone size={14} fill="currentColor" />
            POZOVI
          </motion.button>
        </div>
      </div>
    </div>
  );
};
