import React from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  Search,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown,
  Users,
  Cpu,
  BookOpen,
} from "lucide-react";
import { useHeroSearch, HeroTabType } from "@/src/modules/core/hooks/useHeroSearch";
import { CategoryNodes } from "@/src/modules/core/components/home/hero/CategoryNodes";
import { HeroFilters } from "@/src/modules/core/components/home/hero/HeroFilters";
import { Button } from "@/src/components/ui/Button";

const placeholderMap = {
  poslovi: "Traži posao... npr. Inženjer",
  majstori: "Traži majstora... npr. Moler",
  firme: "Traži firmu... npr. Izvođači",
  smestaj: "Traži smeštaj... npr. Kontejner",
  ketering: "Traži ketering... npr. Obroci",
  "alat-i-oprema": "Traži alat... npr. Polovni",
  masine: "Traži mašinu... npr. Bager",
  placevi: "Traži plac... npr. Zemljište",
};

export default function HeroSection() {
  const {
    globalQuery,
    setGlobalQuery,
    showFilters,
    setShowFilters,
    activeTab,
    setActiveTab,
    filters,
    handleSearch,
    handleCategorySearch,
  } = useHeroSearch();

  return (
    <>
      <section className="relative z-50 min-h-screen flex items-center pt-14 md:pt-24 pb-8 md:pb-16 bg-surface-container-lowest">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-0 hero-bottom-fade"
          >
            <div className="w-full h-full bg-[#050F19] bg-blueprint [background-size:40px_40px]"></div>
            <div
              className="absolute inset-0 z-10"
              style={{
                background:
                  "linear-gradient(to right, rgba(5, 15, 25, 0.95) 0%, rgba(5, 15, 25, 0.7) 40%, rgba(5, 15, 25, 0.1) 100%)",
              }}
            ></div>
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-surface-container-lowest to-transparent z-20"></div>
          </motion.div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-[1300px] w-full relative mt-16 md:mt-32"
          >

            <h1 className="font-headline text-3xl sm:text-5xl md:text-8xl font-black text-white leading-[1.1] mb-8 tracking-tighter uppercase relative">
              SVE ZA GRAĐEVINU
              <div>
                <span className="text-secondary">NA JEDNOM MESTU</span>
              </div>
            </h1>
            <p className="text-sm sm:text-lg text-slate-200 max-w-3xl mb-12 font-medium leading-relaxed relative">
              Poslovi, mašine, placevi, ketering, smeštaj, baza majstora i
              kompanije - jedinstven sistem za brze povezivanje i efikasnije
              poslovanje.
            </p>

            {/* Cyber-HUD Universal Search & Category Nodes */}
            <div className="relative z-20 w-full mt-10 md:mt-40">
              {/* Main HUD Search Module - Now Above Categories */}
              <div className="relative mb-8 md:mb-36 group/searchwrapper">


                <form
                  onSubmit={handleSearch}
                  className="flex flex-col md:flex-row items-center gap-4 w-full"
                >
                  {/* Unified Search Unit: Input + Search Button */}
                  <div className="flex-1 w-full relative bg-transparent rounded-[10px] border border-white/10 p-1.5 md:p-3 group/search transition-all duration-700 hover:border-white/20 focus-within:border-white/30 shadow-enterprise overflow-hidden flex items-center">
                    <div className="pl-2 md:pl-6 text-white/40 group-focus-within/search:text-white transition-colors duration-500">
                      <Search size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div className="flex-1 mx-2 md:mx-6">
                      <input
                        type="text"
                        value={globalQuery}
                        onChange={(e) => setGlobalQuery(e.target.value)}
                        placeholder={placeholderMap[activeTab]}
                        autoComplete="off"
                        spellCheck="false"
                        className="w-full bg-transparent border-none focus:ring-0 focus:shadow-none text-white placeholder-white/70 focus:placeholder-white text-[11px] sm:text-base md:text-xl font-headline font-black italic tracking-tight py-2 md:py-6 px-0 outline-none uppercase transition-all text-ellipsis"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="h-10 sm:h-14 md:h-16 bg-secondary text-[#0d151c] px-3 sm:px-6 md:px-8 rounded-[8px] font-headline font-black uppercase italic tracking-tighter text-xs sm:text-base md:text-lg transition-all duration-500 hover:bg-[#ffad3a] active:scale-95 flex items-center justify-center gap-2 group/btn shrink-0 mr-1 md:mr-4 border-none"
                    >
                      <span className="hidden sm:inline">Pretraži</span>
                      <ArrowRight
                        size={16}
                        className="sm:w-[18px] sm:h-[18px] group-hover/btn:translate-x-2 transition-transform duration-500"
                        strokeWidth={3}
                      />
                    </Button>

                    {/* HUD Decor Line */}
                    <div className="absolute bottom-3 left-20 right-48 h-px bg-gradient-to-r from-transparent via-secondary/20 to-transparent pointer-events-none"></div>
                  </div>
                </form>
              </div>

              {/* Category Floating Nodes Grid */}
              <CategoryNodes 
                activeTab={activeTab} 
                onTabChange={(id) => {
                  setActiveTab(id as HeroTabType);
                  setShowFilters(true);
                  setGlobalQuery("");
                }} 
              />

              {/* Detached Secondary Action: Filters Toggle */}
              <div className="flex justify-center mb-10 relative z-30">
                <Button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-12 md:h-16 px-4 md:px-10 rounded-[10px] border transition-all duration-500 flex items-center justify-center gap-2 md:gap-4 group/filter overflow-hidden relative shadow-lg ${
                    showFilters
                      ? "bg-secondary/10 border-secondary text-secondary shadow-gold-glow-subtle"
                      : "bg-transparent border-white/10 text-white/80 hover:text-white hover:border-secondary/50 hover:bg-white/5"
                  }`}
                >
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-secondary transform scale-x-0 transition-transform duration-500 group-hover/filter:scale-x-100 opacity-20"></div>
                  <SlidersHorizontal
                    size={18}
                    className={`md:w-5 md:h-5 ${
                      showFilters
                        ? "text-secondary"
                        : "text-white/80 group-hover/filter:text-white"
                    }`}
                  />
                  <span className="font-headline font-black uppercase italic tracking-tighter text-sm md:text-lg">
                    Dodatni filteri
                  </span>
                  <ChevronDown
                    size={16}
                    className={`md:w-4 md:h-4 transition-transform duration-500 ${showFilters ? "rotate-180 text-secondary" : "text-white/80 group-hover/filter:text-white"}`}
                  />
                </Button>
              </div>

              {/* Expanding Filters Section - Redesigned for HUD */}
              <HeroFilters 
                activeTab={activeTab}
                showFilters={showFilters}
                onSearch={handleCategorySearch}
                filters={filters}
              />
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 md:gap-10 px-4 pt-12 border-t border-white/5">
              <Link
                to="/zajednica"
                className="text-sm md:text-base font-headline italic uppercase tracking-tighter font-black text-slate-500 hover:text-secondary transition-colors flex items-center gap-2 group"
              >
                <Users
                  size={18}
                  className="group-hover:scale-110 transition-transform stroke-[3]"
                />{" "}
                Preporuke & Zajednica
              </Link>
              <Link
                to="/digitalni-alati"
                className="text-sm md:text-base font-headline italic uppercase tracking-tighter font-black text-slate-500 hover:text-secondary transition-colors flex items-center gap-2 group"
              >
                <Cpu
                  size={18}
                  className="group-hover:scale-110 transition-transform stroke-[3]"
                />{" "}
                Digitalni Alati
              </Link>
              <div className="relative group/mag">
                <div className="text-sm md:text-base font-headline italic uppercase tracking-tighter font-black text-slate-600 cursor-default flex items-center gap-2 group-hover/mag:text-secondary/50 transition-colors">
                  <BookOpen
                    size={18}
                    className="stroke-[3]"
                  />{" "}
                  Magazini i blogovi
                </div>
                
                {/* Discrete HUD Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover/mag:opacity-100 transition-all duration-300 scale-95 group-hover/mag:scale-100 z-50">
                  <div className="bg-[#050F19] border border-secondary/30 px-3 py-1.5 rounded-sm shadow-xl flex items-center gap-2 whitespace-nowrap">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
                    <span className="text-white font-headline font-black italic uppercase tracking-tighter text-[10px]">Modul u pripremi</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
