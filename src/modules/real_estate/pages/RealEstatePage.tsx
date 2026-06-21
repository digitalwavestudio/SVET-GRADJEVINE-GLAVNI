import { VerticalCTA } from '@/src/components/VerticalCTA';
import { Button } from '@/src/components/ui/Button';
import { Map } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { VirtuosoGrid } from 'react-virtuoso';
import { Link, useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import DynamicSEO from '@/src/components/DynamicSEO';
import { generateRealEstateListSchema } from '@/src/lib/seoSchema';
import LoadingState from '@/src/components/LoadingState';
import NoResults from '@/src/components/ui/NoResults';
import SeoContentBlock from '@/src/components/SeoContentBlock';
import { CrossVerticalHub } from '@/src/components/CrossVerticalHub';
import { FilterSidebar, FilterClearButton, FilterSection, FilterInput, FilterSelect, FilterToggle, FilterCTA, MarketStatsWidget, SortingBar } from '@/src/modules/core/components/filters/FilterComponents';
import { LocationCombobox } from '@/src/components/LocationCombobox';
import { APP_CONFIG } from '@/src/constants/config';
import { ACCESS_ROAD_TYPES, LOCATIONS, REAL_ESTATE_PURPOSES } from '@/src/constants/taxonomy';
import { useRealEstateList } from '@/src/modules/real_estate/hooks/useRealEstate';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useCollectionStats } from '@/src/hooks/useCollectionStats';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { StandardPageHero } from '@/src/components/StandardPageHero';
import { ListingSkeleton } from '@/src/components/ListingSkeleton';
import heroPlacesImage from '@/src/assets/images/regenerated_image_1777753146328.webp';

import { resolveRouteFilters } from '@/src/lib/routeFilters';

export default function RealEstatePage() {
  const params = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const resolved = resolveRouteFilters('placevi', params);
  const { locationSlug: gradSlug, purposeSlug: namenaSlug } = resolved;
  const searchParamsStr = searchParams.toString();

  // URL State as Single Source of Truth
  const activeFilters = useMemo(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const minA = currentParams.get('minArea');
    const maxA = currentParams.get('maxArea');
    return {
      search: currentParams.get('q') || null,
      location: gradSlug || null,
      radius: currentParams.get('radius') ? Number(currentParams.get('radius')) : undefined,
      minArea: minA ? Number(minA) : null,
      maxArea: maxA ? Number(maxA) : null,
      purpose: namenaSlug || undefined,
      accessRoad: currentParams.get('accessRoad') && currentParams.get('accessRoad') !== 'all' ? currentParams.get('accessRoad') : null,
      highwayAccess: currentParams.get('highway') === 'true' || null,
      railAccess: currentParams.get('rail') === 'true' || null,
      freeZone: currentParams.get('freezone') === 'true' || null
    };
  }, [gradSlug, namenaSlug, searchParamsStr]);

  const activeFiltersKey = JSON.stringify(activeFilters);

  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading: loading, fetchNextPage: loadMore, hasNextPage } = useRealEstateList(activeFilters);
  const isDeepPagingLimitReached = Boolean(hasNextPage && data?.pages && data.pages.length >= 11);
  const hasMore = hasNextPage && !isDeepPagingLimitReached;
  const { data: realEstateStats } = useCollectionStats('plots');
  
  const plotsBase = useMemo(() => data?.pages.flatMap(page => page?.items || []) || [], [data]);
  const isEmptyFilter = !activeFilters || Object.keys(activeFilters).length === 0 || (Object.keys(activeFilters).length === 1 && (activeFilters as { status?: string }).status === 'approved');
  const totalPlotsCount = data?.pages[0]?.totalHits ?? (isEmptyFilter ? realEstateStats?.total : plotsBase.length) ?? plotsBase.length;

  const plots = useMemo(() => {
    let result = [...plotsBase];
    
    if (sortBy === 'price-asc') {
        result = [...result].sort((a, b) => (Number(a.price || 0)) - (Number(b.price || 0)));
    } else if (sortBy === 'price-desc') {
        result = [...result].sort((a, b) => (Number(b.price || 0)) - (Number(a.price || 0)));
    }
    
    return result;
  }, [data, sortBy]);

  // Local filter states handling
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [minArea, setMinArea] = useState(searchParams.get('minArea') || '');
  const [maxArea, setMaxArea] = useState(searchParams.get('maxArea') || '');
  const debouncedMinArea = useDebounce(minArea, 500);
  const debouncedMaxArea = useDebounce(maxArea, 500);

  const [purpose, setPurpose] = useState(namenaSlug || searchParams.get('purpose') || '');
  const [filterLocation, setFilterLocation] = useState(gradSlug || 'all');
  const [accessRoad, setAccessRoad] = useState(searchParams.get('accessRoad') || '');
  const [highwayAccess, setHighwayAccess] = useState(searchParams.get('highway') === 'true');
  const [railAccess, setRailAccess] = useState(searchParams.get('rail') === 'true');
  const [freeZone, setFreeZone] = useState(searchParams.get('freezone') === 'true');
  const [filterRadius, setFilterRadius] = useState(searchParams.get('radius') || '50');
  const debouncedRadius = useDebounce(filterRadius, 500);

  // Main filter application logic
  const handleApplyFilters = useCallback(() => {
    const loc = filterLocation !== 'all' ? filterLocation : null;
    const cat = purpose !== 'all' ? purpose : null;

    // Update Query Params
    const newParams = new URLSearchParams();
    
    // Update URL structure
    let newPath = '/placevi';
    if (loc) {
      newPath = cat ? `/placevi/${cat}/${loc}` : `/placevi/lokacija/${loc}`;
      if (filterRadius && filterRadius !== '50') newParams.set('radius', filterRadius);
    } else if (cat) {
      newPath = `/placevi/${cat}`;
    }

    if (searchQuery.trim()) newParams.set('q', searchQuery.trim());
    if (debouncedMinArea) newParams.set('minArea', debouncedMinArea);
    if (debouncedMaxArea) newParams.set('maxArea', debouncedMaxArea);
    if (accessRoad && accessRoad !== 'all') newParams.set('accessRoad', accessRoad);
    if (highwayAccess) newParams.set('highway', 'true');
    if (railAccess) newParams.set('rail', 'true');
    if (freeZone) newParams.set('freezone', 'true');

    const currentPath = location.pathname;
    const currentParams = searchParamsStr;
    const targetParams = newParams.toString();

    // STRICT NAVIGATION GUARD
    if (currentPath !== newPath || currentParams !== targetParams) {
      if (currentPath !== newPath) {
        navigate(`${newPath}?${targetParams}`, { preventScrollReset: true });
      } else {
        setSearchParams(newParams, { preventScrollReset: true });
      }
    }
  }, [filterLocation, purpose, filterRadius, searchQuery, debouncedMinArea, debouncedMaxArea, accessRoad, highwayAccess, railAccess, freeZone, navigate, setSearchParams, searchParamsStr]);

  // Auto apply filters - strictly guarded to prevent loops
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const currentLoc = gradSlug || currentParams.get('loc') || 'all';
    const currentQ = currentParams.get('q') || '';
    const currentMinArea = currentParams.get('minArea') || '';
    const currentMaxArea = currentParams.get('maxArea') || '';
    const currentPurpose = namenaSlug || currentParams.get('purpose') || '';
    const currentAccess = currentParams.get('accessRoad') || '';
    const currentRadius = currentParams.get('radius') || '50';
    const currentHighway = currentParams.get('highway') === 'true';
    const currentRail = currentParams.get('rail') === 'true';
    const currentFreezone = currentParams.get('freezone') === 'true';

    const hasChanged = 
      debouncedSearch !== currentQ ||
      filterLocation !== currentLoc ||
      debouncedMinArea !== currentMinArea ||
      debouncedMaxArea !== currentMaxArea ||
      debouncedRadius !== currentRadius ||
      purpose !== currentPurpose ||
      accessRoad !== currentAccess ||
      highwayAccess !== currentHighway ||
      railAccess !== currentRail ||
      freeZone !== currentFreezone;

    if (hasChanged) {
      handleApplyFilters();
    }
  }, [
    debouncedSearch, 
    filterLocation, 
    debouncedRadius, 
    debouncedMinArea, 
    debouncedMaxArea, 
    purpose, 
    accessRoad, 
    highwayAccess, 
    railAccess, 
    freeZone, 
    handleApplyFilters, 
    searchParamsStr, 
    gradSlug, 
    namenaSlug
  ]);

  // Sync state with URL when searchParams change (handling back/forward)
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const q = currentParams.get('q') || '';
    const minA = currentParams.get('minArea') || '';
    const maxA = currentParams.get('maxArea') || '';
    const purp = namenaSlug || currentParams.get('purpose') || '';
    const loc = gradSlug || currentParams.get('loc') || 'all';
    const access = currentParams.get('accessRoad') || '';
    const rad = currentParams.get('radius') || '50';
    const highway = currentParams.get('highway') === 'true';
    const rail = currentParams.get('rail') === 'true';
    const freezone = currentParams.get('freezone') === 'true';

    if (q !== searchQuery) setSearchQuery(q);
    if (loc !== filterLocation) setFilterLocation(loc);
    if (minA !== minArea) setMinArea(minA);
    if (maxA !== maxArea) setMaxArea(maxA);
    if (purp !== purpose) setPurpose(purp);
    if (access !== accessRoad) setAccessRoad(access);
    if (rad !== filterRadius) setFilterRadius(rad);
    if (highway !== highwayAccess) setHighwayAccess(highway);
    if (rail !== railAccess) setRailAccess(rail);
    if (freezone !== freeZone) setFreeZone(freezone);
  }, [searchParamsStr, gradSlug, namenaSlug]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setMinArea('');
    setMaxArea('');
    setPurpose('');
    setFilterRadius('50');
    setAccessRoad('');
    setHighwayAccess(false);
    setRailAccess(false);
    setFreeZone(false);
    navigate('/placevi');
  };

  const locName = gradSlug ? LOCATIONS.find(l => l.slug === gradSlug)?.name : '';

  const itemListSchema = useMemo(() => generateRealEstateListSchema(
    plots.slice(0, 20).map((plot) => ({
      name: plot.title,
      url: `${APP_CONFIG.BASE_URL}/placevi/oglas/${plot.id}`,
      description: plot.description,
      image: plot.images?.[0]
    })),
    {
      name: `Industrijski placevi i zemljišta ${locName ? `u mestu ${locName}` : ''}`,
      description: `Katalog građevinskog i industrijskog zemljišta ${locName ? `iz mesta ${locName}` : 'širom Srbije'}.`,
      url: `${APP_CONFIG.BASE_URL}/placevi${gradSlug ? `/${gradSlug}` : ''}`,
    }
  ), [locName, gradSlug, plots]);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary min-h-screen">
      <DynamicSEO type="placevi" grad={gradSlug || undefined} zanimanje={namenaSlug || undefined} jsonLd={[itemListSchema]} itemCount={totalPlotsCount} />
      
      <StandardPageHero
        badge="Premijum Investicione Lokacije"
        title="ZA PAMETNE"
        titleAccent="INVESTITORE"
        subtitle="Industrijska, građevinska i komercijalna zemljišta proverenog potencijala. Direktan kontakt, bez skrivenih troškova."
        stats={[
          { label: "Aktivne Lokacije", value: realEstateStats?.total?.toLocaleString() || "420", icon: "map" },
          { label: "Novo Danas", value: `+${realEstateStats?.today?.toLocaleString() || "12"}`, icon: "rocket_launch" },
          { label: "Premium Ponuda", value: realEstateStats?.premium?.toLocaleString() || "40", icon: "verified" }
        ]}
      >
        <div className="mt-8 flex flex-col md:flex-row gap-4 max-w-4xl w-full">
          <div className="flex-1 bg-[#13212e]/40 backdrop-blur-3xl border border-white/5 rounded-[10px] flex items-center pl-4 md:pl-8 p-1 shadow-3xl transition-all focus-within:border-secondary/50 focus-within:bg-[#192735]/60 hover:bg-[#192735]/40 group">
            <span className="material-symbols-outlined text-secondary text-2xl font-black group-focus-within:rotate-12 transition-transform">search</span>
            <input
              type="text"
              placeholder="PRETRAŽI LOKACIJE (NPR. INĐIJA, SUBOTICA)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/20 text-[10px] font-black uppercase tracking-[0.2em] py-4 md:py-5 px-3 md:px-6" 
            />
          </div>
          <Button 
            onClick={handleApplyFilters}
            variant="primary"
            className="w-full md:w-auto px-12 h-16 rounded-[10px] font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_20px_40px_rgba(254,191,13,0.2)] flex items-center justify-center gap-3 active:scale-95 shrink-0 border-none"
            icon="search"
          >
            PRETRAŽI
          </Button>
        </div>
      </StandardPageHero>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col lg:flex-row-reverse gap-12">
        
        {/* Sidebar Filters */}
        <FilterSidebar>
          <MarketStatsWidget 
            stats={{ 
              total: realEstateStats?.total || 0, 
              trend: "6", 
              category: "PLAC" 
            }} 
          />
          <FilterSection title="LOKACIJA">
            <div className="space-y-4">
              <LocationCombobox 
                selectedLocation={gradSlug && gradSlug !== 'all' ? gradSlug : null}
                onChange={(slug) => {
                  if (slug) {
                    navigate(`/placevi/${slug}${location.search}`);
                  } else {
                    navigate(`/placevi${location.search}`);
                  }
                }}
              />
              {gradSlug && gradSlug !== 'all' && (
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

          {/* Površina - Odmah ispod lokacije */}
          <FilterSection title="POVRŠINA">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 font-bold uppercase ml-1">Min (Ari/Ha)</label>
                <FilterInput 
                  placeholder="Min" 
                  type="number"
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-white/40 font-bold uppercase ml-1">Max (Ari/Ha)</label>
                <FilterInput 
                  placeholder="Max" 
                  type="number"
                  value={maxArea}
                  onChange={(e) => setMaxArea(e.target.value)}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </FilterSection>

          {/* Clear All Button */}
          {(searchQuery || gradSlug || minArea || maxArea || purpose || accessRoad || highwayAccess || railAccess || freeZone || filterRadius !== '50') && (
            <FilterClearButton onClick={handleResetFilters} />
          )}

          <FilterSection title="NAMENA & PRILAZ">
            <div className="space-y-4">
              <FilterSelect 
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              >
                <option value="" className="bg-[#111a22]">Sve namene zemljišta</option>
                {REAL_ESTATE_PURPOSES.map(p => (
                  <option key={p.id} value={p.id} className="bg-[#111a22]">{p.name}</option>
                ))}
              </FilterSelect>

              <FilterSelect 
                value={accessRoad}
                onChange={(e) => setAccessRoad(e.target.value)}
              >
                <option value="" className="bg-[#111a22]">Svi tipovi prilaza</option>
                {ACCESS_ROAD_TYPES.map(a => (
                  <option key={a.id} value={a.id} className="bg-[#111a22]">{a.name}</option>
                ))}
              </FilterSelect>
            </div>
          </FilterSection>

          <FilterSection title="POVEZANOST">
            <div className="space-y-4">
              <FilterToggle 
                label="Pristup Autoputu" 
                checked={highwayAccess} 
                onChange={setHighwayAccess} 
              />
              <FilterToggle 
                label="Železnička Mreža" 
                checked={railAccess} 
                onChange={setRailAccess} 
              />
              <FilterToggle 
                label="Slobodna Zona" 
                checked={freeZone} 
                onChange={setFreeZone} 
              />
            </div>
          </FilterSection>

          <FilterCTA 
            title="PRODAJTE PLAC"
            description="IZLOŽITE SVOJE ZEMLJIŠTE NAJVEĆOJ MREŽI INVESTITORA I GRAĐEVINSKIH FIRMI."
            buttonText="DODAJ OGLAS"
            onClick={() => navigate('/postavi-oglas')}
            icon="landscape"
          />
        </FilterSidebar>

        {/* Grid Content */}
        <div className="flex-1 flex flex-col">
          {/* Sorting & Options */}
          <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
            <div className="flex items-start gap-4">
              <div className="w-[8px] h-16 bg-secondary mt-1"></div>
              <div>
                <h3 className="text-[38px] leading-[36px] font-black text-white uppercase tracking-tighter">
                  Aktivna <br /> <span className="text-secondary">Ponuda</span>
                </h3>
                <p className="text-[12px] font-black mt-2 tracking-widest uppercase">
                  <span className="text-white/40">ukupno:</span> <span className="text-secondary">{totalPlotsCount} oglasa u opticaju</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex bg-[#13212e]/60 backdrop-blur-md border border-white/5 rounded-lg p-1 gap-1">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${viewMode === 'grid' ? 'bg-secondary text-black shadow-lg shadow-secondary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`w-9 h-9 flex items-center justify-center rounded-md transition-all duration-300 ${viewMode === 'list' ? 'bg-secondary text-black shadow-lg shadow-secondary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                >
                  <span className="material-symbols-outlined text-[20px]">view_list</span>
                </button>
              </div>
            </div>
          </div>

          <SortingBar 
            currentSort={sortBy}
            options={[
              { value: 'newest', label: 'NAJNOVIJE' },
              { value: 'price-asc', label: 'NAJNIŽA CENA' },
              { value: 'price-desc', label: 'NAJVIŠA CENA' }
            ]}
            onChange={(val) => setSortBy(val as any)}
          />

          <div className="w-full">
              {loading && plots.length === 0 ? (
                 <ListingSkeleton viewMode={viewMode === 'list' ? 'list' : 'grid'} count={4} />
              ) : plots.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {plots.map((plot: any, index: number) => (
                    <div 
                      key={plot.id}
                      className={`group bg-surface-container-high rounded-[10px] overflow-hidden transition-all duration-300 border border-white/5 flex flex-col hover:border-white/20 relative ${plot.isPremium ? 'border-secondary/40 shadow-[0_10px_40px_rgba(254,191,13,0.1)]' : ''}`}
                    >
                    <div className="relative h-64 overflow-hidden shrink-0 border-b border-white/5">
                      {plot.images && plot.images.length > 0 ? (
                        <OptimizedImage
                          src={plot.images[0]}
                          placeholder={plot.imagePlaceholders?.[0]}
                          alt={plot.title}
                          className="w-full h-full object-cover"
                          containerClassName="h-full w-full"
                          isProcessing={plot.imageStatus === 'processing'}
                        /> 
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <span className="material-symbols-outlined text-5xl text-white/5">landscape</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none opacity-80"></div>
                      
                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20">
                        <div className="flex flex-col gap-2">
                          <span className="bg-black/60 backdrop-blur text-white px-3 py-1 rounded-[10px] text-[9px] font-black uppercase tracking-widest border border-white/10 w-fit">
                            Zemljište
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {plot.isPremium && (
                             <span className="bg-secondary text-slate-950 px-3 py-1 rounded-[10px] text-[9px] font-black tracking-widest uppercase flex items-center gap-1 shadow-lg shadow-secondary/20">
                               <span className="material-symbols-outlined text-[10px]">star</span> PREMIJUM
                             </span>
                          )}
                          {plot.isUrgent && (
                             <span className="bg-orange-500 text-white px-3 py-1 rounded-[10px] text-[9px] font-black tracking-widest uppercase flex items-center gap-1 shadow-lg shadow-orange-500/20">
                               <span className="material-symbols-outlined text-[10px]">local_fire_department</span> HITNO
                             </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Title & Price overlay */}
                      <div className="absolute bottom-6 left-6 right-6 z-10">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight line-clamp-2 drop-shadow-md leading-tight mb-2">
                          <Link to={`/placevi/oglas/${plot.id}`} className="after:absolute after:inset-0">
                            {plot.title}
                          </Link>
                        </h3>
                        <p className="text-2xl font-black text-secondary tracking-tight">
                          {plot.price ? `€${plot.price.toLocaleString()}` : 'Cena na upit'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-5 flex flex-col flex-grow bg-surface-container-high">
                      <div className="flex items-center gap-3 mb-4">
                         <div className="relative shrink-0 z-20">
                           {plot.companyLogo ? (
                             <OptimizedImage src={plot.companyLogo} fallbackType="company" alt={plot.companyName || "Logo kompanije"} className="w-6 h-6 rounded-sm object-cover" containerClassName="w-6 h-6 rounded-sm overflow-hidden" />
                           ) : (
                             <div className="w-6 h-6 rounded-sm bg-white/5 flex items-center justify-center font-black text-white/20 uppercase text-[6px]">
                               {plot.companyName?.charAt(0) || 'P'}
                             </div>
                           )}
                           {plot.isCompanyVerified && (
                             <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center border border-[#111a22] shadow-md">
                               <span className="material-symbols-outlined text-white text-[6px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                             </div>
                           )}
                         </div>
                         <div className="flex items-center gap-1">
                           <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{plot.companyName || 'PONUĐAČ'}</span>
                           {plot.isCompanyVerified && (
                             <span className="hidden md:inline-block material-symbols-outlined text-blue-400 text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                           )}
                         </div>
                      </div>
                      
                      <div className="flex flex-col mb-4">
                        <span className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-1 leading-none">Lokacija</span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[#a2acb9]">
                          <span className="material-symbols-outlined text-[12px] text-secondary">location_on</span>
                          {plot.location}
                        </div>
                      </div>
                      
                      <div className="hidden md:grid grid-cols-2 gap-2 mb-6">
                        <div className="bg-white/5 p-3 rounded-sm border border-white/5 flex flex-col items-center justify-center text-center">
                          <span className="material-symbols-outlined text-secondary/70 mb-1 text-sm">aspect_ratio</span>
                          <span className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-0.5 leading-none">POVRŠINA</span>
                          <span className="text-xs font-black text-white font-mono">{plot.area ? `${plot.area} ${plot.areaUnit || 'ari'}` : 'N/A'}</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-sm border border-white/5 flex flex-col items-center justify-center text-center">
                          <span className="material-symbols-outlined text-secondary/70 mb-1 text-sm">route</span>
                          <span className="text-[7px] font-black text-white/30 uppercase tracking-widest mb-0.5 leading-none">PRILAZ</span>
                          <span className="text-xs font-black text-white uppercase truncate px-1">
                             {ACCESS_ROAD_TYPES.find(r => r.id === plot.accessRoad || r.slug === plot.accessRoad)?.name || plot.accessRoad || 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <Link 
                        to={`/placevi/oglas/${plot.id}`}
                        className="hidden md:flex w-full bg-white/5 border border-white/10 text-white py-3 rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:border-secondary/30 transition-all items-center justify-center gap-2 mt-auto group relative z-20"
                      >
                        Prikaži Detalje
                        <span className="material-symbols-outlined text-sm text-secondary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                  ))}
                </div>
              ) : (
                <NoResults 
                  message="TRENUTNO NEMA KANDIDATA KOJI SE POKLAPAJU SA VAŠIM KRITERIJUMIMA PRETRAGE." 
                  icon="landscape" 
                />
              )}
            </div>

            {isDeepPagingLimitReached && plots.length > 0 && (
              <div className="mt-12 flex justify-center w-full">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-center max-w-lg">
                  <p className="text-xs text-red-400 font-bold">
                    Dosegli ste limit listanja. Za specifičnije rezultate, molimo koristite konkretne filtere i pretragu gore.
                  </p>
                </div>
              </div>
            )}

            {hasMore && plots.length > 0 && (
              <div className="mt-12 flex justify-center w-full">
                <button
                  onClick={() => loadMore()}
                  disabled={loading}
                  className="bg-secondary text-slate-950 px-12 h-14 rounded-[10px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white transition-all shadow-[0_10px_20px_rgba(254,191,13,0.15)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {loading ? 'UČITAVANJE...' : 'PRIKAŽI JOŠ OGLASA'}
                </button>
              </div>
            )}

            <div className="mt-4">
              <VerticalCTA 
                title="PRODAJETE PLAC ILI ZEMLJIŠTE?"
                description="PRONAĐITE OZBILJNE INVESTITORE I KUPCE ZA SVOJE INDUSTRIJSKO ILI GRAĐEVINSKO ZEMLJIŠTE BRZO I EFIKASNO."
                buttonText="DODAJ OGLAS"
                buttonLink="/postavi-oglas"
                icon={Map}
              />
            </div>
          </div>
      </section>

      <CrossVerticalHub 
        gradSlug={!gradSlug || gradSlug === 'all' ? undefined : gradSlug} 
        zanimanjeSlug={!namenaSlug || namenaSlug === 'SVE' ? undefined : namenaSlug} 
        currentVertical="placevi" 
      />

      <SeoContentBlock type="placevi" grad={gradSlug || undefined} zanimanje={namenaSlug || undefined} />
    </div>
  );
}
