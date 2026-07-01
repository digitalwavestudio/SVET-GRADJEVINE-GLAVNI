import { OptimizedImage } from '@/src/components/OptimizedImage';
import { VerticalCTA } from '@/src/components/VerticalCTA';
import { HardHat } from 'lucide-react';
import { VirtuosoGrid } from 'react-virtuoso';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { generateProfessionalServiceListSchema } from '@/src/lib/seoSchema';
import DynamicSEO from '@/src/components/DynamicSEO';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import LoadingState from '@/src/components/LoadingState';
import NoResults from '@/src/components/ui/NoResults';
import SeoContentBlock from '@/src/components/SeoContentBlock';
import { APP_CONFIG } from '@/src/constants/config';
import { FilterSidebar, FilterClearButton, FilterSection, FilterSelect, FilterCTA, MarketStatsWidget, SortingBar } from '@/src/modules/core/components/filters/FilterComponents';
import { LocationCombobox } from '@/src/components/LocationCombobox';
import { Button } from '@/src/components/ui/Button';
import { LOCATIONS, PROFESSIONS, SECTORS } from '@/src/constants/taxonomy';
import { useAuth } from '@/src/context/AuthContext';
import { useMastersList } from '@/src/modules/masters/hooks/useMasters';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useCollectionStats, useRoleStats, useFilteredCount } from '@/src/hooks/useCollectionStats';
import { resolveRouteFilters } from '@/src/lib/routeFilters';
import { StandardPageHero } from '@/src/components/StandardPageHero';
import { AiSearchBar } from '@/src/components/AiSearchBar';
import { CrossVerticalHub } from '@/src/components/CrossVerticalHub';

export default function MastersPage() {
  const { user } = useAuth();
  
  // Memoize filters for stats hooks to prevent redundant queries
  const onlineFilter = useMemo(() => [
    { field: 'role', op: '==', value: 'master' }, 
    { field: 'isOnline', op: '==', value: true }
  ], []);
  
  const verifiedFilter = useMemo(() => [
    { field: 'role', op: '==', value: 'master' }, 
    { field: 'verified', op: '==', value: true }
  ], []);

  const { data: masterCount } = useRoleStats('master');
  const { data: onlineCount } = useFilteredCount('users', onlineFilter);
  const { data: recommendationCount } = useFilteredCount('users', verifiedFilter);

  const params = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Resolve routing ambiguity using central utility
  const resolved = resolveRouteFilters('majstori', params);
  const { locationSlug: gradSlug, professionSlug: zanimanjeSlug } = resolved;

  const [localSearchTerm, setLocalSearchTerm] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(localSearchTerm, 400);

  const [localSector, setLocalSector] = useState('SVE');
  const [localSelectedProfession, setLocalSelectedProfession] = useState(zanimanjeSlug || 'SVE');
  const [localLocation, setLocalLocation] = useState(gradSlug || 'SVE');
  const [filterRadius, setFilterRadius] = useState(searchParams.get('radius') || '50');
  const [sortBy, setSortBy] = useState<'experience' | 'name'>('experience');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verified') === 'true');

  const debouncedRadius = useDebounce(filterRadius, 500);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const searchParamsStr = searchParams.toString();
  
  const isNavigatingRef = useRef(false);

  // URL State as Single Source of Truth
  const activeFilters = useMemo(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    return {
      profession: zanimanjeSlug || undefined,
      location: gradSlug || undefined,
      radius: currentParams.get('radius') ? Number(currentParams.get('radius')) : undefined,
      search: currentParams.get('q') || undefined,
      isVerified: currentParams.get('verified') === 'true' || undefined
    };
  }, [gradSlug, zanimanjeSlug, searchParamsStr]);

  const { data, isLoading: loading, fetchNextPage: loadMore, hasNextPage } = useMastersList(activeFilters);
  const { data: premiumData } = useMastersList({ ...activeFilters, isPremiumProfile: true }, { enabled: true } as any);
  const isDeepPagingLimitReached = Boolean(hasNextPage && data?.pages && data.pages.length >= 11);
  const hasMore = hasNextPage && !isDeepPagingLimitReached;
  const masters = useMemo(() => {
    const regular = data?.pages.flatMap(page => page?.docs || []) || [];
    const premium = premiumData?.pages.flatMap(page => page?.docs || []) || [];
    const seen = new Set<string | undefined>();
    return [...premium, ...regular].filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [data, premiumData]);

  const handleApplyFilters = useCallback(() => {
    const desiredProf = localSelectedProfession === 'SVE' ? null : localSelectedProfession;
    const desiredLoc = localLocation === 'SVE' ? null : localLocation;
    
    const newParams = new URLSearchParams(searchParamsStr);
    if (localSearchTerm.trim()) {
      newParams.set('q', localSearchTerm.trim());
    } else {
      newParams.delete('q');
    }
    if (filterRadius && filterRadius !== '50') newParams.set('radius', filterRadius);
    else newParams.delete('radius');

    if (verifiedOnly) newParams.set('verified', 'true');
    else newParams.delete('verified');

    let newPath = '/majstori';
    if (desiredProf && desiredLoc) newPath = `/majstori/${desiredProf}/${desiredLoc}`;
    else if (desiredProf) newPath = `/majstori/${desiredProf}`;
    else if (desiredLoc) newPath = `/majstori/${desiredLoc}`;

    const currentPath = location.pathname;
    const currentParams = searchParamsStr;
    const targetParams = newParams.toString();

    // STRICT NAVIGATION GUARD
    if (currentPath !== newPath || currentParams !== targetParams) {
      isNavigatingRef.current = true;
      if (currentPath !== newPath) {
        navigate(`${newPath}?${targetParams}`, { preventScrollReset: true });
      } else {
        setSearchParams(newParams, { preventScrollReset: true });
      }
      // Reset guard after short delay to allow URL to settle
      setTimeout(() => { isNavigatingRef.current = false; }, 100);
    }
  }, [searchParamsStr, localSearchTerm, filterRadius, verifiedOnly, localSelectedProfession, localLocation, location.pathname, navigate, setSearchParams]);

  // Auto apply filters - strictly guarded to prevent loops
  useEffect(() => {
    if (isNavigatingRef.current) return;

    const currentParams = new URLSearchParams(searchParamsStr);
    const currentQ = currentParams.get('q') || '';
    const currentProf = zanimanjeSlug || 'SVE';
    const currentLoc = gradSlug || 'SVE';
    const currentRadius = currentParams.get('radius') || '50';
    const currentVerified = currentParams.get('verified') === 'true';

    if (debouncedSearch !== currentQ || localSelectedProfession !== currentProf || localLocation !== currentLoc || debouncedRadius !== currentRadius || verifiedOnly !== currentVerified) {
      handleApplyFilters();
    }
  }, [debouncedSearch, localSelectedProfession, localLocation, debouncedRadius, verifiedOnly, handleApplyFilters, searchParamsStr, zanimanjeSlug, gradSlug]);

  // Sync state with URL when searchParams/slugs change (handling back/forward)
  useEffect(() => {
    if (isNavigatingRef.current) return;

    const currentParams = new URLSearchParams(searchParamsStr);
    const q = currentParams.get('q') || '';
    const urlProf = zanimanjeSlug || 'SVE';
    const urlLoc = gradSlug || 'SVE';
    const rad = currentParams.get('radius') || '50';
    const ver = currentParams.get('verified') === 'true';

    if (q !== localSearchTerm) setLocalSearchTerm(q);
    if (urlProf !== localSelectedProfession) setLocalSelectedProfession(urlProf);
    if (urlLoc !== localLocation) setLocalLocation(urlLoc);
    if (rad !== filterRadius) setFilterRadius(rad);
    if (ver !== verifiedOnly) setVerifiedOnly(ver);

    // Sector detection logic
    if (zanimanjeSlug) {
      let foundSector = 'SVE';
      for (const [sector, profs] of Object.entries(PROFESSIONS)) {
        if (profs.some(p => p.slug === zanimanjeSlug)) {
          foundSector = sector;
          break;
        }
      }
      setLocalSector(foundSector);
    }
  }, [searchParamsStr, zanimanjeSlug, gradSlug]);

  const handleResetFilters = () => {
    setLocalSearchTerm('');
    setLocalSector('SVE');
    setLocalSelectedProfession('SVE');
    setLocalLocation('SVE');
    setFilterRadius('50');
    setVerifiedOnly(false);
    navigate('/majstori');
  };

  const availableProfessions = localSector && localSector !== 'SVE' ? PROFESSIONS[localSector as keyof typeof PROFESSIONS] || [] : [];
  const locName = gradSlug ? LOCATIONS.find(l => l.slug === gradSlug)?.name : '';
  const profName = zanimanjeSlug ? [...Object.values(PROFESSIONS)].flat().find(p => p.slug === zanimanjeSlug)?.name : '';

  const itemListSchema = useMemo(() => generateProfessionalServiceListSchema(
    masters.slice(0, 20).map((m: any) => ({
      name: m.name || m.title,
      url: `${APP_CONFIG.BASE_URL}/majstori/profil/${m.id}`,
      description: m.description,
      image: m.avatar || m.photo || m.images?.[0]
    })),
    {
      name: `Majstori i Građevinske Ekipe ${profName ? `- ${profName}` : ''} ${locName ? `u mestu ${locName}` : ''}`,
      description: `Baza majstora i ekipa za građevinske radove ${locName ? `iz mesta ${locName}` : 'širom Srbije'}.`,
      url: `${APP_CONFIG.BASE_URL}/majstori${zanimanjeSlug ? `/${zanimanjeSlug}` : ''}${gradSlug ? `/${gradSlug}` : ''}`,
    }
  ), [masters, locName, profName, gradSlug, zanimanjeSlug]);

  const breadcrumbItems = useMemo(() => {
    const items: { label: string; path?: string }[] = [];
    const hasZanimanje = zanimanjeSlug && zanimanjeSlug !== 'SVE';
    const hasGrad = gradSlug && gradSlug !== 'all';
    if (hasZanimanje || hasGrad) {
      items.push({ label: 'Majstori', path: '/majstori' });
    }
    if (hasZanimanje) {
      items.push({ label: profName || zanimanjeSlug!, path: hasGrad ? `/majstori/${zanimanjeSlug}` : undefined });
    }
    if (hasGrad) {
      items.push({ label: locName || gradSlug! });
    }
    if (items.length === 0) {
      items.push({ label: 'Majstori' });
    }
    return items;
  }, [zanimanjeSlug, gradSlug, profName, locName]);

  return (
    <div className="bg-surface min-h-screen text-on-surface font-sans selection:bg-secondary selection:text-on-secondary">
      <DynamicSEO
        type="majstori"
        grad={gradSlug ?? undefined}
        zanimanje={zanimanjeSlug ?? undefined}
        jsonLd={[itemListSchema]}
      />

      <Breadcrumbs items={breadcrumbItems} />

      <StandardPageHero
        badge="GRAĐEVINSKA INDUSTRIJA — SRBIJA & REGION"
        title="PRONAĐI"
        titleAccent="MAJSTORA."
        subtitle="Pretražite bazu od preko 2.800 verifikovanih profesionalaca i angažujte najbolje za vaš projekat."
        stats={[
          { label: "VERIFIKOVANI", value: masterCount?.toLocaleString() || "2.8K+", icon: "verified" },
          { label: "NA MREŽI", value: onlineCount?.toLocaleString() || "140", icon: "sensors" },
          { label: "PREPORUKE", value: recommendationCount?.toLocaleString() || "12k", icon: "recommend" }
        ]}
      >
        <div className="mt-8 flex flex-col gap-4 max-w-4xl w-full">
          <AiSearchBar vertical="masters" />
        </div>
      </StandardPageHero>

      <main className="max-w-7xl mx-auto px-4 md:px-8 relative z-20 py-12">
        <div className="flex flex-col-reverse lg:flex-row-reverse gap-12 mb-16">
        {/* Sidebar Filters */}
        <FilterSidebar>
          <MarketStatsWidget 
            stats={{ 
              total: masterCount || 0, 
              trend: "14", 
              category: "MAJSTORA" 
            }} 
          />
          {/* Lokacija - Prva na vrhu */}
          <FilterSection title="LOKACIJA">
            <div className="space-y-4">
              <LocationCombobox 
                selectedLocation={localLocation !== 'SVE' ? localLocation : null}
                onChange={(slug) => setLocalLocation(slug || 'SVE')}
              />
              
              {localLocation !== 'SVE' && (
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-white/60">Radijus pretrage:</label>
                    <span className="text-xs font-bold text-secondary">+{filterRadius} km</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5"
                    value={filterRadius}
                    onChange={(e) => setFilterRadius(e.target.value)}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                  <div className="flex justify-between mt-1 px-1">
                    <span className="text-[10px] text-white/40">Samo grad</span>
                    <span className="text-[10px] text-white/40">+100 km</span>
                  </div>
                </div>
              )}
            </div>
          </FilterSection>

          {/* Clear All Button */}
          {(localLocation !== 'SVE' || localSector !== 'SVE' || localSelectedProfession !== 'SVE' || filterRadius !== '50' || verifiedOnly) && (
            <FilterClearButton 
              onClick={() => {
                setLocalLocation('SVE');
                setFilterRadius('50');
                setLocalSector('SVE');
                setLocalSelectedProfession('SVE');
                setVerifiedOnly(false);
              }}
            />
          )}

          <FilterSection title="POVERENJE & BEZBEDNOST">
            <label className="flex items-center gap-3 cursor-pointer group bg-green-500/5 hover:bg-green-500/10 border border-green-500/20 p-4 rounded-[10px] transition-colors">
              <input 
                type="checkbox"
                className="w-5 h-5 rounded-[4px] border-green-500/40 bg-transparent text-green-500 focus:ring-green-500/20 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-green-400 uppercase tracking-widest leading-none mb-1 shadow-[0_0_10px_rgba(34,197,94,0.3)] flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]"></span>
                  SAMO VERIFIKOVANI IZVOĐAČI
                </span>
                <span className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Trgovina sa 100% garancijom</span>
              </div>
            </label>
          </FilterSection>

          <FilterSection title="SEKTOR & ZANIMANJE">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">SEKTOR</label>
                <FilterSelect
                  value={localSector}
                  onChange={(e) => {
                    setLocalSector(e.target.value);
                    setLocalSelectedProfession('SVE');
                  }}
                >
                  <option value="SVE" className="bg-[#111a22]">Svi sektori</option>
                  {SECTORS.map(s => (
                    <option key={s.slug} value={s.slug} className="bg-[#111a22]">{s.name}</option>
                  ))}
                </FilterSelect>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">ZANIMANJE</label>
                <FilterSelect
                  value={localSelectedProfession}
                  onChange={(e) => setLocalSelectedProfession(e.target.value)}
                  disabled={localSector === 'SVE'}
                >
                  <option value="SVE" className="bg-[#111a22]">{localSector === 'SVE' ? 'Prvo izaberite sektor' : 'Sva zanimanja'}</option>
                  {availableProfessions.map(p => (
                    <option key={p.slug} value={p.slug} className="bg-[#111a22]">{p.name}</option>
                  ))}
                </FilterSelect>
              </div>
            </div>
          </FilterSection>

            


          
          <FilterCTA 
            title="REGISTRUJTE SE KAO MAJSTOR"
            description="KREIRAJTE SVOJ MAJSTORSKI PROFIL I POVEŽITE SE SA NAJVEĆIM GRAĐEVINSKIM FIRMAMA U SRBIJI."
            buttonText="KREIRAJ PROFIL"
            onClick={() => navigate('/postavi-oglas')}
            icon="engineering"
          />
        </FilterSidebar>

        {/* Candidates Grid */}
        <div className="flex-1 w-full space-y-10">
          <div className="flex justify-between items-end border-b border-white/5 pb-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-[8px] h-16 bg-secondary mt-1"></div>
              <div>
                <h3 className="text-[38px] leading-[36px] font-black text-white uppercase tracking-tighter">
                  Aktivna <br /> <span className="text-secondary">Ponuda</span>
                </h3>
                <p className="text-[12px] font-black mt-2 tracking-widest uppercase">
                  <span className="text-white/40">ukupno:</span> <span className="text-secondary">{masters.length} oglasa u opticaju</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex bg-[#13212e]/60 backdrop-blur-md border border-white/5 rounded-lg p-1 gap-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${viewMode === 'grid' ? 'bg-secondary text-black shadow-lg shadow-secondary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  title="Mrežni prikaz"
                >
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${viewMode === 'list' ? 'bg-secondary text-black shadow-lg shadow-secondary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                  title="Lista"
                >
                  <span className="material-symbols-outlined text-[20px]">view_list</span>
                </button>
              </div>
            </div>
          </div>

          <SortingBar 
            currentSort={sortBy}
            options={[
              { value: 'experience', label: 'PO ISKUSTVU' },
              { value: 'name', label: 'PO IMENU' }
            ]}
            onChange={(val) => setSortBy(val as any)}
          />

          {loading && masters.length === 0 ? (
              <LoadingState count={6} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" />
            ) : masters.length > 0 ? (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : "flex flex-col gap-6"}>
                {masters.map((candidate: any, index: number) => (
                <div
                  key={candidate.id}
                  className={`group relative h-full bg-[#111a22]/60 backdrop-blur-xl border border-white/5 rounded-[10px] transition-all duration-500 hover:border-secondary/30 hover:shadow-[0_0_30px_rgba(254,191,13,0.05)] hover:-translate-y-1 p-5 flex flex-col ${candidate.isPremiumProfile ? 'border-secondary/30 bg-secondary/[0.02] shadow-[0_0_40px_rgba(254,191,13,0.08)]' : ''}`}
                >
                  {/* Premium Glow Effect */}
                  {candidate.isPremiumProfile && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[60px] pointer-events-none"></div>
                  )}

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="relative">
                        <OptimizedImage 
                          src={candidate.photo || candidate.avatar || ""} 
                          fallbackType="default" 
                          alt={candidate.name || "Photo"} 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                          containerClassName="w-16 h-16 rounded-sm overflow-hidden border border-white/10 bg-[#050f19] shadow-2xl" 
                        />
                          
                        {candidate.verified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-[#111a22] shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                            <span className="material-symbols-outlined text-white text-[10px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest ${
                          candidate.status as string === 'slobodan' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                          candidate.status as string === 'zauzet' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {candidate.status as string === 'slobodan' ? 'DOSTUPAN' : candidate.status as string === 'zauzet' ? 'ZAUZET' : 'USKORO'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-secondary transition-colors line-clamp-1 leading-none italic">
                        {candidate.name}
                      </h3>
                      <p className="text-secondary text-[9px] font-bold uppercase tracking-[0.3em] mt-2 opacity-80">{candidate.profession}</p>
                    </div>

                    {candidate.verified && (
                      <div className="flex items-center gap-1.5 mb-4 bg-[#0A1A0F]/80 border border-green-500/20 backdrop-blur-xl px-2 py-1 rounded-[4px] w-fit shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.8)]"></span>
                        <span className="text-[7.5px] font-black tracking-[0.1em] uppercase text-green-400">Verifikovan</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5 mb-4">
                      <div className="flex flex-col">
                        <span className="text-[7px] font-black uppercase tracking-widest text-white/30 mb-1 leading-none">Lokacija</span>
                        <div className="flex items-center gap-1 text-white/60 text-[10px] font-bold">
                          <span className="material-symbols-outlined text-secondary text-sm">location_on</span>
                          {candidate.location}
                        </div>
                      </div>
                      <div className="flex flex-col border-l border-white/5 pl-4">
                        <span className="text-[7px] font-black uppercase tracking-widest text-white/30 mb-1 leading-none">Iskustvo</span>
                        <div className="flex items-center gap-1 text-white/60 text-[10px] font-mono font-black uppercase">
                          <span className="material-symbols-outlined text-secondary text-sm">history</span>
                          {candidate.experience}
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex flex-wrap gap-1.5 mb-6 h-12 overflow-hidden items-start">
                      {candidate.skills.slice(0, 3).map((s: string) => (
                        <span key={s} className="px-2 py-1 bg-white/5 rounded-sm text-[8px] font-black text-white/40 uppercase tracking-widest border border-white/5">
                          {s}
                        </span>
                      ))}
                      {candidate.skills.length > 3 && (
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest ml-1">+{candidate.skills.length - 3} još</span>
                      )}
                    </div>

                    {/* Action Block */}
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1 text-secondary font-black text-[10px] bg-secondary/10 px-1.5 py-0.5 rounded-sm font-mono">
                           <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>shield_check</span>
                           {candidate.profileScore || 95}%
                         </div>
                       </div>
                       <Link
                        to={`/majstori/${candidate.id}`}
                        className="hidden md:inline-flex text-secondary font-black text-[9px] items-center gap-1 hover:underline uppercase tracking-widest"
                      >
                        POGLEDAJ PROFIL <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            ) : (
              <NoResults 
                message="TRENUTNO NEMA KANDIDATA KOJI SE POKLAPAJU SA VAŠIM KRITERIJUMIMA PRETRAGE." 
                icon="engineering" 
              />
            )}

            {isDeepPagingLimitReached && masters.length > 0 && (
              <div className="mt-12 flex justify-center w-full">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-center max-w-lg">
                  <p className="text-xs text-red-400 font-bold">
                    Dosegli ste limit listanja. Za specifičnije rezultate, molimo koristite konkretne filtere i pretragu gore.
                  </p>
                </div>
              </div>
            )}

            {hasMore && masters.length > 0 && (
              <div className="mt-12 flex justify-center w-full">
                <button
                  onClick={() => loadMore()}
                  disabled={loading}
                  className="bg-secondary !text-black px-12 h-14 rounded-[10px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white transition-all shadow-[0_10px_20px_rgba(254,191,13,0.15)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'UČITAVANJE...' : 'PRIKAŽI JOŠ KANDIDATA'}
                </button>
              </div>
            )}

            <div className="mt-4">
              <VerticalCTA 
                title="MAJSTOR STE?"
                description="REGISTRUJTE SVOJ PROFIL, POKAŽITE SVOJE RADOVE I DOBIJTE PONUDE ZA RAD NA NAJVEĆIM GRADILIŠTIMA."
                buttonText="KREIRAJ PROFIL"
                buttonLink="/postavi-oglas"
                icon={HardHat}
              />
            </div>
          </div>
        </div>
      </main>

      <CrossVerticalHub 
        gradSlug={!gradSlug || gradSlug === 'all' ? undefined : gradSlug} 
        zanimanjeSlug={!zanimanjeSlug || zanimanjeSlug === 'SVE' ? undefined : zanimanjeSlug} 
        currentVertical="majstori" 
      />

      <SeoContentBlock type="majstori" grad={gradSlug ?? undefined} zanimanje={zanimanjeSlug ?? undefined} itemCount={masters.length} />
    </div>
  );
}
