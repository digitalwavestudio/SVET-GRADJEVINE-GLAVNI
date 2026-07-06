import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import CtaSection from '@/src/components/CtaSection';
import SeoHead from '@/src/components/SeoHead';
import HeroSection from '@/src/modules/core/components/home/HeroSection';
import CalculatorBanner from '@/src/modules/core/components/home/CalculatorBanner';
import UrgentJobs from '@/src/modules/core/components/home/UrgentJobs';
import PremiumJobs from '@/src/modules/core/components/home/PremiumJobs';
import EquipmentSection from '@/src/modules/core/components/home/EquipmentSection';
import CateringSection from '@/src/modules/core/components/home/CateringSection';
import JobsSection from '@/src/modules/core/components/home/JobsSection';
import AboutSection from '@/src/modules/core/components/home/AboutSection';
import { useHomepageData } from '@/src/modules/core/hooks/useHomepageData';
import { ORGANIZATION_SCHEMA, WEBSITE_SCHEMA } from '@/src/lib/seo/schemas';
import { apiClient } from '@/src/lib/apiClient';
import { JobCard } from '@/src/modules/jobs/components/JobCard';
import { BrainIllustration } from '@/src/components/BrainIllustration';
import shieldMaster from '@/src/assets/images/shield-master.png';

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

    apiClient.post<AiResponse>('/ai/ask', { query })
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
        title={isSearchActive ? `AI Pretraga: ${query} | Svet Građevine` : "Početna | Svet Građevine"}
        description="Oglasi u građevinskoj industriji"
        type="website"
        jsonLd={[WEBSITE_SCHEMA, ORGANIZATION_SCHEMA]}
      />
      
      <HeroSection isSearchActive={isSearchActive} isLoading={aiLoading} />

      {isSearchActive ? (
        <div className={`max-w-7xl mx-auto px-4 md:px-8 pb-24 relative z-30 min-h-[400px] flex flex-col items-center justify-start w-full transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          aiLoading ? 'mt-24 md:mt-36' : 'mt-8 md:mt-12'
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

              {/* Filter Chips */}
              <FilterChips 
                listings={aiData.listings || []} 
                activeFilters={activeFilters} 
                setActiveFilters={setActiveFilters} 
              />

              {/* Listings Output */}
              <div className="space-y-4">
                {filteredListings.length > 0 ? (
                  filteredListings.map((item, idx) => (
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
                        viewMode="list" 
                        prefetch={prefetchPlaceholder} 
                      />
                    </div>
                  ))
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
      ) : (
        <>
          <div className="scroll-fade-in">
            <CalculatorBanner />
          </div>

          <div className="scroll-fade-in">
            <UrgentJobs urgentJobs={urgentJobs} isLoading={isLoadingBff} />
          </div>

          <div className="scroll-fade-in">
            <PremiumJobs premiumJobs={premiumJobs} handleCardClick={handleCardClick} />
          </div>

          <div className="scroll-fade-in">
            <JobsSection latestJobs={latestJobs} />
          </div>

          <div className="scroll-fade-in">
            <EquipmentSection latestMachines={latestMachines} latestRealEstate={latestRealEstate} />
          </div>

          <div className="scroll-fade-in">
            <CateringSection latestAccommodations={latestAccommodations} latestCaterings={latestCaterings} />
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
    <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.01] backdrop-blur-3xl border-t border-white/20 border-x border-b border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] rounded-[24px] p-6 md:p-8 shadow-2xl relative overflow-hidden group">
      
      {/* Liquid Glass Background Ambient Orbs */}
      <div className="absolute -top-10 -left-10 w-[240px] h-[240px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none animate-fluid-orb-1"></div>
      <div className="absolute -bottom-10 -right-10 w-[260px] h-[260px] bg-sky-500/10 rounded-full blur-[90px] pointer-events-none animate-fluid-orb-2"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] bg-emerald-500/5 rounded-full blur-[75px] pointer-events-none animate-fluid-orb-3"></div>
      
      <div className="space-y-6 relative z-10">
        
        {/* Row 1: AI Header + AI Understanding Card */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: AI Header */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary text-xl">smart_toy</span>
              </div>
              <span className="text-[10px] font-headline font-black tracking-[0.4em] uppercase text-secondary">AI PRETRAGA ✨</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mb-1 font-headline">
              Pronađeno {data.count || listings.length} oglasa
            </h2>
            <p className="text-on-surface-variant text-sm mb-4 font-headline">za {query}</p>
            
            <div className="flex flex-wrap gap-2">
              <button onClick={handleCopy} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all font-headline">
                <span className="material-symbols-outlined text-sm">content_copy</span>
                Kopiraj sažetak
              </button>
              <button onClick={handleShare} className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all font-headline">
                <span className="material-symbols-outlined text-sm">share</span>
                Podeli
              </button>
            </div>
          </div>

          {/* Right: AI Understanding Card */}
          {intent && (
            <div className="w-full lg:w-80 bg-gradient-to-br from-[#0c1e3d]/80 to-[#071329]/60 backdrop-blur-3xl border border-white/10 rounded-[18px] p-5 relative overflow-hidden shrink-0 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
              <div className="absolute -top-6 -right-6 w-[140px] h-[140px] bg-secondary/10 rounded-full blur-[50px] pointer-events-none"></div>
              <BrainIllustration className="absolute -right-2 -top-2 w-32 h-32 opacity-25" />
              <h3 className="text-[10px] font-headline font-black tracking-[0.3em] uppercase text-secondary mb-2 relative z-10">AI RAZUMEVANJE UPITA</h3>
              <div className="flex items-baseline gap-2 mb-4 relative z-10">
                <span className="text-4xl font-black text-secondary font-headline drop-shadow-[0_2px_8px_rgba(254,191,13,0.3)]">{confidence}%</span>
                <span className="text-xs text-on-surface-variant">pouzdanost</span>
              </div>
              <div className="space-y-2 relative z-10">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-green-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-white/60 font-headline">Vertikala:</span>
                  <span className="text-white font-bold font-headline">{intent.vertikala}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-green-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-white/60 font-headline">Zanimanje:</span>
                  <span className="text-white font-bold font-headline">{intent.zanimanje}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-green-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-white/60 font-headline">Lokacija:</span>
                  <span className="text-white font-bold font-headline">{intent.lokacija}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-green-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="text-white/60 font-headline">Tip posla:</span>
                  <span className="text-white font-bold font-headline">{intent.tipPosla}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 2: AI Answer Container */}
        {structuredAnswer && (
          <div className="bg-white/[0.02] border border-white/5 rounded-[18px] py-8 md:py-10 px-6 md:px-8 min-h-[200px] shadow-[0_8px_30px_rgb(0,0,0,0.3)] relative overflow-hidden transition-all hover:bg-white/[0.03] hover:border-white/10">
            <div className="absolute -top-12 -right-12 w-[120px] h-[120px] bg-secondary/5 rounded-full blur-[40px] pointer-events-none"></div>
            <BrainIllustration className="absolute -right-8 -bottom-8 w-48 h-48 opacity-[0.07]" />
            
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-sm">smart_toy</span>
              </div>
              <h3 className="text-[11px] font-headline font-black uppercase tracking-widest text-secondary">AI ODGOVOR</h3>
            </div>
            
            <div className="relative z-10 space-y-4">
              <p className="text-slate-300 leading-relaxed font-body text-base md:text-lg"
                 dangerouslySetInnerHTML={{ __html: structuredAnswer.summary.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white tracking-wide">$1</strong>') }} 
              />
              
              {structuredAnswer.bullets.length > 0 && (
                <div className="space-y-3">
                  {structuredAnswer.bullets.map((bullet: { emoji: string; text: string }, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-lg shrink-0 mt-0.5">{bullet.emoji}</span>
                      <p className="text-slate-300 text-base leading-relaxed font-body"
                         dangerouslySetInnerHTML={{ __html: bullet.text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-secondary tracking-wide">$1</strong>') }} 
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {structuredAnswer.closing && (
                <p className="text-slate-400 text-sm mt-4 pt-4 border-t border-white/5 font-body leading-relaxed">
                  {structuredAnswer.closing}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Row 3: Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-5 space-y-2 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary/30 hover:shadow-[0_12px_40px_rgb(0,0,0,0.5)] group/card">
            <div className="flex items-center gap-2 text-on-surface-variant text-[11px] uppercase tracking-widest font-headline font-bold">
              <span className="material-symbols-outlined text-sm text-secondary transition-transform duration-300 group-hover/card:scale-110">person</span>
              <span>ZANIMANJE</span>
            </div>
            <p className="text-base md:text-lg font-black text-secondary truncate font-headline uppercase tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{intent?.zanimanje || stats.professions}</p>
            <p className="text-on-surface-variant text-xs font-headline">Glavna pretraga</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-5 space-y-2 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary/30 hover:shadow-[0_12px_40px_rgb(0,0,0,0.5)] group/card">
            <div className="flex items-center gap-2 text-on-surface-variant text-[11px] uppercase tracking-widest font-headline font-bold">
              <span className="material-symbols-outlined text-sm text-secondary transition-transform duration-300 group-hover/card:scale-110">location_on</span>
              <span>LOKACIJE</span>
            </div>
            <p className="text-base md:text-lg font-black text-secondary truncate font-headline uppercase tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{intent?.lokacija || stats.locations}</p>
            <p className="text-on-surface-variant text-xs font-headline">{listings.length} oglasa</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-5 space-y-2 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary/30 hover:shadow-[0_12px_40px_rgb(0,0,0,0.5)] group/card">
            <div className="flex items-center gap-2 text-on-surface-variant text-[11px] uppercase tracking-widest font-headline font-bold">
              <span className="material-symbols-outlined text-sm text-secondary transition-transform duration-300 group-hover/card:scale-110">payments</span>
              <span>SATNICE</span>
            </div>
            <p className="text-base md:text-lg font-black text-secondary truncate font-headline uppercase tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{stats.rates}</p>
            <p className="text-on-surface-variant text-xs font-headline">Prosečna satnica</p>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-[16px] p-5 space-y-2 shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary/30 hover:shadow-[0_12px_40px_rgb(0,0,0,0.5)] group/card">
            <div className="flex items-center gap-2 text-on-surface-variant text-[11px] uppercase tracking-widest font-headline font-bold">
              <span className="material-symbols-outlined text-sm text-secondary transition-transform duration-300 group-hover/card:scale-110">inventory_2</span>
              <span>UKUPNO OGLASA</span>
            </div>
            <p className="text-base md:text-lg font-black text-secondary truncate font-headline uppercase tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">{data.count || listings.length}</p>
            <p className="text-on-surface-variant text-xs font-headline">Aktivnih oglasa</p>
          </div>
        </div>

        <div className="text-[10px] text-on-surface-variant uppercase tracking-widest font-headline font-bold flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0 pt-4 mt-4 border-t border-white/[0.06] text-center md:text-left">
          <span className="block">Prikazano {listings.length} od {data.count || listings.length} oglasa</span>
          <span className="text-secondary font-black flex flex-col md:flex-row items-center gap-1 uppercase tracking-wider font-headline">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-xs animate-[bounce_1.5s_infinite] mr-1">arrow_downward</span>
              <span>Pogledaj</span>
            </span>
            <span>oglase ispod</span>
          </span>
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


