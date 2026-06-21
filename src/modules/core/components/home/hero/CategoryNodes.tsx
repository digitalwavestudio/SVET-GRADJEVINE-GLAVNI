import React from "react";
import { 
  Briefcase, 
  HardHat, 
  Building2, 
  Home, 
  Utensils, 
  Store, 
  Tractor, 
  Map 
} from "lucide-react";
import { HeroTabType } from "@/src/modules/core/hooks/useHeroSearch";

export const HERO_TABS = [
  { id: "poslovi", label: "Poslovi", icon: Briefcase },
  { id: "majstori", label: "Majstori", icon: HardHat },
  { id: "firme", label: "Firme", icon: Building2 },
  { id: "smestaj", label: "Smeštaj", icon: Home },
  { id: "ketering", label: "Ketering", icon: Utensils },
  { id: "alat-i-oprema", label: "Alat i oprema", icon: Store },
  { id: "masine", label: "Mašine", icon: Tractor },
  { id: "placevi", label: "Placevi", icon: Map },
] as const;

interface CategoryNodesProps {
  activeTab: HeroTabType;
  onTabChange: (id: HeroTabType) => void;
}

export const CategoryNodes: React.FC<CategoryNodesProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <>
      {/* Mobile Instagram-Style Circular Strip */}
      <div className="flex md:hidden overflow-x-auto no-scrollbar gap-4 py-4 px-4 w-full mb-6 mt-10 scroll-smooth snap-x snap-mandatory touch-pan-x">
        {HERO_TABS.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <div
              key={tab.id}
              className="flex flex-col items-center text-center shrink-0 w-[6.5rem] cursor-pointer snap-start"
              style={{ animation: `nodeFadeIn 0.4s ease-out ${idx * 0.04}s both` }}
              onClick={() => onTabChange(tab.id as HeroTabType)}
            >
              {/* Outer Golden/Glowing Orb Wrapper */}
              <div className="relative active:scale-95 transition-transform duration-150">
                <div
                  className={`w-[5.5rem] h-[5.5rem] rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive
                      ? "border-secondary bg-secondary/15 shadow-[0_0_15px_rgba(254,191,13,0.4)] scale-105"
                      : "border-white/10 bg-white/5 hover:border-secondary/40"
                  }`}
                >
                  <Icon
                    size={32}
                    className={`transition-colors duration-300 ${
                      isActive ? "text-secondary" : "text-white/70"
                    }`}
                  />
                </div>
                {/* Active Dot Indicator */}
                {isActive && (
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-secondary border-2 border-slate-950 rounded-full animate-pulse"></span>
                )}
              </div>
              
              <span
                className={`text-[11px] font-black uppercase tracking-widest mt-3 truncate w-full px-1 transition-colors ${
                  isActive ? "text-secondary" : "text-white/60"
                }`}
              >
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Desktop Tech Scanner Grid */}
      <div className="hidden md:grid grid-cols-4 gap-x-12 gap-y-16 mb-16">
        {HERO_TABS.map((tab, idx) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <div
              key={tab.id}
              className="group relative cursor-pointer"
              style={{ animation: `nodeSlideIn 0.5s ease-out ${0.3 + idx * 0.05}s both` }}
              onClick={() => onTabChange(tab.id as HeroTabType)}
            >
              {/* Background Sequence Number */}
              <div className="absolute -left-8 -top-8 text-[80px] font-black text-white/[0.02] pointer-events-none group-hover:text-secondary/[0.05] transition-colors duration-1000 italic select-none hidden sm:block">
                0{idx + 1}
              </div>

              <div className="relative flex items-center gap-6">
                {/* Scanner Line */}
                <div
                  className={`w-[1px] h-12 transition-all duration-500 ${
                    isActive
                      ? "bg-secondary shadow-gold-glow-strong"
                      : "bg-white/10 group-hover:bg-secondary/50 group-hover:shadow-gold-glow-subtle"
                  }`}
                ></div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                        isActive
                          ? "bg-secondary"
                          : "bg-white/20 group-hover:bg-secondary/40"
                      }`}
                    ></div>
                  </div>

                  <div
                    className={`flex items-center gap-4 transition-all duration-500 ease-[0.16, 1, 0.3, 1] ${
                      isActive ? "translate-x-3" : "group-hover:translate-x-2"
                    }`}
                  >
                    <span
                      className={`font-headline text-xl font-black uppercase italic tracking-tighter transition-all duration-500 line-clamp-1 ${
                        isActive
                          ? "text-secondary drop-shadow-[0_0_10px_rgba(254,191,13,0.3)]"
                          : "text-white/90 group-hover:text-white"
                      }`}
                    >
                      {tab.label}
                    </span>

                    {/* Tech Decor Elements */}
                    <div
                      className={`flex flex-col gap-1 transition-all duration-700 ${
                        isActive
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-2"
                      }`}
                    >
                      <div className="w-6 h-[1px] bg-secondary/50"></div>
                      <div className="w-4 h-[1px] bg-secondary/30"></div>
                    </div>
                  </div>
                </div>

                {/* Animated Icon Orb */}
                <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                  {/* Inner circle */}
                  <div
                    className={`absolute inset-0 rounded-full border transition-all duration-700 ${
                      isActive
                        ? "border-secondary/40 bg-secondary/10 scale-110 shadow-gold-glow"
                        : "border-white/5 group-hover:border-secondary/20 group-hover:bg-secondary/5 group-hover:scale-105"
                    }`}
                  ></div>

                  {/* Rotating Outer Ring */}
                  <div
                    className={`absolute -inset-1 rounded-full border-t-2 border-r border-transparent transition-all duration-[1s] ease-linear ${
                      isActive
                        ? "border-secondary opacity-100 animate-[spin_3s_linear_infinite]"
                        : "opacity-0 group-hover:opacity-40 border-secondary group-hover:animate-[spin_4s_linear_infinite]"
                    }`}
                  ></div>

                  {/* Tech Notches */}
                  <div
                    className={`absolute -inset-2 border border-white/5 rounded-full transition-opacity duration-700 ${isActive ? "opacity-20" : "opacity-0"}`}
                  ></div>

                  <Icon
                    size={20}
                    className={`relative z-10 transition-all duration-500 ${
                      isActive
                        ? "text-secondary scale-110"
                        : "text-white/80 group-hover:text-secondary group-hover:scale-105"
                    }`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
