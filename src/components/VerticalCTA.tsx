import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UI_TOKENS } from '@/src/lib/uiTokens';

interface VerticalCTAProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  icon: LucideIcon;
}

export const VerticalCTA: React.FC<VerticalCTAProps> = ({
  title,
  description,
  buttonText,
  buttonLink,
  icon: Icon
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mt-4 relative overflow-hidden rounded-[20px] border border-white/5 bg-surface-container-low p-6 md:p-8 text-center group"
    >
      {/* Tech Container for Icon (Cleaned up, static background) */}
      <div className="flex justify-center mb-10">
        <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
          {/* Clean background circle */}
          <div className="absolute inset-0 rounded-full border border-secondary/20 bg-secondary/5 group-hover:scale-105 transition-transform duration-500"></div>
          
          <Icon 
            size={32} 
            strokeWidth={1.5}
            className="relative z-10 text-secondary transition-all duration-700 group-hover:scale-110" 
          />
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <h3 className="font-headline text-xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-3">
          {title}
        </h3>
        <p className="text-on-surface-variant text-sm md:text-base mb-8 leading-relaxed font-medium">
          {description}
        </p>
        <Link 
          to={buttonLink} 
          className="inline-flex h-14 bg-secondary !text-black px-10 rounded-[12px] font-headline font-black uppercase italic tracking-tighter text-base hover:bg-white hover:scale-105 active:scale-95 transition-all duration-500 items-center gap-3"
        >
          {buttonText}
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="material-symbols-outlined font-black"
          >
            arrow_forward
          </motion.span>
        </Link>
      </div>

    </motion.div>
  );
};
