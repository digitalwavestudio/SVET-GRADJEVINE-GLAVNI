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
import shieldMaster from '@/src/assets/images/shield-master.png';
import { useJobs, usePremiumJobs } from '@/src/modules/jobs/hooks/useJobs';

interface ListingItem {
  id: string;
  title: string;
  location: string;
  loc?: string;
  salary: string;
  plataMin?: number;
  plataMax?: number;
  salaryType?: string;
  company: string;
  companyName?: string;
  comp?: string;
  description: string;
  isPremium: boolean;
  isUrgent: boolean;
  createdAt: string;
  logo?: string;
  logoPlaceholder?: string;
}

interface AiResponse {
  answer: string;
  parsedIntent?: {
    vertikala: string;
    zanimanje: string;
    lokacija: string;
    tipPosla: string;
  };
  confidence?: number;
  count: number;
  listings?: ListingItem[];
}

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
    // urgent iz allJobs
    const urgent = allJobs.filter((j: any) => j.isUrgent && !ids.has(j.id) && ids.add(j.id));
    // premium iz dedicated upita
    const premium = premiumJobsAll.filter((j: any) => !ids.has(j.id) && ids.add(j.id));
    // ostali
    const rest = allJobs.filter((j: any) => !ids.has(j.id));
    return [...urgent, ...premium, ...rest];
  }, [allJobs, premiumJobsAll]);
  useEffect(() => setVisibleCount(20), [allJobsPremiumFirst]);
  const displayedJobs = useMemo(() => allJobsPremiumFirst.slice(0, visibleCount), [allJobsPremiumFirst, visibleCount]);
  const hasMore = visibleCount < allJobsPremiumFirst.length || !!hasNextPage;
  const loadMore = useCallback(() => {
    const nextCount = visibleCount + 20;
    setVisibleCount(nextCount);
    if (nextCount >= allJobsPremiumFirst.length && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [visibleCount, allJobsPremiumFirst.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getInitials = (name: string) => name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'SG';

  const handleCardClick = (to: string, state: any) => {
    navigate(to, { state });
  };

  const prefetchPlaceholder = () => {};

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
        jsonLd={[WEBSITE_SCHEMA, ORGANIZATION_SCHEMA]}
      />
      
      {!isSearchActive && (
        <StandardPageHero
          title="Više od"
          titleAccent="oglasnika."
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
        <div className={`max-w-7xl mx-auto px-4 md:px-8 pb-24 relative z-30 min-h-[400px] flex flex-col items-center justify-start w-full transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
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
                <img 
                  src={shieldMaster} 
                  alt="Svet Građevine" 
                  className="w-[220px] md:w-[280px] h-auto object-contain relative z-10 drop-shadow-[0_4px_30px_rgba(254,191,13,0.25)] animate-pulse" 
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
                          prefetch={prefetchPlaceholder} 
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
                              prefetch={prefetchPlaceholder} 
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
              prefetch={prefetchPlaceholder}
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
              prefetch={prefetchPlaceholder}
              getInitials={getInitials}
              hasMore={false}
              loadMore={() => {}}
              loadingMore={false}
            />
          </div>

          {/* Aktivna ponuda - full width, 4-col grid */}
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20">

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
                  <JobCard key={job.id} job={job} viewMode="grid" prefetch={prefetchPlaceholder} />
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

          <div className="max-w-7xl mx-auto px-4 md:px-8">
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

          <div className="max-w-7xl mx-auto px-4 md:px-8">
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

function extractIntent(query: string, listings: ListingItem[]) {
  const q = query.toLowerCase();
  let lokacija = '';
  let zanimanje = '';
  
  const gradovi = ['beograd', 'nis', 'niš', 'novi sad', 'novi-sad', 'subotica', 'kragujevac', 'krusevac', 'kruševac', 'cacak', 'čačak', 'valjevo', 'nemačka', 'nemacka', 'hrvatska', 'slovenija', 'zlatibor'];
  for (const g of gradovi) {
    if (q.includes(g)) {
      lokacija = g.charAt(0).toUpperCase() + g.slice(1);
      if (lokacija === 'Nis') lokacija = 'Niš';
      if (lokacija === 'Nemacka') lokacija = 'Nemačka';
      if (lokacija === 'Novi sad') lokacija = 'Novi Sad';
      break;
    }
  }
  
  if (!lokacija && listings.length > 0) {
    const locs = listings.map(l => l.location).filter(Boolean);
    if (locs.length > 0) {
      const mostCommon = locs.sort((a,b) =>
        locs.filter(v => v===a).length - locs.filter(v => v===b).length
      ).pop();
      lokacija = mostCommon || 'Srbija';
    } else {
      lokacija = 'Srbija';
    }
  } else if (!lokacija) {
    lokacija = 'Srbija';
  }

  const zanimanja = ['tesar', 'armirač', 'armirac', 'zidar', 'moler', 'fasader', 'keramicar', 'keramičar', 'vodoinstalater', 'električar', 'elektricar', 'krovopokrivač', 'krovopokrivac', 'rukovalac', 'bravar', 'stolar', 'gipsar'];
  for (const z of zanimanja) {
    if (q.includes(z)) {
      zanimanje = z.charAt(0).toUpperCase() + z.slice(1);
      if (zanimanje === 'Armirac') zanimanje = 'Armirač';
      if (zanimanje === 'Keramicar') zanimanje = 'Keramičar';
      if (zanimanje === 'Elektricar') zanimanje = 'Električar';
      break;
    }
  }
  
  if (!zanimanje && listings.length > 0) {
    const firstTitle = listings[0].title;
    zanimanje = firstTitle.split('—')[0]?.split('-')[0]?.trim() || firstTitle.split(' ')[0];
  }
  
  return {
    vertical: 'Poslovi',
    profession: zanimanje || 'Građevinski radnik',
    location: lokacija
  };
}

function extractStats(listings: ListingItem[]) {
  if (listings.length === 0) {
    return { locations: 'Nema', rates: 'Nema', professions: 'Nema' };
  }

  const locs = Array.from(new Set(listings.map(l => l.location).filter(Boolean)));
  const locationsStr = locs.slice(0, 3).join(', ') + (locs.length > 3 ? '...' : '');

  let minRate = Infinity;
  let maxRate = -Infinity;
  let currency = '€/h';
  
  listings.forEach(l => {
    if (!l.salary) return;
    const matches = l.salary.match(/\d+/g);
    if (matches) {
      matches.forEach(numStr => {
        const num = parseInt(numStr, 10);
        if (num > 0 && num < 100) {
          if (num < minRate) minRate = num;
          if (num > maxRate) maxRate = num;
        }
      });
    }
  });

  const ratesStr = minRate !== Infinity && maxRate !== -Infinity
    ? `${minRate}–${maxRate} ${currency}`
    : 'Dogovor';

  const titles = Array.from(new Set(listings.map(l => l.title.split('—')[0]?.split('-')[0]?.trim() || l.title.split(' ')[0]).filter(Boolean)));
  const professionsStr = titles.slice(0, 3).join(', ') + (titles.length > 3 ? '...' : '');

  return {
    locations: locationsStr,
    rates: ratesStr,
    professions: professionsStr
  };
}

function applyBoldRules(text: string) {
  let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white tracking-wide">$1</strong>');
  parsed = parsed.replace(/\*/g, '');

  // Boldovanje satnica i cena (boja: zlatno-žuta text-secondary)
  parsed = parsed.replace(/(\b\d+[-–]\d+\s*(?:evra|€|eur)\b)/gi, '<strong class="font-bold text-secondary tracking-wide">$1</strong>');
  parsed = parsed.replace(/(satnicom|satnic[a-z]*)/gi, '<strong class="font-bold text-secondary">$1</strong>');

  // Boldovanje pogodnosti (boja: bela text-white)
  parsed = parsed.replace(/(smeštaj[a-z]*|smestaj[a-z]*|obrok[a-z]*|hran[a-z]*|prevoz[a-z]*|viz[a-z]*|radn[a-z]* dozvol[a-z]*|dokumentacij[a-z]*)/gi, '<strong class="font-bold text-white">$1</strong>');

  // Boldovanje svih lokacija (Srbija, Nemačka, Beograd, Borča, Zlatibor...) u belu boju
  parsed = parsed.replace(/(\b(?:Srbija|Sloveniji|Slovenija|Hrvatskoj|Hrvatska|Nemačkoj|Nemačka|Austrija|Beogradu|Beograd|Borča|Zlatiboru|Zlatibor|Negotinu|Negotin|Sremskoj\s+Mitrovici|Sremska\s+Mitrovica|Subotici|Subotica|Nišu|Niš|Hvaru|Hvar|Splitu|Split|Zagrebu|Zagreb|Novi\s+Sad|Kragujevac|Kruševac|Zrenjanin|Inostranstvu|Inostranstvo)\b)/gi, '<strong class="font-bold text-white tracking-wide">$1</strong>');

  return parsed;
}

function parseMarkdown(text: string) {
  if (!text) return '';

  // 1. Pripremamo tekst ubacivanjem preloma reda i crtica ispred gradova/lokacija koji imaju dvotačku
  let formattedText = text;
  formattedText = formattedText.replace(/(?<!\n-\s+)(\b(?:Beogradu|Sloveniji|Zlatiboru|Negotinu|Hrvatskoj|Sremskoj\s+Mitrovici|Subotici|Srbiji|Inostranstvu)\b\s*:)/g, '\n- $1');

  // 2. Podelimo celi tekst po novim redovima
  const lines = formattedText.split('\n').map(l => l.trim()).filter(Boolean);
  
  const listItems = lines.map((line, idx) => {
    // Provera da li je to pod-stavka koja počinje sa crticom
    if (line.startsWith('-')) {
      const content = line.substring(1).trim();
      const parsed = applyBoldRules(content);
      return `<li class="relative pl-8 py-1.5 text-slate-300 leading-relaxed font-body text-base md:text-lg list-none transition-all hover:text-white">
        <span class="absolute left-3 top-[15px] w-1.5 h-1.5 bg-secondary/60 rounded-full"></span>
        ${parsed}
      </li>`;
    }

    // Provera za prvu rečenicu (rezime)
    const lower = line.toLowerCase();
    if (idx === 0 && (lower.startsWith('pronađeno je') || lower.startsWith('pronadjeno je'))) {
      const cleanUpper = line.replace(/\*\*/g, '').replace(/\*/g, '').toUpperCase();
      return `<li class="relative pl-6 py-2 list-none"><strong class="font-black text-secondary uppercase tracking-wider text-base md:text-lg">${cleanUpper}</strong></li>`;
    }

    // Obična linija teksta
    const parsed = applyBoldRules(line);
    return `<li class="relative pl-6 py-1.5 text-slate-300 leading-relaxed font-body text-base md:text-lg list-none transition-all hover:text-white">
      <span class="absolute left-0 top-[13px] w-1.5 h-1.5 bg-secondary rounded-full"></span>
      ${parsed}
    </li>`;
  });

  return `<ul class="space-y-3">${listItems.join('')}</ul>`;
}

function AiCompactCard({ query, data }: { query: string; data: AiResponse }) {
  const listings = data.listings || [];
  const stats = useMemo(() => extractStats(listings), [listings]);
  const intent = data.parsedIntent;
  const confidence = data.confidence || 0;

  const structuredAnswer = useMemo(() => {
    if (!data.answer) return null;
    try {
      return JSON.parse(data.answer) as { summary: string; bullets: Array<{ emoji: string; text: string }>; closing: string };
    } catch {
      return { summary: data.answer, bullets: [], closing: '' };
    }
  }, [data.answer]);

  const handleCopy = () => {
    if (!structuredAnswer) return;
    const text = `${structuredAnswer.summary}\n\n${structuredAnswer.bullets.map(b => `${b.emoji} ${b.text}`).join('\n')}\n\n${structuredAnswer.closing}`;
    navigator.clipboard.writeText(text);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="w-full relative">
      {/* Ujedinjeni AI Kontejner sa Mockup-a */}
      <div className="bg-[#0c1520]/80 border border-white/10 rounded-[28px] p-6 md:p-8 mb-8 shadow-xl shadow-black/40 relative z-10 w-full text-left">
        {/* Gornji red: Header + Understanding Card (Grid layout da se desni boks raširi) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-0">
          {/* Levo: Header informacije */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary text-xl">smart_toy</span>
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-[0.4em] uppercase text-secondary">AI PRETRAGA ✨</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-1 leading-tight">
                Pronađeno {data.count} oglasa
              </h1>
              <p className="text-white/40 text-base mb-4">za <span className="text-[#febf0d] font-bold">{query}</span></p>
            </div>
            
            <div className="hidden sm:flex flex-col sm:flex-row gap-2 sm:gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all shadow-md w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                Kopiraj sažetak
              </button>
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all shadow-md w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-sm">share</span>
                Podeli
              </button>
            </div>
          </div>

          {/* Desno: AI Understanding Card (Raširen pomoću lg:col-span-5) */}
          {intent && (
            <div className="lg:col-span-5 bg-[#121c27]/45 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-inner min-h-[190px]">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary">AI RAZUMEVANJE UPITA</h3>
                </div>
                <div className="flex flex-col md:flex-row md:items-baseline gap-0 md:gap-2 mb-4">
                  <span className="text-6xl font-extrabold text-teal-400 leading-none">{confidence}%</span>
                  <span className="text-sm md:text-base text-white/60 font-bold">pouzdanost</span>
                </div>
              </div>
              <div className="space-y-3 relative z-10 text-white/95 text-base">
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-white/60 mr-1.5">Vertikala:</span>
                    <span className="text-white font-semibold break-words">{intent.vertikala}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-white/60 mr-1.5">Zanimanje:</span>
                    <span className="text-white font-semibold break-words">{intent.zanimanje}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-white/60 mr-1.5">Lokacija:</span>
                    <span className="text-white font-semibold break-words">{intent.lokacija}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-white/60 mr-1.5">Tip posla:</span>
                    <span className="text-white font-semibold break-words">{intent.tipPosla}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Horizontalni Divider */}
        <div className="border-t border-white/10 mt-[-50px] mb-4 w-full lg:w-[58%]"></div>

        {/* Donji deo: AI Odgovor */}
        {structuredAnswer && (
          <div className="relative z-10 mt-20 md:mt-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-sm">smart_toy</span>
              </div>
              <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-secondary font-headline">AI ODGOVOR</h3>
            </div>
            
            <div className="relative z-10">
              <p className="text-white/90 leading-relaxed mb-4 text-base md:text-lg" 
                 dangerouslySetInnerHTML={{ __html: applyBoldRules(structuredAnswer.summary) }} 
              />
              
              {structuredAnswer.bullets.length > 0 && (
                <div className="space-y-4 mb-4">
                  {structuredAnswer.bullets.map((bullet, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <span className="text-xl shrink-0 mt-0.5">{bullet.emoji}</span>
                      <p className="text-white/80 text-base md:text-lg leading-relaxed pt-1"
                         dangerouslySetInnerHTML={{ __html: applyBoldRules(bullet.text) }} 
                      />
                    </div>
                  ))}
                </div>
              )}
              
               {structuredAnswer.closing && (
                <p className="text-white/60 text-base mt-4 pt-4 border-t border-white/5"
                   dangerouslySetInnerHTML={{ __html: applyBoldRules(structuredAnswer.closing) }} 
                />
              )}

              {/* Pilule sa statistikama */}
              <div className="flex flex-col sm:flex-row gap-2 mt-5 pt-4 border-t border-white/5">
                <span className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs md:text-sm font-bold shadow-md">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  AI pouzdanost: {confidence}%
                </span>
                <span className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-xs md:text-sm font-bold shadow-md">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
                  Vreme pretrage: 2.4s
                </span>
                <span className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs md:text-sm font-bold shadow-md">
                  Izvori podataka: {listings.length + 7}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-8 text-left relative z-10">
        <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">ZANIMANJE</span>
            <p className="text-white font-bold text-base md:text-lg font-headline truncate">{intent?.zanimanje || query || '-'}</p>
            <p className="text-white/40 text-xs font-headline">Glavna pretraga</p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">LOKACIJE</span>
            <p className="text-white font-bold text-base md:text-lg font-headline truncate">{intent?.lokacija || stats.locations}</p>
            <p className="text-white/40 text-xs font-headline">{listings.length} oglasa</p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">SATNICE</span>
            <p className="text-white font-bold text-base md:text-lg font-headline truncate">{stats.rates}</p>
            <p className="text-white/40 text-xs font-headline">Prosečna satnica</p>
          </div>
        </div>

        <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">UKUPNO OGLASA</span>
            <p className="text-white font-bold text-base md:text-lg font-headline truncate">{data.count || listings.length}</p>
            <p className="text-white/40 text-xs font-headline">Aktivnih oglasa</p>
          </div>
        </div>
      </div>
    </div>
  );
}


interface FilterChipsProps {
  listings: ListingItem[];
  activeFilters: string[];
  setActiveFilters: React.Dispatch<React.SetStateAction<string[]>>;
}

function FilterChips({ listings, activeFilters, setActiveFilters }: FilterChipsProps) {
  const locs = useMemo(() => {
    return Array.from(new Set(listings.map(l => l.location).filter(Boolean)));
  }, [listings]);

  const hasHighRate = useMemo(() => {
    return listings.some(l => {
      if (!l.salary) return false;
      const nums = l.salary.match(/\d+/g);
      if (!nums) return false;
      return nums.some(n => {
        const val = parseInt(n, 10);
        return val >= 10 && val < 100;
      });
    });
  }, [listings]);

  const hasAccommodation = useMemo(() => {
    return listings.some(l => {
      const textToSearch = `${l.title} ${l.comp || ''} ${l.description || ''}`.toLowerCase();
      return textToSearch.includes('smeštaj') || textToSearch.includes('smestaj') || textToSearch.includes('smeštajem');
    });
  }, [listings]);

  const toggleFilter = (filter: string) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  return (
    <div className="hidden md:flex flex-col gap-3 py-4 border-b border-white/[0.06] relative z-20">
      <span className="text-[11px] font-headline font-black uppercase tracking-widest text-secondary block font-headline">
        Brzo filtriranje oglasa:
      </span>
      <div className="flex flex-wrap items-center gap-2.5 overflow-x-auto scrollbar-none pb-1 font-headline">
        {locs.map(loc => (
          <button
            key={loc}
            onClick={() => toggleFilter(loc)}
            className={`h-11 px-5 rounded-[12px] border text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shrink-0 select-none cursor-pointer ${
              activeFilters.includes(loc)
                ? 'bg-secondary/10 border-secondary text-secondary shadow-gold-glow-subtle'
                : 'bg-[#111827]/40 border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
            {loc}
          </button>
        ))}

        {listings.some(l => l.isPremium) && (
          <button
            onClick={() => toggleFilter('premium')}
            className={`h-11 px-5 rounded-[12px] border text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shrink-0 select-none cursor-pointer ${
              activeFilters.includes('premium')
                ? 'bg-secondary/10 border-secondary text-secondary shadow-gold-glow-subtle'
                : 'bg-[#111827]/40 border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <span className="text-sm">⭐</span>
            Premium
          </button>
        )}

        {listings.some(l => l.isUrgent) && (
          <button
            onClick={() => toggleFilter('hitno')}
            className={`h-11 px-5 rounded-[12px] border text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shrink-0 select-none cursor-pointer ${
              activeFilters.includes('hitno')
                ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'bg-[#111827]/40 border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <span className="text-sm">🔥</span>
            Hitno
          </button>
        )}

        {hasHighRate && (
          <button
            onClick={() => toggleFilter('satnica10')}
            className={`h-11 px-5 rounded-[12px] border text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shrink-0 select-none cursor-pointer ${
              activeFilters.includes('satnica10')
                ? 'bg-secondary/10 border-secondary text-secondary shadow-gold-glow-subtle'
                : 'bg-[#111827]/40 border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <span className="text-sm">💶</span>
            Satnica ≥ 10€/h
          </button>
        )}

        {hasAccommodation && (
          <button
            onClick={() => toggleFilter('smestaj')}
            className={`h-11 px-5 rounded-[12px] border text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shrink-0 select-none cursor-pointer ${
              activeFilters.includes('smestaj')
                ? 'bg-secondary/10 border-secondary text-secondary shadow-gold-glow-subtle'
                : 'bg-[#111827]/40 border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <span className="text-sm">🏠</span>
            Smeštaj obezbeđen
          </button>
        )}
      </div>
    </div>
  );
}


