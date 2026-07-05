import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/src/lib/apiClient';
import { JobCard } from '@/src/modules/jobs/components/JobCard';
import { BrainIllustration } from '@/src/components/BrainIllustration';
import shieldMaster from '@/src/assets/images/shield-master.png';
import { AiSearchBar } from '@/src/components/AiSearchBar';

interface ListingItem {
  id: string;
  title: string;
  location: string;
  loc: string;
  salary: string;
  comp: string;
  company: string;
  companyName: string;
  companyId: string | null;
  isCompanyVerified: boolean;
  description: string;
  isPremium: boolean;
  isUrgent: boolean;
  createdAt: string;
  logo: string | null;
  logoPlaceholder: string | null;
  plataMin: number | null;
  plataMax: number | null;
  salaryType: string;
  benefits: string[];
  viewsCount: number;
}

interface StructuredAnswer {
  summary: string;
  bullets: Array<{ emoji: string; text: string }>;
  closing: string;
}

interface AiResponse {
  answer: string;
  parsedIntent: {
    vertikala: string;
    zanimanje: string;
    lokacija: string;
    tipPosla: string;
  };
  confidence: number;
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  listings?: ListingItem[];
}

const TABS = [
  { id: 'all', label: 'Svi rezultati', icon: 'apps' },
  { id: 'poslovi', label: 'Poslovi', icon: 'work' },
  { id: 'firme', label: 'Firme', icon: 'business' },
  { id: 'majstori', label: 'Majstori', icon: 'person' },
  { id: 'smestaj', label: 'Smeštaj', icon: 'hotel' },
  { id: 'masine', label: 'Mašine', icon: 'agriculture' },
  { id: 'alati', label: 'Alati', icon: 'construction' },
];

function applyBoldRules(text: string) {
  let parsed = text.replace(/\*\*(.*?)\*\*/g, (_, content) => {
    if (/\b(?:Srbij[iaue]|Slovenij[iaue]|Hrvatsk[oiaeu]|Nemačk[oiaeu]|Austrij[iaue]|Beograd[ua]?|Borč[iau]?|Zlatibor[ua]?|Negotin[au]?|Subotic[iau]?|Niš[ua]?|Hvar[ua]?|Split[ua]?|Zagreb[au]?|Kragujevac[au]?|Kruševac[au]?|Zrenjanin[au]?|Sremsk[aeiou]\s+Mitrovic[aeiou]?|Nov[iom]?\s+Sad[ua]?|Pančev[oau]?|Pancev[oau]?|Inostranstv[ou]|Inostranstva|Crn[aeiou]\s+Gor[aeiou]?|Bosn[aeiou]?|Makedonij[iaue]?|Rumunij[iaue]?|Mađarsk[aeiou]?|Madarsk[aeiou]?|Bugarsk[aeiou]?)\b/i.test(content)) {
      return `<strong class="font-bold text-white tracking-wide">${content}</strong>`;
    }
    if (/\d+[.,]?\d*\s*(?:€|eur|evra)/i.test(content)) {
      return `<strong class="font-bold text-secondary tracking-wide">${content}</strong>`;
    }
    if (/(smeštaj|smestaj|obrok|hrana|prevoz|viz|radn[a-z]* dozvol|dokumentacija|radn[a-z]* oprema|alat|oprema)/i.test(content)) {
      return `<strong class="font-bold text-white">${content}</strong>`;
    }
    if (/(satnica|plata)/i.test(content)) {
      return `<strong class="font-bold text-secondary">${content}</strong>`;
    }
    return `<strong class="font-bold text-white tracking-wide">${content}</strong>`;
  });
  parsed = parsed.replace(/\*/g, '');
  parsed = parsed.replace(/(\b(?:Srbij[iaue]|Slovenij[iaue]|Hrvatsk[oiaeu]|Nemačk[oiaeu]|Austrij[iaue]|Beograd[ua]?|Borč[iau]?|Zlatibor[ua]?|Negotin[au]?|Subotic[iau]?|Niš[ua]?|Hvar[ua]?|Split[ua]?|Zagreb[au]?|Kragujevac[au]?|Kruševac[au]?|Zrenjanin[au]?|Sremsk[aeiou]\s+Mitrovic[aeiou]?|Nov[iom]?\s+Sad[ua]?|Pančev[oau]?|Pancev[oau]?|Inostranstv[ou]|Inostranstva|Crn[aeiou]\s+Gor[aeiou]?|Bosn[aeiou]?|Makedonij[iaue]?|Rumunij[iaue]?|Mađarsk[aeiou]?|Madarsk[aeiou]?|Bugarsk[aeiou]?)\b)/gi, '<strong class="font-bold text-white tracking-wide">$1</strong>');
  parsed = parsed.replace(/(smeštaj[a-z]*|smestaj[a-z]*|obrok[a-z]*|hran[a-z]*|prevoz[a-z]*|viz[a-z]*|radn[a-z]* dozvol[a-z]*|dokumentacij[a-z]*|radn[a-z]* oprem[a-z]*|alata?|oprem[a-z]*)/gi, '<strong class="font-bold text-white">$1</strong>');
  parsed = parsed.replace(/(\b\d+\s*oglas[aeiou]\b)/gi, '<strong class="font-bold text-white">$1</strong>');
  parsed = parsed.replace(/(\b\d+[.,]\d+\s*[-–]\s*\d+[.,]\d+\s*(?:€|eur|evra)?\b)/gi, '<strong class="font-bold text-secondary tracking-wide">$1</strong>');
  parsed = parsed.replace(/(\b\d+\s*[-–]\s*\d+\s*(?:€|eur|evra)\b)/gi, '<strong class="font-bold text-secondary tracking-wide">$1</strong>');
  parsed = parsed.replace(/(\b\d+[.,]?\d*\s*(?:€|eur|evra)\b)/gi, '<strong class="font-bold text-secondary tracking-wide">$1</strong>');
  parsed = parsed.replace(/za posao (\w+)/gi, 'za posao <strong class="font-bold text-white uppercase tracking-wide">$1</strong>');
  parsed = parsed.replace(/ZA '(\w+)' PO LOKACIJAMA/gi, "ZA '<strong class=\"font-bold text-white uppercase tracking-wide\">$1</strong>' PO LOKACIJAMA");
  return parsed;
}

const getBulletIcon = (_emoji: string) => null;

export default function AiSearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [data, setData] = useState<AiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const pageSize = 10;

  // Filter states
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 30]);
  const [filterSmestaj, setFilterSmestaj] = useState<string>('all');
  const [filterPrevoz, setFilterPrevoz] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async (p: number) => {
    if (!query) { setLoading(false); return; }
    setLoading(true);
    apiClient.post<AiResponse>('/ai/ask', { query, page: p, pageSize })
      .then(res => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    fetchData(1);
    setPage(1);
  }, [query, fetchData]);

  const goToPage = (p: number) => {
    if (p < 1 || (data && p > data.totalPages)) return;
    setPage(p);
    fetchData(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopySummary = () => {
    if (!data?.answer) return;
    try {
      const parsed = JSON.parse(data.answer) as StructuredAnswer;
      const text = `${parsed.summary}\n\n${parsed.bullets.map(b => `${b.emoji} ${b.text}`).join('\n')}\n\n${parsed.closing}`;
      navigator.clipboard.writeText(text);
    } catch {
      navigator.clipboard.writeText(data.answer);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  };

  const handleNewSearch = () => {
    navigate('/');
  };

  // Parse structured answer
  const structuredAnswer = useMemo(() => {
    if (!data?.answer) return null;
    try {
      return JSON.parse(data.answer) as StructuredAnswer;
    } catch {
      return { summary: data.answer, bullets: [], closing: '' };
    }
  }, [data?.answer]);

  // Compute filter data from listings
  const filterData = useMemo(() => {
    if (!data?.listings) return { locations: [], salaryMin: 0, salaryMax: 30 };
    const locCounts: Record<string, number> = {};
    let minSalary = Infinity;
    let maxSalary = 0;
    
    data.listings.forEach(l => {
      const loc = l.loc || l.location || 'Srbija';
      const friendlyLoc = loc.charAt(0).toUpperCase() + loc.slice(1).replace(/-/g, ' ');
      locCounts[friendlyLoc] = (locCounts[friendlyLoc] || 0) + 1;
      if (l.plataMin != null) minSalary = Math.min(minSalary, l.plataMin);
      if (l.plataMax != null) maxSalary = Math.max(maxSalary, l.plataMax);
    });
    
    return {
      locations: Object.entries(locCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      salaryMin: minSalary === Infinity ? 0 : minSalary,
      salaryMax: maxSalary || 30,
    };
  }, [data?.listings]);

  // Filter listings
  const filteredListings = useMemo(() => {
    if (!data?.listings) return [];
    let result = [...data.listings];
    
    if (selectedLocations.length > 0) {
      result = result.filter(l => {
        const loc = l.loc || l.location || 'Srbija';
        const friendlyLoc = loc.charAt(0).toUpperCase() + loc.slice(1).replace(/-/g, ' ');
        return selectedLocations.includes(friendlyLoc);
      });
    }
    
    if (salaryRange[0] > 0 || salaryRange[1] < 30) {
      result = result.filter(l => {
        if (l.plataMin == null) return true;
        return l.plataMin >= salaryRange[0] && (l.plataMax || l.plataMin) <= salaryRange[1];
      });
    }
    
    if (filterSmestaj !== 'all') {
      result = result.filter(l => {
        const has = l.benefits?.includes('smestaj');
        return filterSmestaj === 'yes' ? has : !has;
      });
    }
    
    if (filterPrevoz !== 'all') {
      result = result.filter(l => {
        const has = l.benefits?.includes('prevoz');
        return filterPrevoz === 'yes' ? has : !has;
      });
    }
    
    return result;
  }, [data?.listings, selectedLocations, salaryRange, filterSmestaj, filterPrevoz]);

  const toggleLocation = (loc: string) => {
    setSelectedLocations(prev => 
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const resetFilters = () => {
    setSelectedLocations([]);
    setSalaryRange([0, 30]);
    setFilterSmestaj('all');
    setFilterPrevoz('all');
  };

  const prefetch = useCallback(() => {}, []);

  return (
    <div className="max-w-7xl mx-auto px-4 pt-28 md:pt-36 pb-16">
      {loading && (
        <div className="w-full transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)] mt-6 md:mt-10">
          <div className="bg-gradient-to-br from-[#0c1e3d]/95 to-[#071329]/85 backdrop-blur-3xl border border-white/10 rounded-[28px] py-14 px-6 md:px-12 text-center space-y-7 shadow-[0_15px_50px_rgba(0,0,0,0.85)] relative overflow-hidden flex flex-col items-center justify-center min-h-[390px] w-full animate-fade-in">
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
        </div>
      )}

      {!loading && data && (
        <>
          {/* AI Search input field at the top of results */}
          <div className="w-full max-w-3xl mx-auto mb-10">
            <AiSearchBar isLoading={loading} />
          </div>

          {/* Ujedinjeni AI Kontejner sa Mockup-a */}
          <div className="bg-[#0c1520]/80 border border-white/10 rounded-[28px] p-6 md:p-8 mb-8 shadow-xl shadow-black/40">
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
                    onClick={handleCopySummary}
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
                  <button
                    onClick={handleNewSearch}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all shadow-md w-full sm:w-auto"
                  >
                    <span className="material-symbols-outlined text-sm">search</span>
                    Nova pretraga
                  </button>
                </div>
              </div>

              {/* Desno: AI Understanding Card (Raširen pomoću lg:col-span-5) */}
              {data.parsedIntent && (
                <div className="lg:col-span-5 bg-[#121c27]/45 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-inner min-h-[190px]">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary">AI RAZUMEVANJE UPITA</h3>
                      <span className="material-symbols-outlined text-white/20 hover:text-white text-base cursor-pointer">close</span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-baseline gap-0 md:gap-2 mb-4">
                      <span className="text-6xl font-extrabold text-teal-400 leading-none">{data.confidence}%</span>
                      <span className="text-sm md:text-base text-white/60 font-bold">pouzdanost</span>
                    </div>
                  </div>
                  {/* Kvačice zamenjene sa teal check ikonama kao na mockup-u */}
                  <div className="space-y-3 relative z-10 text-white/95 text-base">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-white/60 mr-1.5">Vertikala:</span>
                        <span className="text-white font-semibold break-words">{data.parsedIntent.vertikala}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-white/60 mr-1.5">Zanimanje:</span>
                        <span className="text-white font-semibold break-words">{data.parsedIntent.zanimanje}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-white/60 mr-1.5">Lokacija:</span>
                        <span className="text-white font-semibold break-words">{data.parsedIntent.lokacija}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-teal-400 text-xl font-bold shrink-0 mt-0.5">check</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-white/60 mr-1.5">Tip posla:</span>
                        <span className="text-white font-semibold break-words">{data.parsedIntent.tipPosla}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Horizontalni Divider - smanjene margine i podignut gore, skraćen da ide samo do ivice boksa sa mozgom */}
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
                          {/* Zamena emojija sa prelepim okruglim Material ikonama */}
                          {getBulletIcon(bullet.emoji)}
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
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs md:text-sm font-bold shadow-md">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      AI pouzdanost: {data.confidence}%
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg text-xs md:text-sm font-bold shadow-md">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
                      Vreme pretrage: 2.4s
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs md:text-sm font-bold shadow-md">
                      Izvori podataka: {filteredListings.length + 7}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-8">
            {/* ZANIMANJE */}
            <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>work</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] md:text-[11px] font-black tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">ZANIMANJE</span>
                <p className="text-white font-bold text-base md:text-lg font-headline truncate">{data.parsedIntent?.zanimanje || query || '-'}</p>
                <p className="text-white/40 text-xs md:text-xs font-headline">Glavna pretraga</p>
              </div>
            </div>

            {/* LOKACIJE */}
            <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] md:text-[11px] font-black tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">LOKACIJE</span>
                <p className="text-white font-bold text-base md:text-lg font-headline truncate">{data.parsedIntent?.lokacija || 'Sve lokacije'}</p>
                <p className="text-white/40 text-xs md:text-xs font-headline">{filterData.locations.length} lokacija</p>
              </div>
            </div>

            {/* SATNICE */}
            <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] md:text-[11px] font-black tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">SATNICE</span>
                <p className="text-white font-bold text-base md:text-lg font-headline truncate">{filterData.salaryMin} – {filterData.salaryMax} €/h</p>
                <p className="text-white/40 text-xs md:text-xs font-headline">Prosečna satnica</p>
              </div>
            </div>

            {/* UKUPNO OGLASA */}
            <div className="bg-gradient-to-b from-[#101a26]/95 to-[#0b131e]/95 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-2 md:gap-4 hover:border-secondary/40 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.65)] min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <span className="material-symbols-outlined text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[11px] md:text-[11px] font-black tracking-[0.2em] uppercase text-white/40 block mb-0.5 font-headline">UKUPNO OGLASA</span>
                <p className="text-white font-bold text-base md:text-lg font-headline truncate">{data.count}</p>
                <p className="text-white/40 text-xs md:text-xs font-headline">Aktivnih oglasa</p>
              </div>
            </div>
          </div>

          {/* Info Text */}
          <div className="bg-white/[0.02] border border-white/5 rounded-lg md:rounded-xl p-4 mb-8 flex items-start gap-3">
            <span className="hidden md:inline material-symbols-outlined text-secondary text-lg shrink-0 mt-0.5">info</span>
            <p className="text-white/60 text-base leading-relaxed">
              Najviše oglasa u <strong className="text-white">{data.parsedIntent?.lokacija || 'svim lokacijama'}</strong>. 
              Prosečna satnica varira od <strong className="text-white">{filterData.salaryMin} do {filterData.salaryMax} €/h</strong> u zavisnosti od lokacije, iskustva i vrste posla.
            </p>
          </div>

          {/* Tabs - samo desktop */}
          <div className="hidden md:flex flex-wrap gap-2 mb-6 pb-4 border-b border-white/5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-secondary !text-black shadow-lg shadow-secondary/20'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
                {tab.id === 'all' && <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded-full text-[10px]">{data.count}</span>}
                {tab.id === 'poslovi' && <span className="ml-1 px-1.5 py-0.5 bg-white/10 rounded-full text-[10px]">{data.count}</span>}
              </button>
            ))}
          </div>

          {/* Main Content: Results + Filters */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Results */}
            <div className="flex-1 min-w-0">
              <div id="ads-anchor" className="hidden md:flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-white">
                  Oglasi za {(data.parsedIntent?.zanimanje || query || '-').toLowerCase()} ({filteredListings.length})
                </h2>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-8 text-xs font-bold text-white/70 cursor-pointer hover:bg-white/10 transition-all"
                  >
                    <option value="newest">Najnoviji prvo</option>
                    <option value="salary_high">Najveća satnica</option>
                    <option value="salary_low">Najniža satnica</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-white/40 text-sm pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Mobile Filter Toggle - hidden */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="hidden"
              >
                <span className="material-symbols-outlined text-sm">filter_list</span>
                Brzi filteri
                {(selectedLocations.length > 0 || filterSmestaj !== 'all' || filterPrevoz !== 'all') && (
                  <span className="w-2 h-2 bg-secondary rounded-full" />
                )}
              </button>

              {/* Job Cards */}
              <div className="space-y-3">
                {filteredListings.map((item) => (
                  <JobCard key={item.id} job={item} viewMode="list" prefetch={prefetch} />
                ))}
              </div>

              {filteredListings.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white/60 text-sm">Nema rezultata za izabrane filtere.</p>
                  <button onClick={resetFilters} className="mt-2 text-secondary text-xs font-bold hover:underline">
                    Poništi filtere
                  </button>
                </div>
              )}

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold"
                  >
                    Prethodna
                  </button>
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === data.totalPages || Math.abs(p - page) <= 2)
                    .map((p, idx, arr) => (
                      <span key={p} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="text-white/30 px-1">...</span>
                        )}
                        <button
                          onClick={() => goToPage(p)}
                          className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                            p === page
                              ? 'bg-secondary !text-black shadow-lg shadow-secondary/20'
                              : 'bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    ))}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= data.totalPages}
                    className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-bold"
                  >
                    Sledeća
                  </button>
                </div>
              )}
            </div>

            {/* Filter Sidebar - Desktop */}
            <div className={`w-full lg:w-72 shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-slate-950 border border-white/[0.08] rounded-[10px] p-5 sticky top-24 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-black text-white/50 uppercase tracking-[0.2em]">Brzi filteri</h3>
                  <button onClick={resetFilters} className="text-[10px] font-bold text-white/40 hover:text-white flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">refresh</span>
                    PONIŠTI SVE
                  </button>
                </div>

                {/* Lokacija */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-[0.15em] mb-4">Lokacija</h4>
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {filterData.locations.map(loc => (
                      <label key={loc.name} className="flex items-center gap-4 cursor-pointer group h-10">
                        <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedLocations.includes(loc.name)}
                            onChange={() => toggleLocation(loc.name)}
                            className="peer appearance-none w-full h-full border border-white/10 group-hover:border-white/40 group-hover:bg-white/5 rounded bg-slate-800/80 checked:bg-secondary checked:border-secondary checked:shadow-[0_0_15px_rgba(250,204,21,0.3)] focus:border-secondary/80 focus:shadow-[0_0_15px_rgba(254,191,13,0.15)] transition-all cursor-pointer"
                          />
                          <span className="absolute material-symbols-outlined text-xs text-slate-950 opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 pointer-events-none transition-all duration-300 font-black">check</span>
                        </div>
                        <span className={`text-base font-bold transition-colors duration-300 ${selectedLocations.includes(loc.name) ? 'text-white font-bold' : 'text-white/50 group-hover:text-white/90'}`}>
                          {loc.name} <span className="text-white/30 font-normal">({loc.count})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Satnica */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-[0.15em] mb-4">Satnica (€/h)</h4>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] text-white/40 font-bold uppercase">Raspon</span>
                    <span className="text-xs text-secondary font-black">{salaryRange[0]}€ — {salaryRange[1]}€</span>
                  </div>
                  <div className="px-1">
                    <input
                      type="range"
                      min={filterData.salaryMin}
                      max={filterData.salaryMax}
                      value={salaryRange[1]}
                      onChange={(e) => setSalaryRange([salaryRange[0], Number(e.target.value)])}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                    />
                    <div className="flex justify-between mt-1 px-1">
                      <span className="text-[10px] text-white/40">{filterData.salaryMin} €</span>
                      <span className="text-[10px] text-white/40">{salaryRange[1]} €</span>
                    </div>
                  </div>
                </div>

                {/* Smeštaj */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-[0.15em] mb-4">Smeštaj</h4>
                  <div className="space-y-3">
                    {[
                      { value: 'all', label: 'Sve' },
                      { value: 'yes', label: 'Obezeđen smeštaj' },
                      { value: 'no', label: 'Nije obezbeđen' },
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-4 cursor-pointer group h-10">
                        <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                          <input
                            type="radio"
                            name="smestaj"
                            checked={filterSmestaj === opt.value}
                            onChange={() => setFilterSmestaj(opt.value)}
                            className="peer appearance-none w-full h-full border border-white/10 group-hover:border-white/40 group-hover:bg-white/5 rounded-full bg-slate-800/80 checked:bg-secondary checked:border-secondary checked:shadow-[0_0_15px_rgba(250,204,21,0.3)] focus:border-secondary/80 focus:shadow-[0_0_15px_rgba(254,191,13,0.15)] transition-all cursor-pointer"
                          />
                          <div className="absolute w-2.5 h-2.5 bg-slate-950 rounded-full opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 pointer-events-none transition-all duration-300"></div>
                        </div>
                        <span className={`text-base font-bold transition-colors duration-300 ${filterSmestaj === opt.value ? 'text-white' : 'text-white/50 group-hover:text-white/90'}`}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Prevoz */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-white/50 uppercase tracking-[0.15em] mb-4">Prevoz</h4>
                  <div className="space-y-3">
                    {[
                      { value: 'all', label: 'Sve' },
                      { value: 'yes', label: 'Obezeđen prevoz' },
                      { value: 'no', label: 'Nije obezbeđen' },
                    ].map(opt => (
                      <label key={opt.value} className="flex items-center gap-4 cursor-pointer group h-10">
                        <div className="relative flex items-center justify-center w-6 h-6 shrink-0">
                          <input
                            type="radio"
                            name="prevoz"
                            checked={filterPrevoz === opt.value}
                            onChange={() => setFilterPrevoz(opt.value)}
                            className="peer appearance-none w-full h-full border border-white/10 group-hover:border-white/40 group-hover:bg-white/5 rounded-full bg-slate-800/80 checked:bg-secondary checked:border-secondary checked:shadow-[0_0_15px_rgba(250,204,21,0.3)] focus:border-secondary/80 focus:shadow-[0_0_15px_rgba(254,191,13,0.15)] transition-all cursor-pointer"
                          />
                          <div className="absolute w-2.5 h-2.5 bg-slate-950 rounded-full opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 pointer-events-none transition-all duration-300"></div>
                        </div>
                        <span className={`text-base font-bold transition-colors duration-300 ${filterPrevoz === opt.value ? 'text-white' : 'text-white/50 group-hover:text-white/90'}`}>
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowFilters(false);
                    const el = document.getElementById('ads-anchor');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full py-4 bg-secondary !text-black font-black rounded-[10px] uppercase tracking-widest text-sm hover:bg-yellow-500 transition-all shadow-lg shadow-secondary/15 active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="font-headline">PRIKAŽI {filteredListings.length} REZULTATA</span>
                </button>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 bg-gradient-to-r from-secondary/10 via-secondary/5 to-transparent border border-secondary/20 rounded-2xl p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 min-w-0 w-full">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 min-w-0 flex-1 w-full">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-secondary/20 rounded-full flex items-center justify-center shrink-0 mt-0.5 md:mt-0">
                <span className="material-symbols-outlined text-secondary text-lg md:text-xl">rocket_launch</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-white font-black text-sm md:text-lg leading-tight">Niste pronašli ono što tražite?</h3>
                <p className="text-white/50 text-xs md:text-sm leading-tight mt-1 md:mt-0">Promenite kriterijume pretrage i budite što detaljniji u opisu.</p>
              </div>
            </div>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => {
                  const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (inputEl) inputEl.focus();
                }, 500);
              }}
              className="shrink-0 inline-flex items-center justify-center gap-2 bg-secondary text-black font-black px-6 py-3 rounded-xl hover:bg-yellow-500 transition-all text-xs uppercase tracking-widest w-full md:w-auto"
            >
              PRETRAŽI PONOVO
              <span className="material-symbols-outlined text-sm">arrow_upward</span>
            </button>
          </div>

          {/* Trust Signals */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { icon: 'verified', title: 'Provereni poslodavci', desc: 'Svi poslodavci su verifikovani' },
              { icon: 'paid', title: 'Sigurna isplata', desc: 'Redovna i sigurna isplata zarade' },
              { icon: 'support_agent', title: 'Podrška 24/7', desc: 'Uvek tu za sva vaša pitanja' },
              { icon: 'speed', title: 'Brza pretraga', desc: 'AI pretraga štedi vaše vreme' },
            ].map((item, i) => (
              <div key={i} className="text-center p-4 md:p-6 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-secondary text-5xl md:text-7xl mb-3 md:mb-4 shrink-0">{item.icon}</span>
                <h4 className="text-white font-bold text-base md:text-xl mb-1.5 md:mb-2">{item.title}</h4>
                <p className="text-white/40 text-xs md:text-base text-center">{item.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="text-center py-16">
          <p className="text-white text-lg mb-2">Trenutno nema oglasa koji potpuno odgovaraju vašoj pretrazi.</p>
          <p className="text-on-surface-variant">Ispod su najnoviji aktivni oglasi koji bi vas mogli zanimati.</p>
        </div>
      )}
    </div>
  );
}
