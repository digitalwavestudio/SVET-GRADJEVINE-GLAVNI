import React from "react";
import { useHeroSearch } from "@/src/modules/core/hooks/useHeroSearch";
import { AiSearchBar } from "@/src/components/AiSearchBar";

interface HeroSectionProps {
  isSearchActive?: boolean;
  isLoading?: boolean;
}

export default function HeroSection({ isSearchActive = false, isLoading = false }: HeroSectionProps) {
  const { activeTab } = useHeroSearch();

  const tabToVertical: Record<string, 'jobs' | 'machines' | 'accommodations' | 'catering' | 'real-estate' | 'masters' | 'companies'> = {
    poslovi: 'jobs',
    masine: 'machines',
    smestaj: 'accommodations',
    ketering: 'catering',
    placevi: 'real-estate',
    majstori: 'masters',
    firme: 'companies',
    'alat-i-oprema': 'machines',
  };
  const currentVertical = tabToVertical[activeTab as string] || 'jobs';

  return (
    <>
      <section className={`relative z-50 flex flex-col justify-start transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] [perspective:1000px] bg-surface-container-lowest ${
        isSearchActive
          ? isLoading
            ? 'h-0 pt-0 pb-0 overflow-hidden opacity-0 pointer-events-none'
            : 'h-[220px] md:h-[260px] pt-28 md:pt-36 pb-6'
          : 'min-h-[480px] sm:min-h-[520px] md:min-h-screen pt-[159px] md:pt-[240px] pb-20 md:pb-16'
      }`}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0 z-0 hero-bottom-fade"
            style={{ animation: "heroBgIn 1.5s ease-out forwards" }}
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
          </div>
        </div>

        <div className={`relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSearchActive ? 'mt-0' : 'mt-0 md:mt-[110px]'
        }`}>
          <div
            className="max-w-[1300px] w-full relative"
            style={{ animation: "heroContentIn 0.8s ease-out 0.2s both" }}
          >

            <div className={`transition-all duration-[550ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-top ${
              isSearchActive 
                ? 'opacity-0 -translate-y-10 scale-[0.96] pointer-events-none h-0 overflow-hidden mb-0' 
                : 'opacity-100 translate-y-0 scale-100 mb-11 md:mb-12'
            }`}>
              <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl font-[1000] md:font-[950] text-white leading-[0.85] tracking-[-0.05em] uppercase relative mb-8 text-center md:text-left">
                SVE ZA GRAĐEVINU
                <div>
                  <span className="text-secondary">NA JEDNOM MESTU</span>
                </div>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-slate-200 max-w-4xl font-medium leading-relaxed relative text-center md:text-left mx-auto md:mx-0">
                Poslovi, mašine, placevi, ketering, smeštaj, baza majstora i
                kompanije - jedinstven sistem za brze povezivanje i efikasnije
                poslovanje.
              </p>
            </div>

            {/* Cyber-HUD Universal Search & Category Nodes */}
            <div className={`relative z-20 w-full transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isSearchActive ? 'mt-0' : 'mt-0 md:mt-[110px]'
            }`}>
              {/* Main HUD Search Module - Now Above Categories */}
              <div className={`relative group/searchwrapper max-w-[970px] mx-auto md:mx-0 transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isSearchActive ? 'mb-0' : 'mb-0 md:mb-[204px]'
              }`}>
                <AiSearchBar vertical={currentVertical} isLoading={isLoading} />
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}

