export const UI_TOKENS = {
  // Tipografska skala: koristi se umesto text-[8px]/text-[9px] i nasumičnih font-black kombinacija.
  TEXT_DISPLAY: "text-4xl md:text-6xl font-headline font-black uppercase tracking-tight leading-none",
  TEXT_H1: "text-2xl md:text-4xl font-headline font-black uppercase tracking-tight leading-tight",
  TEXT_H2: "text-xl md:text-2xl font-headline font-bold tracking-tight",
  TEXT_BODY: "text-sm md:text-base font-body leading-relaxed",
  TEXT_LABEL: "text-xs font-bold uppercase tracking-widest",
  TEXT_MICRO: "text-[11px] font-bold uppercase tracking-wider",

  // Standardne veličine ikona: koristi se umesto nasumičnih text-[10px]/text-[18px] vrednosti.
  ICON_SM: "text-base",
  ICON_MD: "text-xl",
  ICON_LG: "text-2xl",

  // Standardni radijusi: koristi se umesto 10px/12px/16px/24px/32px kombinacija.
  RADIUS_CARD: "rounded-[16px]",
  RADIUS_CONTROL: "rounded-[10px]",
  RADIUS_PILL: "rounded-full",

  // Premium Card Layout
  PREMIUM_CARD: "gold-glow bg-gradient-to-b from-yellow-500/20 to-transparent p-[2px] rounded-[10px] group/card relative block shrink-0",
  PREMIUM_CARD_INNER: "bg-surface flex flex-col md:flex-row gap-6 md:gap-7 items-center rounded-[10px] border border-white/5 h-full",
  
  // Premium CTA Button Styles
  // Matches the best performing orange-gold gradient
  BTN_PREMIUM: "bg-gradient-to-br from-[#ffeb3b] to-[#fb8c00] !text-black font-black px-6 py-2 h-fit rounded hover:from-[#fb8c00] hover:to-[#ffeb3b] transition-all duration-300 text-sm uppercase shadow-lg shadow-yellow-500/20 active:scale-95",
  
  // Post Ad Button Style
  BTN_POST_AD: "bg-gradient-to-br from-[#FEBF0D] to-[#F8A010] !text-black font-black px-6 py-3.5 sm:px-12 sm:py-5 rounded-[10px] hover:brightness-110 transition-all uppercase tracking-widest text-xs sm:text-sm shadow-gold-glow-subtle flex justify-center items-center gap-3 group",
  
  // Secondary Button Style
  BTN_SECONDARY: "px-5 py-3.5 sm:px-10 sm:py-5 rounded-[10px] border border-white/10 text-white/50 backdrop-blur-md hover:bg-white/5 hover:border-white/20 hover:text-white transition-all duration-300 font-black uppercase tracking-widest text-xs sm:text-sm flex justify-center items-center",
  
  // Primary Button Style (Solid Secondary)
  BTN_PRIMARY: "bg-secondary !text-black font-black px-5 py-3.5 sm:px-10 sm:py-4 rounded-[10px] hover:bg-yellow-400 transition-all uppercase tracking-widest text-xs sm:text-sm shadow-gold-glow-subtle",
  
  // Badge Styles
  BADGE_PREMIUM: "bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-1.5 rounded-full text-base font-black shadow-gold-glow-subtle",
  BADGE_DEFAULT: "bg-white/5 text-slate-300 px-3 py-1 rounded-full text-[11px] font-bold uppercase",

  // Form Styles
  FORM_LABEL: "text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 block",
  FORM_INPUT: "w-full bg-surface border border-white/10 rounded-[10px] p-6 text-white text-lg font-medium outline-none focus:border-secondary/50 focus:ring-4 focus:ring-secondary/5 transition-all"
};
