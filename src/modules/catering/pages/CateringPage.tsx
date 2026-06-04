import { VirtuosoGrid } from 'react-virtuoso';
import { motion } from 'motion/react';
import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Breadcrumbs } from '@/src/components/Breadcrumbs';
import DynamicSEO from '@/src/components/DynamicSEO';
import { generateFoodEstablishmentListSchema } from '@/src/lib/seoSchema';
import LoadingState from '@/src/components/LoadingState';
import NoResults from '@/src/components/ui/NoResults';
import SeoContentBlock from '@/src/components/SeoContentBlock';
import { CrossVerticalHub } from '@/src/components/CrossVerticalHub';
import ThemeToggle from '@/src/components/ThemeToggle';
import { APP_CONFIG } from '@/src/constants/config';
import { KITCHEN_TYPES, LOCATIONS } from '@/src/constants/taxonomy';
import { FilterSidebar, FilterClearButton, FilterSection, FilterToggle, FilterRadio, FilterSelect, FilterInput, FilterCTA, MarketStatsWidget, SortingBar } from '@/src/modules/core/components/filters/FilterComponents';
import { LocationCombobox } from '@/src/components/LocationCombobox';
import { useCateringList } from '@/src/modules/catering/hooks/useCatering';
import { useDebounce } from '@/src/hooks/useDebounce';
import { useCollectionStats } from '@/src/hooks/useCollectionStats';
import { UI_TOKENS } from '@/src/lib/uiTokens';
import { StandardPageHero } from '@/src/components/StandardPageHero';
import { OptimizedImage } from '@/src/components/OptimizedImage';
import { VerticalCTA } from '@/src/components/VerticalCTA';
import { ListingSkeleton } from '@/src/components/ListingSkeleton';
import { Utensils } from 'lucide-react';
import { CateringOffer } from '@/src/modules/catering/services/cateringService';

export default function CateringPage() {
  const { grad } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const searchParamsStr = searchParams.toString();

  // URL State as Single Source of Truth for Data Fetching
  const activeFilters = useMemo(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    return {
      location: grad && grad !== 'all' ? grad : null,
      radius: currentParams.get('radius') ? Number(currentParams.get('radius')) : undefined,
      kitchenType: currentParams.get('type') && currentParams.get('type') !== 'all' ? currentParams.get('type') : null,
      minOrder: currentParams.get('minOrder') ? Number(currentParams.get('minOrder')) : null,
      invoiceAvailable: currentParams.get('invoice') === 'true',
      dailyCapacity: currentParams.get('capacity') ? Number(currentParams.get('capacity')) : null,
      search: currentParams.get('q') || undefined
    };
  }, [grad, searchParamsStr]);
  
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data, isLoading: loading, fetchNextPage: loadMore, hasNextPage } = useCateringList(activeFilters);
  const isDeepPagingLimitReached = Boolean(hasNextPage && data?.pages && data.pages.length >= 11);
  const hasMore = hasNextPage && !isDeepPagingLimitReached;
  const { data: cateringStats } = useCollectionStats('caterings');

  const cateringsBase = useMemo(() => data?.pages.flatMap(page => page?.items || []) || [], [data]);
  const isEmptyFilter = !activeFilters || Object.keys(activeFilters).length === 0 || (Object.keys(activeFilters).length === 1 && (activeFilters as Record<string, unknown>).status === 'approved');
  const totalCateringsCount = data?.pages[0]?.totalHits ?? (isEmptyFilter ? cateringStats?.total : cateringsBase.length) ?? cateringsBase.length;

  const caterings = useMemo(() => {
    let result = [...cateringsBase];
    
    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => (Number(a.pricePerMeal || 0)) - (Number(b.pricePerMeal || 0)));
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => (Number(b.pricePerMeal || 0)) - (Number(a.pricePerMeal || 0)));
    }
    
    return result;
  }, [cateringsBase, sortBy]);
  
  // Local filter states for inputs (synced to URL on Apply)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filterLocation, setFilterLocation] = useState(grad || 'all');
  const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');
  const [minOrderFilter, setMinOrderFilter] = useState(searchParams.get('minOrder') || '');
  const [invoiceAvailableFilter, setInvoiceAvailableFilter] = useState(searchParams.get('invoice') === 'true');
  const [dailyCapacityFilter, setDailyCapacityFilter] = useState(searchParams.get('capacity') || '');
  const [filterRadius, setFilterRadius] = useState(searchParams.get('radius') || '50');

  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedMinOrder = useDebounce(minOrderFilter, 500);
  const debouncedCapacity = useDebounce(dailyCapacityFilter, 500);
  const debouncedRadius = useDebounce(filterRadius, 500);

  const handleApplyFilters = useCallback(() => {
    const desiredLoc = filterLocation || 'all';

    // Update Query Params
    const newParams = new URLSearchParams();
    
    // Update URL structure
    let newPath = '/ketering';
    if (desiredLoc !== 'all') {
      newPath = `/ketering/${desiredLoc}`;
      if (filterRadius && filterRadius !== '50') newParams.set('radius', filterRadius);
    }

    if (searchQuery.trim()) newParams.set('q', searchQuery.trim());
    if (filterType && filterType !== 'all') newParams.set('type', filterType);
    if (debouncedMinOrder) newParams.set('minOrder', debouncedMinOrder);
    if (invoiceAvailableFilter) newParams.set('invoice', 'true');
    if (debouncedCapacity) newParams.set('capacity', debouncedCapacity);

    const currentPath = window.location.pathname;
    const currentParams = searchParams.toString();
    const targetParams = newParams.toString();

    // STRICT NAVIGATION GUARD
    if (currentPath !== newPath || currentParams !== targetParams) {
      if (currentPath !== newPath) {
        navigate(`${newPath}?${targetParams}`, { preventScrollReset: true });
      } else {
        setSearchParams(newParams, { preventScrollReset: true });
      }
    }
  }, [
    filterLocation,
    filterRadius,
    searchQuery,
    filterType,
    debouncedMinOrder,
    invoiceAvailableFilter,
    debouncedCapacity,
    searchParams,
    navigate,
    setSearchParams
  ]);

  // Auto apply filters - strictly guarded to prevent loops
  React.useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const currentQ = currentParams.get('q') || '';
    const currentLoc = grad || 'all';
    const currentType = currentParams.get('type') || 'all';
    const currentMinOrder = currentParams.get('minOrder') || '';
    const currentInvoice = currentParams.get('invoice') === 'true';
    const currentCapacity = currentParams.get('capacity') || '';
    const currentRadius = currentParams.get('radius') || '50';

    const hasChanged = 
      debouncedSearch !== currentQ ||
      filterLocation !== currentLoc ||
      filterType !== currentType ||
      debouncedRadius !== currentRadius ||
      debouncedMinOrder !== currentMinOrder ||
      invoiceAvailableFilter !== currentInvoice ||
      debouncedCapacity !== currentCapacity;

    if (hasChanged) {
      handleApplyFilters();
    }
  }, [
    debouncedSearch, 
    debouncedMinOrder, 
    debouncedCapacity, 
    debouncedRadius, 
    filterLocation, 
    filterType, 
    invoiceAvailableFilter, 
    grad, 
    searchParamsStr, 
    handleApplyFilters
  ]);

  // Sync state with URL when searchParams change (handling back/forward)
  React.useEffect(() => {
    const currentParams = new URLSearchParams(searchParamsStr);
    const q = currentParams.get('q') || '';
    const type = currentParams.get('type') || 'all';
    const minOrder = currentParams.get('minOrder') || '';
    const invoice = currentParams.get('invoice') === 'true';
    const capacity = currentParams.get('capacity') || '';
    const rad = currentParams.get('radius') || '50';
    const loc = grad || 'all';

    if (q !== searchQuery) setSearchQuery(q);
    if (rad !== filterRadius) setFilterRadius(rad);
    if (type !== filterType) setFilterType(type);
    if (minOrder !== minOrderFilter) setSearchByMinOrder(minOrder);
    if (invoice !== invoiceAvailableFilter) setInvoiceAvailableFilter(invoice);
    if (capacity !== dailyCapacityFilter) setDailyCapacityFilter(capacity);
    if (loc !== filterLocation) setFilterLocation(loc);
  }, [searchParamsStr, grad]);

  // Main filter application logic
  function setSearchByMinOrder(val: string) {
    setMinOrderFilter(val);
  }

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setFilterLocation('all');
    setFilterRadius('50');
    setFilterType('all');
    setMinOrderFilter('');
    setInvoiceAvailableFilter(false);
    setDailyCapacityFilter('');
    navigate('/ketering');
  }, [navigate]);

  const locName = grad ? LOCATIONS.find(l => l.slug === grad)?.name : '';

  const itemListSchema = useMemo(() => generateFoodEstablishmentListSchema(
    caterings.slice(0, 20).map((cat) => ({
      name: cat.title,
      url: `${APP_CONFIG.BASE_URL}/ketering/provajder/${cat.id}`,
      description: cat.description,
      image: cat.images?.[0]
    })),
    {
      name: `Ketering servisi ${locName ? `u mestu ${locName}` : ''}`,
      description: `Katalog ketering firmi i kuvanih jela za gradilišta ${locName ? `iz mesta ${locName}` : 'širom Srbije'}.`,
      url: `${APP_CONFIG.BASE_URL}/ketering${grad ? `/${grad}` : ''}`,
    }
  ), [locName, grad, caterings]);

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary selection:text-on-secondary min-h-screen">
      <DynamicSEO type="ketering" grad={grad} jsonLd={itemListSchema} itemCount={totalCateringsCount} />
      
      <StandardPageHero
        badge="Industrial Food Solutions"
        title="Ketering"
        titleAccent="za radnike"
        subtitle="Sistemska rešenja za ishranu na gradilištima. Dnevni meni, kuvana jela i dostava sopstvenim vozilima."
        stats={[
          { label: "AKTIVNI RESTORANI", value: cateringStats?.total?.toLocaleString() || "48", icon: "restaurant" },
          { label: "DNEVNI MENIJI", value: cateringStats?.today?.toLocaleString() || "120", icon: "restaurant_menu" },
          { label: "PREMIUM PARTNERI", value: cateringStats?.premium?.toLocaleString() || "15", icon: "verified" }
        ]}
      >
        <div className="mt-8 flex flex-col md:flex-row gap-4 max-w-4xl">
          <div className="flex-1 bg-[#13212e]/40 backdrop-blur-3xl border border-white/5 rounded-[10px] flex items-center pl-8 p-1 shadow-3xl transition-all focus-within:border-secondary/50 focus-within:bg-[#192735]/60 hover:bg-[#192735]/40 group">
            <span className="material-symbols-outlined text-secondary text-2xl font-black group-focus-within:rotate-12 transition-transform">auto_awesome</span>
            <input 
              aria-label="Pretraga keteringa putem AI asistenta"
              type="text" 
              placeholder="NAĐI MI KETERING U NOVOM SADU SA 2 OBROKA..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/20 text-[10px] font-black uppercase tracking-[0.2em] py-5 px-6" 
            />
          </div>
          <button 
            onClick={handleApplyFilters}
            className="bg-secondary text-slate-950 px-12 h-16 rounded-[10px] font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white transition-all shadow-[0_20px_40px_rgba(254,191,13,0.2)] flex items-center justify-center gap-3 active:scale-95 shrink-0"
          >
            <span className="material-symbols-outlined text-xl">auto_awesome</span>
            <span>AI PRETRAGA</span>
          </button>
        </div>
      </StandardPageHero>

      <main className="max-w-7xl mx-auto px-8 py-12 flex flex-col-reverse lg:flex-row-reverse gap-12">
          
          {/* Sidebar Filters */}
          <FilterSidebar>
            <MarketStatsWidget 
              stats={{ 
                total: cateringStats?.total || 0, 
                trend: "8", 
                category: "DOSTAVA" 
              }} 
            />
            {/* Clear All Button */}
            {(filterType !== 'all' || minOrderFilter || filterLocation !== 'all' || invoiceAvailableFilter || dailyCapacityFilter || filterRadius !== '50') && (
              <FilterClearButton onClick={handleResetFilters} />
            )}

            <FilterSection title="LOKACIJA">
              <div className="space-y-4">
                <LocationCombobox 
                  selectedLocation={filterLocation !== 'all' ? filterLocation : null}
                  onChange={(slug) => setFilterLocation(slug || 'all')}
                />
                
                {filterLocation !== 'all' && (
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

            <FilterSection title="KAPACITET">
              <div className="space-y-4">
                <label className="text-[10px] text-white/40 font-bold uppercase mb-1 block ml-1">Minimalan broj obroka</label>
                <FilterInput
                  type="number"
                  value={dailyCapacityFilter}
                  onChange={(e) => setDailyCapacityFilter(e.target.value)}
                  placeholder="Npr. 50"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </FilterSection>

            {/* B2B Standards */}
            <FilterSection title="B2B Standardi">
              <div className="space-y-4">
                <FilterToggle 
                  label="Plaćanje na fakturu" 
                  checked={invoiceAvailableFilter} 
                  onChange={setInvoiceAvailableFilter} 
                />
              </div>
            </FilterSection>

            {/* Certificates */}
            <FilterSection title="Sertifikati">
              <div className="space-y-4">
                <FilterToggle 
                  label="HACCP Sertifikovan" 
                  checked={false} 
                  onChange={() => {}} 
                />
                <FilterToggle 
                  label="ISO 22000" 
                  checked={false} 
                  onChange={() => {}} 
                />
              </div>
            </FilterSection>

            <div className="flex justify-center mt-8">
              <ThemeToggle />
            </div>
            


            
          <FilterCTA 
            title="DODAJTE KETERING"
            description="POVEŽITE SVOJU KUHINJU SA VELIKIM GRADILIŠTIMA I OBEZBEDITE REDOVNE OBROKE ZA RADNIKE."
            buttonText="DODAJ PONUDU"
            onClick={() => navigate('/postavi-oglas')}
            icon="restaurant"
          />
            
            </FilterSidebar>

          {/* Main Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
            <div className="flex items-start gap-4">
              <div className="w-[8px] h-16 bg-secondary mt-1"></div>
              <div>
                <h3 className="text-[38px] leading-[36px] font-black text-white uppercase tracking-tighter">
                  Aktivna <br /> <span className="text-secondary">Ponuda</span>
                </h3>
                <p className="text-[12px] font-black mt-2 tracking-widest uppercase">
                  <span className="text-white/40">ukupno:</span> <span className="text-secondary">{totalCateringsCount} oglasa u opticaju</span>
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
              onChange={(val) => setSortBy(val as 'newest' | 'price-asc' | 'price-desc')}
            />

            <div className="w-full">
              {loading && caterings.length === 0 ? (
                <ListingSkeleton count={4} viewMode={viewMode} />
              ) : caterings.length === 0 ? (
                <NoResults />
              ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "flex flex-col gap-6"}>
                  {caterings.map((cat: CateringOffer) => (
                    <CateringCard key={cat.id} cat={cat} />
                  ))}
                </div>
              )}
            </div>

            {/* Load More Button */}
            {isDeepPagingLimitReached && (
              <div className="mt-12 flex justify-center">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-center max-w-lg">
                  <p className="text-xs text-red-400 font-bold">
                    Dosegli ste limit listanja. Za specifičnije rezultate, molimo koristite konkretne filtere i pretragu gore.
                  </p>
                </div>
              </div>
            )}

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button 
                  onClick={() => loadMore()}
                  disabled={loading}
                  className={UI_TOKENS.BTN_SECONDARY + " px-12 py-4 h-auto text-xs font-black"}
                >
                  {loading ? 'UČITAVANJE...' : 'UČITAJ JOŠ KETERING SERVISA'}
                </button>
              </div>
            )}

            {/* CTA Section */}
            <div className="mt-4">
              <VerticalCTA 
                title="NUDITE KETERING ZA GRADILIŠTA?"
                description="POSTAVITE SVOJU PONUDU I OBEZBEDITE REDOVNE OBROKE ZA VELIKE TIMOVE NA PROJEKTIMA ŠIROM SRBIJE."
                buttonText="DODAJ PONUDU"
                buttonLink="/postavi-oglas?paket=business"
                icon={Utensils}
              />
            </div>

          </div>
        </main>

      <CrossVerticalHub 
        gradSlug={!grad || grad === 'all' ? undefined : grad} 
        zanimanjeSlug={!searchParams.get('type') || searchParams.get('type') === 'SVE' ? undefined : searchParams.get('type')!} 
        currentVertical="ketering" 
      />

      <SeoContentBlock type="ketering" grad={grad} zanimanje={searchParams.get('type') || undefined} />
    </div>
  );
}

const CateringCard = React.memo(({ cat }: { cat: CateringOffer }) => {
  return (
    <div className={`bg-[#111a22]/60 backdrop-blur-xl border border-white/5 rounded-[10px] overflow-hidden group hover:border-white/20 transition-colors flex flex-col relative duration-500 hover:shadow-[0_0_30px_rgba(254,191,13,0.05)] hover:-translate-y-1 ${cat.isPremium ? 'bg-secondary/[0.03] border-secondary/30 shadow-[0_0_40px_rgba(254,191,13,0.08)]' : ''}`}>
      <div className="h-48 relative overflow-hidden">
        <OptimizedImage
          src={cat.images?.[0] || ""}
          placeholder={cat.imagePlaceholders?.[0]}
          alt={cat.title}
          className="w-full h-full object-cover aspect-video group-hover:scale-105 transition-transform duration-500"
          containerClassName="h-full w-full"
          isProcessing={cat.imageStatus === 'processing'}
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
           {cat.isUrgent && (
             <div className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest shadow-lg w-fit">
               🔥 HITNO
             </div>
           )}
           {cat.isPremium && (
             <div className="bg-secondary text-slate-950 text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 uppercase tracking-widest shadow-lg w-fit">
               ⭐ PREMIUM
             </div>
           )}
        </div>
        <div className="absolute bottom-4 right-4 bg-[#111a22]/80 backdrop-blur-md text-white font-bold px-3 py-1.5 rounded-[10px] text-sm shadow-lg flex items-center gap-1 border border-white/10">
          <span className="text-secondary">{cat.pricePerMeal} RSD</span> <span className="text-on-surface-variant text-xs font-normal">/ obrok</span>
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
           {cat.companyLogo ? (
             <OptimizedImage 
               src={cat.companyLogo} 
               fallbackType="company" 
               alt={cat.companyName || "Logo"} 
               className="w-6 h-6 rounded-sm object-cover" 
               containerClassName="w-6 h-6 rounded-sm bg-white overflow-hidden border border-white/10 shrink-0"
             />
           ) : (
             <div className="w-6 h-6 rounded-sm bg-white/5 flex items-center justify-center font-black text-white/20 uppercase text-[6px] border border-white/5">
               {cat.companyName?.charAt(0) || 'K'}
             </div>
           )}
           <div className="flex items-center gap-1">
             <span className="text-[7px] font-black text-white/40 uppercase tracking-widest leading-none">{cat.companyName || 'PONUĐAČ'}</span>
             {cat.isCompanyVerified && (
               <span className="material-symbols-outlined text-blue-400 text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
             )}
           </div>
        </div>

        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-black text-white uppercase tracking-tight italic line-clamp-1">{cat.title}</h3>
          <div className="flex items-center gap-1 text-secondary font-black text-[10px] bg-secondary/10 px-1.5 py-0.5 rounded-sm font-mono">
            <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: '"FILL" 1' }}>star</span> 5.0
          </div>
        </div>
        
        <p className="text-white/40 text-[11px] mb-4 flex-1 line-clamp-2 leading-relaxed">{cat.description}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
          <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-1 leading-none">Dostava</span>
            <div className="flex items-center gap-1 text-white/60 text-[9px] uppercase tracking-widest font-black">
              <span className="material-symbols-outlined text-[12px] text-secondary">delivery_dining</span> {cat.deliveryZone}
            </div>
          </div>
          <Link to={`/ketering/provajder/${cat.id}`} className="text-secondary font-black text-[9px] flex items-center gap-1 hover:underline uppercase tracking-widest">
            Detalji <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
});

CateringCard.displayName = "CateringCard";
