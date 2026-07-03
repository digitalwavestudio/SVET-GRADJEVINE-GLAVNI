import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      className="mt-4 relative overflow-hidden rounded-[20px] border border-white/5 bg-gradient-to-br from-[#0E151D] via-[#0A1118] to-[#050A10] p-8 md:p-10 group"
    >
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:40px_40px]"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-secondary/5 rounded-full blur-[100px]"></div>
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-secondary/3 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="flex-shrink-0">
          <div className="relative w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5 animate-pulse"></div>
            <div className="absolute inset-2 rounded-full border border-secondary/30"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-secondary/10 to-transparent group-hover:scale-110 transition-transform duration-700"></div>
            <Icon
              size={40}
              strokeWidth={1.5}
              className="relative z-10 text-secondary"
            />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h3 className="font-headline text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter mb-4 leading-tight">
            {title}
          </h3>
          <p className="text-white/50 text-sm md:text-base mb-8 leading-relaxed font-medium max-w-2xl">
            {description}
          </p>
          <Link
            to={buttonLink}
            className="group/btn inline-flex h-14 bg-gradient-to-r from-secondary to-yellow-400 !text-black px-10 rounded-[12px] font-headline font-black uppercase italic tracking-tighter text-base hover:shadow-[0_0_30px_rgba(254,191,13,0.4)] hover:scale-105 active:scale-95 transition-all duration-500 items-center gap-3"
          >
            {buttonText}
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="material-symbols-outlined font-black group-hover/btn:translate-x-1 transition-transform"
            >
              arrow_forward
            </motion.span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
