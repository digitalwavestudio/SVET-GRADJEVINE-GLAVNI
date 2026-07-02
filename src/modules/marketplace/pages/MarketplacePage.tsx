import { VerticalCTA } from '@/src/components/VerticalCTA';
import { Button } from '@/src/components/ui/Button';
import { Store } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { generateProductListSchema } from '@/src/lib/seoSchema';
import { MARKETPLACE_CATEGORIES, LOCATIONS } from '@/src/constants/taxonomy';
import { APP_CONFIG } from '@/src/constants/config';
import { FilterSidebar, FilterSection, FilterRadio, FilterCTA, FilterClearButton, ActiveFilterChips, MarketStatsWidget, SortingBar, ViewToggle } from '@/src/modules/core/components/filters/FilterComponents';
import { LocationCombobox } from '@/src/components/LocationCombobox';
import { useMarketplaceList } from '@/src/modules/marketplace/hooks/useMarketplace';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { useCollectionStats } from '@/src/hooks/useCollectionStats';
import { useDebounce } from '@/src/hooks/useDebounce';
import { formatDate } from '@/src/lib/dateUtils';
import LoadingState from '@/src/components/LoadingState';
import NoResults from '@/src/components/ui/NoResults';
import { PremiumBadge } from '@/src/components/ui/PremiumBadge';
import { BaseNichePage } from '@/src/components/layout/BaseNichePage';
import { resolveRouteFilters } from '@/src/lib/routeFilters';

export default function MarketplacePage() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const resolved = resolveRouteFilters('alat-i-oprema', params);
  const { locationSlug: gradSlug, categorySlug: kategorijaSlug } = resolved;

  // Local filter states
  const [localActiveFilter, setLocalActiveFilter] = useState(kategorijaSlug || searchParams.get('cat') || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filterLocation, setFilterLocation] = useState(gradSlug || searchParams.get('loc') || 'all');
  const [filterRadius, setFilterRadius] = useState(searchParams.get('radius') || '50');
  const [minPrice, setMinPrice] = useState(searchParams.get('minP') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxP') || '');

  const debouncedSearch = useDebounce(searchTerm, 400);
  const debouncedMinPrice = useDebounce(minPrice, 500);
  const debouncedMaxPrice = useDebounce(maxPrice, 500);
  const debouncedRadius = useDebounce(filterRadius, 500);

  // Active Filter Chips Logic
  const filterChips = useMemo(() => {
    const list: { id: string; label: string; value: unknown }[] = [];
    
    if (searchTerm) list.push({ id: 'search', label: 'PRETRAGA', value: searchTerm });
    if (localActiveFilter !== 'all') {
      const cat = MARKETPLACE_CATEGORIES.find(c => c.id === localActiveFilter);
      if (cat) list.push({ id: 'category', label: 'KATEGORIJA', value: cat.name });
    }
    if (filterLocation !== 'all') {
      const loc = LOCATIONS.find(l => l.slug === filterLocation);
      if (loc) list.push({ id: 'location', label: 'LOKACIJA', value: loc.name });
    }
    if (minPrice || maxPrice) {
      list.push({ id: 'price', label: 'CENA', value: `${minPrice || 0}€ - ${maxPrice || '∞'}€` });
    }

    return list;
  }, [searchTerm, localActiveFilter, filterLocation, minPrice, maxPrice]);

  const removeFilterChip = (id: string) => {
    if (id === 'search') setSearchTerm('');
    else if (id === 'category') setLocalActiveFilter('all');
    else if (id === 'location') setFilterLocation('all');
    else if (id === 'price') { setMinPrice(''); setMaxPrice(''); }
  };

  const handleResetAllFilters = () => {
    setLocalActiveFilter('all');
    setFilterLocation('all');
    setFilterRadius('50');
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setSearchParams(new URLSearchParams(), { preventScrollReset: true });
  };

  const searchParamsStr = searchParams.toString();

  // Parse URL State for useMarketplaceList
  const activeFilters = useMemo(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    return {
      categoryId: kategorijaSlug || currentParams.get('cat') || undefined,
      search: currentParams.get('q') || undefined,
      locationSlug: gradSlug || currentParams.get('loc') || undefined,
      radius: currentParams.get('radius') ? Number(currentParams.get('radius')) : undefined,
      minPrice: Number(currentParams.get('minP')) || undefined,
      maxPrice: Number(currentParams.get('maxP')) || undefined
    };
  }, [searchParamsStr, gradSlug, kategorijaSlug]);

  const activeFiltersKey = JSON.stringify(activeFilters);

  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading: loading, fetchNextPage: loadMore, hasNextPage } = useMarketplaceList(activeFilters);
  const isDeepPagingLimitReached = Boolean(hasNextPage && data?.pages && data.pages.length >= 11);
  const hasMore = hasNextPage && !isDeepPagingLimitReached;
  const { data: marketplaceStats } = useCollectionStats('marketplace');

  const itemsBase = React.useMemo(() => data?.pages.flatMap(page => (page as any)?.items || []) || [], [data]);
  const isEmptyFilter = !activeFilters || Object.keys(activeFilters).length === 0 || (Object.keys(activeFilters).length === 1 && (activeFilters as any).status === 'approved');
  const totalMarketplaceCount = (data?.pages[0] as any)?.totalHits ?? (isEmptyFilter ? marketplaceStats?.total : itemsBase.length) ?? itemsBase.length;

  const items = React.useMemo(() => {
    let result = [...itemsBase];

    // Apply sorting
    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => {
        const p1 = parseFloat(a.price?.toString().replace(/[^0-9.]/g, '')) || 0;
        const p2 = parseFloat(b.price?.toString().replace(/[^0-9.]/g, '')) || 0;
        return p1 - p2;
      });
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => {
        const p1 = parseFloat(a.price?.toString().replace(/[^0-9.]/g, '')) || 0;
        const p2 = parseFloat(b.price?.toString().replace(/[^0-9.]/g, '')) || 0;
        return p2 - p1;
      });
    } else if (sortBy === 'newest') {
      // Default is newest from backend, but we can re-sort if timestamps exist
    }

    // Client-side fallback for price filtering if needed
    if (activeFilters.minPrice || activeFilters.maxPrice) {
      result = result.filter(item => {
        const p = parseFloat(item.price?.toString().replace(/[^0-9.]/g, '')) || 0;
        if (activeFilters.minPrice && p < activeFilters.minPrice) return false;
        if (activeFilters.maxPrice && p > activeFilters.maxPrice) return false;
        return true;
      });
    }
    return result;
  }, [data, activeFilters]);

  const isNavigatingRef = React.useRef(false);

  // Auto apply filters - strictly guarded to prevent loops
  useEffect(() => {
    if (isNavigatingRef.current) return;

    const currentParams = new URLSearchParams(searchParamsStr);
    const currentCat = kategorijaSlug || currentParams.get('cat') || 'all';
    const currentQ = currentParams.get('q') || '';
    const currentLoc = gradSlug || currentParams.get('loc') || 'all';
    const currentRadius = currentParams.get('radius') || '50';
    const currentMinP = currentParams.get('minP') || '';
    const currentMaxP = currentParams.get('maxP') || '';

    const hasChanged = 
      localActiveFilter !== currentCat ||
      debouncedSearch !== currentQ ||
      filterLocation !== currentLoc ||
      debouncedRadius !== currentRadius ||
      debouncedMinPrice !== currentMinP ||
      debouncedMaxPrice !== currentMaxP;

    if (hasChanged) {
      isNavigatingRef.current = true;
      handleApplyFilters();
      setTimeout(() => { isNavigatingRef.current = false; }, 50);
    }
  }, [
    localActiveFilter, 
    debouncedSearch, 
    filterLocation, 
    debouncedRadius, 
    debouncedMinPrice, 
    debouncedMaxPrice, 
    searchParamsStr, 
    gradSlug, 
    kategorijaSlug
  ]);

  // Sync state with URL when searchParams change (handling back/forward)
  useEffect(() => {
    if (isNavigatingRef.current) return;

    const currentParams = new URLSearchParams(searchParamsStr);
    const cat = kategorijaSlug || currentParams.get('cat') || 'all';
    const q = currentParams.get('q') || '';
    const loc = gradSlug || currentParams.get('loc') || 'all';
    const rad = currentParams.get('radius') || '50';
    const minP = currentParams.get('minP') || '';
    const maxP = currentParams.get('maxP') || '';

    if (cat !== localActiveFilter) setLocalActiveFilter(cat);
    if (q !== searchTerm) setSearchTerm(q);
    if (loc !== filterLocation) setFilterLocation(loc);
    if (rad !== filterRadius) setFilterRadius(rad);
    if (minP !== minPrice) setMinPrice(minP);
    if (maxP !== maxPrice) setMaxPrice(maxP);
  }, [searchParamsStr, gradSlug, kategorijaSlug]);

  const handleApplyFilters = () => {
    const loc = filterLocation !== 'all' ? filterLocation : null;
    const cat = localActiveFilter !== 'all' ? localActiveFilter : null;
    
    let newPath = '/alat-i-oprema';
    if (loc) {
      newPath = cat ? `/alat-i-oprema/${cat}/${loc}` : `/alat-i-oprema/lokacija/${loc}`;
    } else if (cat) {
      newPath = `/alat-i-oprema/${cat}`;
    }

    const newParams = new URLSearchParams();
    if (searchTerm.trim()) newParams.set('q', searchTerm.trim());
    if (loc && filterRadius && filterRadius !== '50') newParams.set('radius', filterRadius);
    if (minPrice) newParams.set('minP', minPrice);
    if (maxPrice) newParams.set('maxP', maxPrice);

    const currentPath = window.location.pathname;
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
  };

  return (
    <BaseNichePage
      seoType="alat-i-oprema"
      grad={gradSlug ?? undefined}
      zanimanje={kategorijaSlug ?? undefined}
      jsonLd={[
        generateProductListSchema(
          items.slice(0, 20).map(item => ({
            name: item.title,
            url: `${APP_CONFIG.BASE_URL}/alat-i-oprema/${item.categoryId}/${item.id}`,
            description: item.description,
            image: item.images?.[0]
          })),
          {
            name: "Tržište Mašina i Opreme",
            description: "Najveća ponuda polovnih i novih građevinskih mašina",
            url: `${APP_CONFIG.BASE_URL}/alat-i-oprema${kategorijaSlug ? `/${kategorijaSlug}` : ''}${gradSlug ? `/${gradSlug}` : ''}`
          }
        )
      ]}
      heroBadge="B2B i P2P ALAT I OPREMA"
      heroTitle="ALAT I"
      heroTitleAccent="OPREMA"
      heroSubtitle="Specijalizovana ponuda za polovan alat i građevinsku opremu. Sistemska rešenja za nabavku bez posrednika, direktno na gradilište."
      heroStats={[
        { label: "Aktivni Oglasi", value: marketplaceStats?.total?.toLocaleString() || "1.4K", icon: "inventory_2" },
        { label: "Novo Danas", value: `+${marketplaceStats?.today?.toLocaleString() || "40"}`, icon: "new_releases" },
        { label: "Premium", value: marketplaceStats?.premium?.toLocaleString() || "100", icon: "verified" }
      ]}
      filterConfig={{
        searchQuery: searchTerm,
        onSearchChange: setSearchTerm,
        searchPlaceholder: "Npr. Hilti, skele, kran...",
        selectedLocation: filterLocation,
        onLocationChange: setFilterLocation,
        onApplyFilters: handleApplyFilters,
      }}
      heroChildren={
        <div className="mt-8 flex flex-col md:flex-row gap-4 max-w-4xl w-full">
          <div className="flex-1 bg-[#13212e]/40 backdrop-blur-3xl border border-white/5 rounded-[10px] flex items-center pl-4 md:pl-8 p-1 shadow-3xl transition-all focus-within:border-secondary/50 focus-within:bg-[#192735]/60 hover:bg-[#192735]/40 group">
            <span className="material-symbols-outlined text-secondary text-2xl font-black group-focus-within:rotate-12 transition-transform">search</span>
            <input
              type="text"
              placeholder="PRETRAŽI ALAT I OPREMU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="w-full !bg-transparent !border-none !backdrop-blur-none outline-none text-white placeholder:text-white/20 text-[10px] font-black uppercase tracking-[0.2em] py-4 md:py-5 px-3 md:px-6" 
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
      }
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content Area */}
          <div className="flex-1 space-y-4">
             <ActiveFilterChips 
               filters={filterChips} 
               onRemove={removeFilterChip} 
               onClearAll={handleResetAllFilters} 
             />

             <div className="flex justify-between items-end border-b border-white/5 pb-6">
            <div className="flex items-start gap-4">
              <div className="w-[8px] h-16 bg-secondary mt-1"></div>
              <div>
                <h2 className="text-[38px] leading-[36px] font-black text-white uppercase tracking-tighter">
                  AKTIVNA <br /> <span className="text-secondary">PONUDA</span>
                </h2>
                <p className="text-[12px] font-black mt-2 tracking-widest uppercase">
                  <span className="text-white/40">ukupno:</span> <span className="text-secondary">{totalMarketplaceCount} oglasa u opticaju</span>
                </p>
              </div>
            </div>

              <div className="flex items-center gap-6">
                <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
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

            {loading && items.length === 0 ? (
              <LoadingState />
            ) : items.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/alat-i-oprema/oglas/${item.id}`)}
                      className={`group relative h-full bg-[#111a22]/60 backdrop-blur-xl border border-white/5 rounded-[10px] transition-all duration-500 hover:border-secondary/30 hover:shadow-[0_0_30px_rgba(254,191,13,0.05)] hover:-translate-y-1 flex flex-col overflow-hidden ${item.isPremium ? 'border-secondary/30 bg-secondary/[0.02] shadow-[0_0_40px_rgba(254,191,13,0.08)]' : ''}`}
                    >
                      <div className="h-52 relative overflow-hidden bg-slate-950">
                        {item.image ? (
                          <OptimizedImage
                            src={item.image}
                            placeholder={item.imagePlaceholders?.[0]}
                            alt={item.title}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                            containerClassName="h-full w-full"
                            isProcessing={item.imageStatus === 'processing'}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-white/5 italic">inventory_2</span>
                          </div>
                        )}
                        
                        {/* Action Overlays */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                           <span className="px-2 py-0.5 bg-secondary !text-black rounded-sm text-[8px] font-black tracking-widest uppercase shadow-lg">
                             {MARKETPLACE_CATEGORIES.find(c => c.id === item.categoryId)?.shortName || item.categoryId}
                           </span>
                           {item.isUrgent && (
                             <span className="px-2 py-0.5 bg-red-600 text-white rounded-sm text-[8px] font-black tracking-widest uppercase shadow-lg flex items-center gap-1">
                               <span className="material-symbols-outlined text-[10px]">bolt</span> HITNO
                             </span>
                           )}
                        </div>

                        {/* Price Overlay */}
                        <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-sm border border-white/10 shadow-2xl transition-transform group-hover:translate-x-1">
                           <div className="flex items-baseline gap-0.5 font-mono">
                             <span className="text-[10px] text-secondary font-black">€</span>
                             <span className="text-lg font-black text-white italic leading-none">{item.price}</span>
                           </div>
                        </div>

                        {/* Top Right Signals */}
                        {item.isPremium && (
                          <div className="absolute top-3 right-3">
                            <div className="bg-secondary/20 backdrop-blur-md w-6 h-6 rounded-sm flex items-center justify-center border border-secondary/30 shadow-lg">
                              <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            </div>
                          </div>
                        )}

                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#111a22] to-transparent pointer-events-none"></div>
                      </div>

                      <div className="p-5 pt-3 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                           <span className="text-[7px] font-black tracking-[0.3em] text-white/30 uppercase">IZVOR:</span>
                           <span className="text-[8px] font-black text-secondary uppercase tracking-widest opacity-80 italic">SZG TRŽIŠTE</span>
                        </div>

                        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4 group-hover:text-secondary transition-colors duration-300 line-clamp-2 leading-tight italic">
                          {item.title}
                        </h3>

                        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-1 leading-none">Lokacija</span>
                            <div className="flex items-center text-white/40 text-[9px] font-bold uppercase tracking-widest leading-none">
                              <span className="material-symbols-outlined text-[12px] mr-1 text-secondary">location_on</span>
                              {item.location}
                            </div>
                          </div>
                          <div className="flex flex-col text-right">
                            <span className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-1 leading-none">Objavljeno</span>
                            <div className="flex items-center text-white/40 text-[9px] font-bold uppercase tracking-widest leading-none font-mono">
                              {item.createdAt ? formatDate(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt) : 'SADA'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <NoResults 
                message="Promenite filtere ili kategoriju pretrage." 
                icon="inventory_2" 
              />
            )}

            {isDeepPagingLimitReached && (
              <div className="pt-12 text-center flex justify-center">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-center max-w-lg">
                  <p className="text-xs text-red-400 font-bold">
                    Dosegli ste limit listanja. Za specifičnije rezultate, molimo koristite konkretne filtere i pretragu gore.
                  </p>
                </div>
              </div>
            )}

            {hasMore && (
              <div className="pt-12 text-center">
                <button
                  onClick={() => loadMore()}
                  disabled={loading}
                  className="bg-white/5 text-white h-16 px-16 rounded-[10px] font-black uppercase text-xs tracking-[0.2em] hover:bg-white/10 transition-all border border-white/10"
                >
                  {loading ? 'UČITAVANJE...' : 'UČITAJ JOŠ OGLASA'}
                </button>
              </div>
            )}

            <div className="mt-4">
              <VerticalCTA 
                title="PRODAJETE ALAT ILI OPREMU?"
                description="POSTAVITE OGLAS U NAŠEM MARKETU I DOĐITE DO KUPACA IZ STRUKE BRZO I JEDNOSTAVNO. BEZ PROVIZIJE."
                buttonText="POSTAVI OGLAS"
                buttonLink="/postavi-oglas"
                icon={Store}
              />
            </div>
          </div>

          {/* Side Info / Filters */}
          <FilterSidebar>
            <MarketStatsWidget 
              stats={{ 
                total: marketplaceStats?.total || 1400, 
                trend: marketplaceStats?.today?.toString() || "40", 
                category: "PRODAJA/NAJAM" 
              }} 
            />
            {/* Lokacija - Prva na vrhu */}
            <FilterSection title="LOKACIJA">
              <div className="space-y-4">
                <LocationCombobox 
                  selectedLocation={filterLocation && filterLocation !== 'all' ? filterLocation : null}
                  onChange={(slug) => setFilterLocation(slug || 'all')}
                />
                
                {filterLocation && filterLocation !== 'all' && (
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

            {/* Cenovni rang - Odmah ispod lokacije */}
            <FilterSection title="CENOVNI RANG (€)">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-xs text-white outline-none focus:border-secondary/50 placeholder:text-white/20"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-[10px] px-4 py-3 text-xs text-white outline-none focus:border-secondary/50 placeholder:text-white/20"
                  />
                </div>
              </div>
            </FilterSection>

            {/* Clear All Button */}
            {(localActiveFilter !== 'all' || (filterLocation && filterLocation !== 'all') || searchTerm || minPrice || maxPrice || filterRadius !== '50') && (
              <FilterClearButton 
                onClick={() => {
                  setLocalActiveFilter('all');
                  setFilterLocation('all');
                  setFilterRadius('50');
                  setSearchTerm('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSearchParams(new URLSearchParams(), { preventScrollReset: true });
                }} 
              />
            )}

            <FilterSection title="KATEGORIJE">
              <div className="space-y-3">
                <FilterRadio 
                  name="mpcat" 
                  label="Svi Oglasi" 
                  checked={localActiveFilter === 'all'} 
                  onChange={() => {
                    setLocalActiveFilter('all');
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('cat');
                    setSearchParams(newParams, { preventScrollReset: true });
                  }} 
                />
                {MARKETPLACE_CATEGORIES.map(cat => (
                  <FilterRadio 
                    key={cat.id} 
                    name="mpcat" 
                    label={cat.name} 
                    checked={localActiveFilter === cat.id} 
                    onChange={() => {
                      setLocalActiveFilter(cat.id);
                      const newParams = new URLSearchParams(searchParams);
                      newParams.set('cat', cat.id);
                      setSearchParams(newParams, { preventScrollReset: true });
                    }} 
                  />
                ))}
              </div>
            </FilterSection>

              <FilterCTA 
              title="PRODAJTE ALAT I OPREMU"
              description="POSTAVITE OGLAS I BRZO PRODAJTE ILI IZNAJMITE SVOJU POLOVNU I NOVU OPREMU."
              buttonText="POSTAVI OGLAS"
              onClick={() => navigate('/postavi-oglas')}
              icon="sell"
            />
          </FilterSidebar>
        </div>
      </div>
    </BaseNichePage>
  );
}
