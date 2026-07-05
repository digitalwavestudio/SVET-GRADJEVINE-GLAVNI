import React from 'react';
import { motion } from 'motion/react';
import { OptimizedImage } from './OptimizedImage';

interface Stat {
  label: string;
  value: React.ReactNode;
  icon: string;
}

interface StandardPageHeroProps {
  badge?: string;
  title: React.ReactNode;
  titleAccent?: string;
  subtitle?: string;
  backgroundImage?: string;
  children?: React.ReactNode;
  stats?: Stat[];
  rightSlot?: React.ReactNode;
  accentColor?: string; // CSS color or Tailwind class
  overlayGradient?: string;
}

export function StandardPageHero({
  badge,
  title,
  titleAccent,
  subtitle,
  backgroundImage,
  children,
  stats,
  rightSlot,
  accentColor = 'var(--color-secondary)',
  overlayGradient = 'linear-gradient(to right, rgba(5, 15, 25, 0.98) 0%, rgba(5, 15, 25, 0.8) 35%, rgba(5, 15, 25, 0.2) 100%)',
}: StandardPageHeroProps) {
  return (
    <section className="relative min-h-[480px] sm:min-h-[520px] md:min-h-screen md:h-screen flex flex-col items-start bg-surface-container-lowest border-b border-white/5 glass-panel gold-glow">
      {/* Background Layer */}
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 text-white">
        {backgroundImage ? (
          <OptimizedImage
            src={backgroundImage}
            alt="Hero Background"
            className="w-full h-full object-cover scale-105"
            containerClassName="h-full w-full opacity-55 saturate-[1.1] brightness-[1.1]"
          />
        ) : (
          <div className="w-full h-full bg-[#050F19] bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:40px_40px]"></div>
        )}
        <div 
          className="absolute inset-0 z-10" 
          style={{ background: overlayGradient }}
        ></div>
        {/* Noise Texture for that visual signature */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-8 w-full relative z-20 md:h-full">
        <div className="grid grid-rows-[auto] md:grid-rows-[40px_240px_120px_auto] gap-6 md:gap-0 pt-[129px] md:pt-[225px] pb-20 md:pb-0">
          {/* Content side */}
          <motion.div 
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex-2 max-w-4xl col-start-1 animate-fade-in-up"
          >
            {/* Badge Zone - Row 1 (40px) */}
            <div className="md:h-full flex items-center mb-6 md:mb-0">
              {badge && (
                <div className="flex items-center gap-4">
                  <div className="hidden md:block h-px w-10 bg-secondary/30"></div>
                  <span className="text-[10px] font-black tracking-[0.4em] uppercase text-secondary">
                    {badge}
                  </span>
                </div>
              )}
            </div>
            
            {/* Title Zone - Row 2 (240px) - Locked height for H1 */}
            <div className="md:h-[240px] flex flex-col justify-center">
              <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-[1000] md:font-[950] text-white leading-[0.85] tracking-[-0.05em] uppercase text-center md:text-left">
                {title}
                {titleAccent && (
                  <>
                    <br />
                    <span className="text-secondary">{titleAccent}</span>
                  </>
                )}
              </h1>
            </div>
            
            {/* Subtitle Zone - Row 3 (120px) */}
            <div className="md:h-full">
              {subtitle && (
                <div className="relative md:pl-8 h-full border-l-0 md:border-l-2 border-secondary/30 flex items-center mt-6 md:mt-0">
                  <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-3xl font-medium leading-relaxed">
                    {subtitle}
                  </p>
                </div>
              )}
            </div>

            {/* Actions Zone - Row 4 (Auto) - Search bar starts here */}
            <div className="pt-8">
              {children}
            </div>
          </motion.div>

          {/* Stats side - Positioned higher in the hero zone */}
          <div className="hidden lg:block col-start-2 row-span-4 self-start pt-0 pl-12 pb-12">
            {(stats && stats.length > 0) || rightSlot ? (
              <motion.div 
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="flex flex-col gap-6 min-w-[340px]"
              >
                {rightSlot}
                
                {stats && stats.length > 0 && (
                  <div className="relative space-y-8 select-none">
                    {stats.map((stat, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + idx * 0.1, duration: 0.8 }}
                        className="group relative flex items-center gap-8"
                      >
                        {/* Background Sequence Number */}
                        <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-[120px] font-black text-white/[0.015] pointer-events-none group-hover:text-secondary/[0.03] transition-colors duration-1000 italic">
                          0{idx + 1}
                        </div>

                        {/* Scanner Line */}
                        <div className="w-[1px] h-20 bg-gradient-to-b from-transparent via-white/10 to-transparent group-hover:via-secondary group-hover:shadow-[0_0_15px_rgba(254,191,13,0.8)] transition-all duration-500"></div>
                        
                        <div className="relative flex-1 py-2">
                           <div className="flex items-center gap-3 mb-3">
                             <div className="w-2 h-2 bg-secondary/80 rounded-full shadow-[0_0_10px_rgba(254,191,13,0.3)]"></div>
                             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] group-hover:text-white/70 transition-colors duration-500">
                               {stat.label}
                             </p>
                           </div>
                           
                           <div className="flex items-baseline gap-6 translate-x-0 group-hover:translate-x-4 transition-transform duration-700 ease-[0.16, 1, 0.3, 1]">
                              <span className="text-7xl font-headline font-black text-white italic tracking-tighter group-hover:text-secondary transition-all duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
                                {stat.value}
                              </span>
                              
                              {/* Tech Details Decor */}
                              <div className="hidden sm:flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-1000 translate-y-2 group-hover:translate-y-0">
                                <div className="w-12 h-[2px] bg-secondary/40"></div>
                                <div className="w-8 h-[2px] bg-secondary/20"></div>
                                <div className="w-4 h-[2px] bg-secondary/10"></div>
                              </div>
                           </div>
                        </div>

                        {/* Icon Node */}
                        <div className="relative w-20 h-20 flex items-center justify-center">
                           <div className="absolute inset-0 rounded-full border border-white/5 group-hover:border-secondary/30 group-hover:bg-secondary/5 transition-all duration-700 group-hover:scale-110"></div>
                           <div className="absolute inset-0 rounded-full border-t-2 border-transparent group-hover:border-secondary group-hover:rotate-[360deg] transition-all duration-[1.5s] ease-in-out opacity-0 group-hover:opacity-100"></div>
                           
                           <span className="material-symbols-outlined text-white/10 group-hover:text-secondary text-4xl group-hover:scale-125 transition-all duration-500 relative z-10">
                             {stat.icon}
                           </span>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Bottom System Info */}
                    <div className="pt-16 border-t border-white/5 flex justify-end items-end">
                       <div className="flex gap-1 items-end">
                         {[0.4, 0.7, 0.2, 0.9, 0.5].map((h, i) => (
                           <motion.div 
                             key={i}
                             animate={{ height: [h*16, (1-h)*16, h*16] }}
                             transition={{ duration: 1 + i*0.2, repeat: Infinity, ease: "linear" }}
                             className="w-1 bg-secondary/30"
                           />
                         ))}
                       </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
