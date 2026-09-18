import { APP_CONFIG } from '@/src/constants/config';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import CtaSection from '@/src/components/CtaSection';
import { VerticalCTA } from '@/src/components/VerticalCTA';
import { Briefcase } from 'lucide-react';
import { StandardPageHero } from '@/src/components/StandardPageHero';
import { AiSearchBar } from '@/src/components/AiSearchBar';
import SeoHead from '@/src/components/SeoHead';
import CalculatorBanner from '@/src/modules/core/components/home/CalculatorBanner';
import AboutSection from '@/src/modules/core/components/home/AboutSection';
import { FeedWidget } from '@/src/modules/social';
import { useHomepageData } from '@/src/modules/core/hooks/useHomepageData';
import { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from '@/src/lib/seo/schemas';
import { apiClient } from '@/src/lib/apiClient';
import { JobCard } from '@/src/modules/jobs/components/JobCard';
import { JobFilters } from '@/src/modules/jobs/components/jobs/JobFilters';
import { JobsUrgent } from '@/src/modules/jobs/components/jobs/JobsUrgent';
import { JobsPremium } from '@/src/modules/jobs/components/jobs/JobsPremium';
import { BrainIllustration } from '@/src/components/BrainIllustration';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import shieldMaster from '@/src/assets/images/shield-master.png';
import { useJobs, usePremiumJobs } from '@/src/modules/jobs/hooks/useJobs';
import { usePrefetch } from '@/src/hooks/usePrefetch';
import AiCompactCard from '@/src/modules/core/components/home/AiCompactCard';
import type { AiResponse, ListingItem } from '@/src/modules/core/components/home/aiFormat';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  // AI Search states
  const [aiData, setAiData] = useState<AiResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const fetchedQuery = useRef('');
  
  // Chip filtering states
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const isSearchActive = location.pathname === '/' && !!query;

  // Ovdje umesto skidanja CELIH KOLEKCIJA samo vučemo kompresovan BFF endpoint
  const { data: bffData, isLoading: isLoadingBff } = useHomepageData();
  const stats = bffData?.stats;
  const premiumJobs = bffData?.premiumJobs || [];
  const urgentJobs = bffData?.urgentJobs || [];
  const latestMachines = bffData?.latestMachines || [];
  const latestRealEstate = bffData?.latestRealEstate || [];
  const latestAccommodations = bffData?.latestAccommodations || [];
  const latestCaterings = bffData?.latestCaterings || [];
  const latestJobs = bffData?.latestJobs || [];

  // Reset search state when changing path away from /ai-pretraga
  useEffect(() => {
    if (!isSearchActive) {
      setAiData(null);
      setAiLoading(false);
      setAiError(null);
      setIsFadingOut(false);
      fetchedQuery.current = '';
      setActiveFilters([]);
    }
  }, [isSearchActive]);

  // Fetch AI search results when query parameter changes
  useEffect(() => {
    if (!isSearchActive) return;
    if (fetchedQuery.current === query) return;
    
    fetchedQuery.current = query;
    setAiLoading(true);
    setAiError(null);
    setAiData(null);
    setIsFadingOut(false);
    setActiveFilters([]);

    apiClient.post<AiResponse>('/ai/ask', { query, pageSize: 100 })
      .then(res => {
        setIsFadingOut(true);
        setTimeout(() => {
          setAiData(res);
          setAiLoading(false);
          setIsFadingOut(false);
        }, 300);
      })
      .catch(err => {
        console.error('[AiSearch] error:', err);
        setIsFadingOut(true);
        setTimeout(() => {
          setAiError('Greška prilikom učitavanja AI odgovora. Molimo pokušajte ponovo.');
          setAiLoading(false);
          setIsFadingOut(false);
        }, 300);
      });
  }, [isSearchActive, query]);

  // Dynamic Statistics from BFF Aggregated Data
  const statsValues = useMemo(() => ({
    totalAdsCount: stats?.totalAdsCount || 0,
    dynamicFirmsCount: stats?.dynamicFirmsCount || 0,
    dynamicWorkersCount: stats?.dynamicWorkersCount || 0,
    dynamicMachineryCount: stats?.dynamicMachineryCount || 0,
    dynamicRealEstateCount: stats?.dynamicRealEstateCount || 0,
    dynamicViewsCount: stats?.dynamicViewsCount || 0,
  }), [stats]);

  const {
    totalAdsCount,
    dynamicFirmsCount,
    dynamicWorkersCount,
    dynamicMachineryCount,
    dynamicRealEstateCount,
    dynamicViewsCount
  } = statsValues;

  // Učitaj SVE poslove direktno (ne samo 5 iz BFF) za Aktivna Ponuda sekciju
  const { data: allJobsData, isLoading: loadingAllJobs, hasNextPage, fetchNextPage, isFetchingNextPage } = useJobs({});
  const allJobs = useMemo(() => allJobsData?.pages.flatMap(p => p.items) || [], [allJobsData]);
  const { data: premiumQueryData } = usePremiumJobs({}, 12);
  const premiumJobsAll = useMemo(() => premiumQueryData?.pages.flatMap(p => p.items) || [], [premiumQueryData]);

  const [isUrgentExpanded, setIsUrgentExpanded] = useState(false);
  const [isPremiumExpanded, setIsPremiumExpanded] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [visibleCount, setVisibleCount] = useState(20);
  const allJobsPremiumFirst = useMemo(() => {
    const ids = new Set<string>();
    // 1. Svi hitni iz BFF-a — prvi u listi
    const urgent = urgentJobs.filter((j: any) => !ids.has(j.id) && ids.add(j.id));
    // 2. Svi premium — ne filtriramo protiv hitnih da bi se svi prikazali
    const premium = premiumJobsAll.filter((j: any) => !ids.has(j.id) && ids.add(j.id));
    // 3. Ostali iz allJobs — bez duplikata (ni hitni ni premium)
    const rest = allJobs.filter((j: any) => !ids.has(j.id));
    return [...urgent, ...premium, ...rest];
  }, [allJobs, premiumJobsAll, urgentJobs]);
  const prevJobsLenRef = useRef(allJobsPremiumFirst.length);
  useEffect(() => {
    if (allJobsPremiumFirst.length < prevJobsLenRef.current) {
      setVisibleCount(20);
    }
    prevJobsLenRef.current = allJobsPremiumFirst.length;
  }, [allJobsPremiumFirst.length]);
  const displayedJobs = useMemo(() => allJobsPremiumFirst.slice(0, visibleCount), [allJobsPremiumFirst, visibleCount]);
  const hasMore = visibleCount < allJobsPremiumFirst.length || !!hasNextPage;
  const loadMore = useCallback(() => {
    const nextCount = visibleCount + 24;
    setVisibleCount(nextCount);
    if (nextCount >= allJobsPremiumFirst.length && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [visibleCount, allJobsPremiumFirst.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getInitials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'SG';

  const handleCardClick = (to: string, state: any) => {
    navigate(to, { state });
  };

  const prefetch = usePrefetch();

  // Filter listings based on active filter chips
  const filteredListings = useMemo(() => {
    if (!aiData || !aiData.listings) return [];
    if (activeFilters.length === 0) return aiData.listings;

    return aiData.listings.filter(item => {
      return activeFilters.every(filter => {
        if (filter === 'premium') return item.isPremium;
        if (filter === 'hitno') return item.isUrgent;
        if (filter === 'satnica10') {
          if (!item.salary) return false;
          const nums = item.salary.match(/\d+/g);
          if (!nums) return false;
          return nums.some(n => {
            const val = parseInt(n, 10);
            return val >= 10 && val < 100;
          });
        }
        if (filter === 'smestaj') {
          const textToSearch = `${item.title} ${item.comp || ''} ${item.description || ''}`.toLowerCase();
          return textToSearch.includes('smeštaj') || textToSearch.includes('smestaj') || textToSearch.includes('smeštajem');
        }
        return item.location === filter;
      });
    });
  }, [aiData, activeFilters]);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary overflow-x-hidden">
      <SeoHead 
        title={isSearchActive ? `AI Pretraga: ${query} | Svet Građevine` : "Svet Građevine | Najveća mreža građevinskih poslova i radnika"}
        description="Pronađite najbolje građevinske poslove, pouzdane majstore i radnike. Platforma koja povezuje poslodavce i zaposlene u građevinskoj industriji Srbije i regiona."
        type="website"
        url={APP_CONFIG.BASE_URL}
        jsonLd={[WEBSITE_SCHEMA, ORGANIZATION_SCHEMA]}
      />
      
      {!isSearchActive && (
        <StandardPageHero
          title="Građevinski poslovi,"
          titleAccent="majstori i firme."
          subtitle="Partner građevinske industrije. Svet Građevine je platforma koja povezuje građevinske firme, majstore i radnike na jednom mestu. Naša misija je da olakšamo pronalaženje poslova, zaposlenih i novih poslovnih prilika u građevinskom sektoru."
          stats={[
            { label: "AKTIVNI OGLASI", value: isLoadingBff ? "..." : `+${totalAdsCount.toLocaleString()}`, icon: "work" },
          ]}
        >
          <div className="mt-8 flex flex-col gap-4 max-w-full w-full">
            <AiSearchBar vertical="jobs" />
          </div>
        </StandardPageHero>
      )}

      {isSearchActive && (
        <div className={`max-w-[1400px] mx-auto px-4 md:px-8 pb-24 relative z-30 min-h-[400px] flex flex-col items-center justify-start w-full transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          aiLoading ? 'mt-24 md:mt-36' : 'mt-28 md:mt-32'
        }`}>
          {/* Učitavanje / Skeleton State */}
          {aiLoading && (
            <div 
              className={`bg-gradient-to-br from-[#0c1e3d]/95 to-[#071329]/85 backdrop-blur-3xl border border-white/10 rounded-[28px] py-14 px-6 md:px-12 text-center space-y-7 shadow-[0_15px_50px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col items-center justify-center min-h-[390px] w-full transition-all duration-300 ${
                isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
              }`}
            >
              {/* Pozadinske svetleće kugle za ambijent */}
              <div className="absolute -top-12 -left-12 w-[200px] h-[200px] bg-secondary/15 rounded-full blur-[80px] pointer-events-none animate-fluid-orb-1"></div>
              <div className="absolute -bottom-12 -right-12 w-[200px] h-[200px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none animate-fluid-orb-2"></div>
              
              {/* Veliki logo - prelep i zatamnjen sa laganim disanjem */}
              <div className="relative group/logo flex items-center justify-center">
                <div className="absolute inset-0 bg-secondary/10 rounded-full blur-[50px] scale-95 animate-pulse"></div>
                <OptimizedImage
                  src={shieldMaster} 
                  alt="Svet Građevine" 
                  width={500}
                  height={500}
                  sizes="(max-width: 768px) 220px, 280px"
                  className="w-[220px] md:w-[280px] h-auto object-contain relative z-10 drop-shadow-[0_4px_30px_rgba(254,191,13,0.25)] animate-pulse" 
                  containerClassName="relative z-10"
                  fallbackType="default"
                />
              </div>

              {/* Tekst učitavanja */}
              <div className="space-y-3 relative z-10">
                <h4 className="text-secondary font-headline font-black text-xl md:text-2xl uppercase tracking-widest animate-pulse">
                  VAŠI REZULTATI SE UČITAVAJU
                </h4>
                <p className="text-xs md:text-sm text-slate-400 font-headline font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-80">
                  <span>Češljamo bazu aktivnih oglasa...</span>
                  <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping"></span>
                </p>
              </div>

              {/* Suptilna linija progresa */}
              <div className="w-[180px] md:w-[240px] h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10">
                <div className="h-full bg-secondary rounded-full w-[45%] animate-loading-bar"></div>
              </div>
            </div>
          )}

          {/* Greška u pretrazi */}
          {!aiLoading && aiError && (
            <div className="bg-[#111827]/80 backdrop-blur-3xl border border-white/5 rounded-[18px] p-8 text-center space-y-4 w-full animate-fade-in">
              <span className="material-symbols-outlined text-red-500 text-5xl font-black">warning</span>
              <h3 className="text-white text-xl font-bold uppercase tracking-tight">Došlo je do greške</h3>
              <p className="text-on-surface-variant max-w-md mx-auto">{aiError}</p>
              <button 
                onClick={() => { fetchedQuery.current = ''; navigate(location.pathname + location.search); }}
                className="px-6 py-2.5 bg-secondary !text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors uppercase text-sm tracking-wide"
              >
                Pokušaj ponovo
              </button>
            </div>
          )}

          {/* Uspešno učitani rezultati */}
          {!aiLoading && !aiError && aiData && (
            <div className="space-y-8 w-full animate-fade-in animate-slide-up">
              {/* AI Compact Response Card */}
              <AiCompactCard query={query} data={aiData} />

              {/* Filter Chips su uklonjeni po zahtevu */}

              {/* Divider between AI stats and listings */}
              <div className="w-full flex flex-col items-center justify-center py-10 mt-6 mb-4 relative animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-secondary/40 to-transparent"></div>
                </div>
                
                <div className="relative flex flex-col items-center">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-b from-[#101a26] to-[#0b131e] border border-secondary/30 shadow-[0_0_20px_rgba(254,191,13,0.2)] flex items-center justify-center mb-3 md:mb-4 rotate-3 hover:rotate-0 transition-transform duration-300">
                    <span className="material-symbols-outlined text-secondary text-2xl md:text-3xl drop-shadow-[0_0_8px_rgba(254,191,13,0.8)]" style={{ fontVariationSettings: '"FILL" 1' }}>view_list</span>
                  </div>
                  
                  <div className="px-8 py-2 bg-gradient-to-r from-transparent via-[#050F19] to-transparent">
                    <h3 className="text-white text-xl md:text-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] font-headline text-center leading-none">
                      Pronađeni <span className="text-secondary">Oglasi</span>
                    </h3>
                  </div>
                </div>
              </div>

              {/* Listings Output */}
              <div className="w-full">
                {filteredListings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch auto-rows-fr mt-4">
                    {filteredListings.map((item, idx) => (
                      <div 
                        key={item.id} 
                        className="opacity-0 animate-slide-up"
                        style={{ 
                          animationDelay: `${idx * 60}ms`,
                          animationFillMode: 'forwards'
                        }}
                      >
                        <JobCard 
                          job={item} 
                          viewMode="grid" 
                          prefetch={prefetch}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#111827]/80 backdrop-blur-3xl border border-white/5 rounded-[18px] p-8 text-center space-y-4 w-full">
                    <span className="material-symbols-outlined text-secondary text-5xl font-black">search_off</span>
                    <h3 className="text-white text-xl font-bold uppercase tracking-tight">
                      {aiData.listings && aiData.listings.length > 0 ? 'Nema oglasa za odabrane filtere' : 'Nema rezultata za vaš upit'}
                    </h3>
                    <p className="text-on-surface-variant max-w-md mx-auto">
                      {aiData.listings && aiData.listings.length > 0 
                        ? 'Pokušajte da isključite neki od filtera kako biste videli više oglasa.' 
                        : 'Trenutno nema oglasa koji potpuno odgovaraju vašem upitu. Ispod su najnoviji aktivni oglasi.'}
                    </p>

                    {(!aiData.listings || aiData.listings.length === 0) && (
                      <div className="pt-8 border-t border-white/5 space-y-4 text-left max-w-4xl mx-auto">
                        <h4 className="text-secondary font-black uppercase text-xs tracking-wider mb-4">Najnoviji aktivni poslovi:</h4>
                        <div className="space-y-4">
                          {latestJobs.slice(0, 3).map((job: any) => (
                            <JobCard 
                              key={job.id} 
                              job={job} 
                              viewMode="list" 
                              prefetch={prefetch}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conditionally show the rest of the homepage */}
      {!isSearchActive && (
        <>
          {/* Hitni poslovi */}
        <div className="scroll-fade-in">
            <JobsUrgent 
              jobs={urgentJobs}
              isExpanded={isUrgentExpanded}
              setIsExpanded={setIsUrgentExpanded}
              prefetch={prefetch}
              getInitials={getInitials}
              hasMore={false}
              loadMore={() => {}}
              loadingMore={false}
            />
          </div>

          {/* Premium poslovi */}
          <div className="scroll-fade-in">
            <JobsPremium 
              jobs={premiumJobs}
              isExpanded={isPremiumExpanded}
              setIsExpanded={setIsPremiumExpanded}
              prefetch={prefetch}
              getInitials={getInitials}
              hasMore={false}
              loadMore={() => {}}
              loadingMore={false}
            />
          </div>

          {/* Aktivna ponuda - full width, 4-col grid */}
          <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-12 md:py-20">

            {/* Header */}
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
              <div className="flex items-start gap-4">
                <div className="w-[8px] h-16 bg-secondary mt-1"></div>
                <div>
                  <h3 className="text-[35px] md:text-[38px] leading-[36px] font-black text-white uppercase tracking-tighter italic">
                    Aktivna <br /> <span className="text-secondary">Ponuda</span>
                  </h3>
                  <p className="text-[10px] font-black mt-2 tracking-[0.3em] uppercase">
                    <span className="text-white/40">UKUPNO PRONAĐENO:</span><br />
                    <span className="text-secondary">{isLoadingBff ? '...' : totalAdsCount} OGLASA</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 4-col grid */}
            {loadingAllJobs && displayedJobs.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 rounded-[10px] h-44 animate-pulse" />
                ))}
              </div>
            ) : displayedJobs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-stretch auto-rows-fr">
                {displayedJobs.map((job: any) => (
                  <JobCard key={job.id} job={job} viewMode="grid" prefetch={prefetch}/>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <span className="material-symbols-outlined text-5xl text-white/20 mb-4 block">work_off</span>
                <p className="text-white/40 text-sm">Trenutno nema aktivnih oglasa.</p>
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="flex flex-col items-center gap-3 mt-10">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-secondary text-xs font-black uppercase tracking-widest">
                    <span className="material-symbols-outlined animate-spin text-base">refresh</span>
                    Učitavanje...
                  </div>
                ) : (
                  <button
                    onClick={loadMore}
                    className="px-10 py-3.5 bg-secondary text-black font-black rounded-[10px] hover:bg-yellow-400 transition-all uppercase tracking-widest text-xs flex items-center gap-2 shadow-lg hover:shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: '"FILL" 1' }}>expand_more</span>
                    Učitaj još oglasa
                  </button>
                )}
                <p className="text-white/30 text-[10px] uppercase tracking-widest">
                  Prikazano {displayedJobs.length} od {allJobsPremiumFirst.length}+ oglasa
                </p>
              </div>
            )}
          </div>

          <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            <VerticalCTA 
              title="TRAŽITE RADNIKE?"
              description="POSTAVITE OGLAS ZA POSAO I PRONAĐITE NAJBOLJE MAJSTORE, INŽENJERE I STRUČNE TIMOVE ZA VAŠE PROJEKTE."
              buttonText="POSTAVI OGLAS"
              buttonLink="/postavi-oglas"
              icon={Briefcase}
            />
          </div>

          <div className="scroll-fade-in">
            <CalculatorBanner />
          </div>

          <div className="scroll-fade-in">
            <FeedWidget className="py-12 md:py-16" />
          </div>

          <div className="scroll-fade-in">
            <AboutSection 
              totalAdsCount={totalAdsCount}
              dynamicFirmsCount={dynamicFirmsCount}
              dynamicWorkersCount={dynamicWorkersCount}
              dynamicMachineryCount={dynamicMachineryCount}
              dynamicRealEstateCount={dynamicRealEstateCount}
              dynamicViewsCount={dynamicViewsCount}
            />
          </div>

          <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            <div className="h-px w-full bg-white/10"></div>
          </div>

          <div className="scroll-fade-in">
            <CtaSection />
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// POMOĆNI VIZUELNI ELEMENTI ZA AI SEARCH (COMPACT CARD, CHIPS, PARSERI)
// ============================================================================


