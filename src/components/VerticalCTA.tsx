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
      {/* Tech Container for Icon (Matches Homepage Hero style) */}
      <div className="flex justify-center mb-10">
        <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
          {/* Inner Glow/Circle */}
          <div className="absolute inset-3 rounded-full border border-secondary/40 bg-secondary/10 scale-110 group-hover:scale-125 transition-transform duration-700"></div>
          
          {/* Main Rotating Outer Ring (Secondary Color) */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-1 rounded-full border-t-2 border-r border-transparent border-secondary opacity-80"
          />
          
          {/* Secondary Fast Rotating Ring */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-1 rounded-full border-b-2 border-l border-transparent border-secondary/40"
          />
          
          {/* Dash Ring (Suprotan smer) */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-3 rounded-full border border-dashed border-white/20 opacity-40"
          />
          
          {/* Static Tech Frame */}
          <div className="absolute -inset-6 rounded-full border border-white/5 opacity-30"></div>
          
          <Icon 
            size={32} 
            strokeWidth={1.5}
            className="relative z-10 text-secondary transition-all duration-700 group-hover:scale-110 group-hover:rotate-6" 
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
          className="inline-flex h-14 bg-secondary text-slate-950 px-10 rounded-[12px] font-headline font-black uppercase italic tracking-tighter text-base hover:bg-white hover:scale-105 active:scale-95 transition-all duration-500 items-center gap-3"
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

      {/* Decorative HUD corners */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t border-l border-white/10 rounded-tl-lg pointer-events-none group-hover:border-secondary/30 transition-colors duration-500"></div>
      <div className="absolute top-6 right-6 w-8 h-8 border-t border-r border-white/10 rounded-tr-lg pointer-events-none group-hover:border-secondary/30 transition-colors duration-500"></div>
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b border-l border-white/10 rounded-bl-lg pointer-events-none group-hover:border-secondary/30 transition-colors duration-500"></div>
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b border-r border-white/10 rounded-br-lg pointer-events-none group-hover:border-secondary/30 transition-colors duration-500"></div>
    </motion.div>
  );
};
